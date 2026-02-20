import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    type Unsubscribe,
    getDocs,
    orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiveCheckinConfig {
    communityId: string;
    roomId: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
}

export interface RemotePeerInfo {
    peerId: string;
    stream: MediaStream;
    displayName: string;
    avatarUrl: string;
}

export interface SignalMessage {
    type: 'offer' | 'answer' | 'ice-candidate';
    from: string;
    to: string;
    payload: Record<string, unknown>;
    createdAt: Timestamp | null;
}

interface ParticipantDoc {
    displayName: string;
    avatarUrl: string;
    joinedAt: Timestamp;
    lastActive: Timestamp;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
];

const HEARTBEAT_INTERVAL_MS = 30_000;
const STALE_THRESHOLD_MS = 60_000;
const PEER_CONNECTION_CONFIG: RTCConfiguration = {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
};

// ─── Helper: Firestore paths ─────────────────────────────────────────────────

function roomDocPath(communityId: string, roomId: string) {
    return `communities/${communityId}/liveRooms/${roomId}`;
}
function participantsColPath(communityId: string, roomId: string) {
    return `${roomDocPath(communityId, roomId)}/participants`;
}
function signalsColPath(communityId: string, roomId: string) {
    return `${roomDocPath(communityId, roomId)}/signals`;
}

// ─── LiveCheckinRoomManager ──────────────────────────────────────────────────

export class LiveCheckinRoomManager {
    private config: LiveCheckinConfig;
    private localStream: MediaStream | null = null;

    // Peer state
    private peerConnections = new Map<string, RTCPeerConnection>();
    private remoteStreams = new Map<string, MediaStream>();
    private pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();

    // Firestore unsubscribers
    private unsubParticipants: Unsubscribe | null = null;
    private unsubSignals: Unsubscribe | null = null;

    // Heartbeat
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private staleCleanupTimer: ReturnType<typeof setInterval> | null = null;

    // Known participants (to detect joins/leaves)
    private knownPeers = new Set<string>();

    // Processed signal doc IDs to avoid re-processing
    private processedSignals = new Set<string>();

    // Callbacks
    public onRemoteStream: ((info: RemotePeerInfo) => void) | null = null;
    public onPeerLeft: ((peerId: string) => void) | null = null;
    public onError: ((error: Error) => void) | null = null;
    public onParticipantCount: ((count: number) => void) | null = null;

    private destroyed = false;

    constructor(config: LiveCheckinConfig) {
        this.config = config;
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Join the room: write participant doc, start listening for peers & signals.
     */
    async join(localStream: MediaStream): Promise<void> {
        this.localStream = localStream;

        try {
            // 1. Ensure room doc exists
            const roomRef = doc(db, roomDocPath(this.config.communityId, this.config.roomId));
            await setDoc(roomRef, {
                createdAt: serverTimestamp(),
                createdBy: this.config.userId,
            }, { merge: true });

            // 2. Write own participant doc
            await this.writeParticipantDoc();

            // 3. Start listeners
            this.listenToParticipants();
            this.listenToSignals();

            // 4. Start heartbeat
            this.startHeartbeat();
        } catch (err) {
            this.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
     * Leave the room: tear down everything.
     */
    async leave(): Promise<void> {
        this.destroyed = true;

        // Stop heartbeat
        this.stopHeartbeat();

        // Unsubscribe Firestore listeners
        this.unsubParticipants?.();
        this.unsubSignals?.();
        this.unsubParticipants = null;
        this.unsubSignals = null;

        // Close all peer connections
        for (const [peerId, pc] of this.peerConnections) {
            pc.close();
            this.remoteStreams.delete(peerId);
        }
        this.peerConnections.clear();
        this.knownPeers.clear();
        this.processedSignals.clear();
        this.pendingIceCandidates.clear();

        // Remove own participant doc
        try {
            const participantRef = doc(
                db,
                participantsColPath(this.config.communityId, this.config.roomId),
                this.config.userId
            );
            await deleteDoc(participantRef);
        } catch {
            // Best effort
        }

        // Clean up own signal docs (best effort)
        try {
            await this.cleanupOwnSignals();
        } catch {
            // Best effort
        }
    }

    // ─── Firestore: Participant Management ───────────────────────────────────

    private async writeParticipantDoc(): Promise<void> {
        const participantRef = doc(
            db,
            participantsColPath(this.config.communityId, this.config.roomId),
            this.config.userId
        );
        await setDoc(participantRef, {
            displayName: this.config.displayName,
            avatarUrl: this.config.avatarUrl,
            joinedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
        });
    }

    private listenToParticipants(): void {
        const colRef = collection(
            db,
            participantsColPath(this.config.communityId, this.config.roomId)
        );

        this.unsubParticipants = onSnapshot(colRef, (snapshot) => {
            if (this.destroyed) return;

            const currentPeerIds = new Set<string>();

            snapshot.docs.forEach((docSnap) => {
                const peerId = docSnap.id;
                if (peerId === this.config.userId) return; // Skip self
                currentPeerIds.add(peerId);

                if (!this.knownPeers.has(peerId)) {
                    // New participant joined
                    this.knownPeers.add(peerId);
                    this.handleNewParticipant(peerId, docSnap.data() as ParticipantDoc);
                }
            });

            // Detect peers that left
            for (const existingPeerId of this.knownPeers) {
                if (!currentPeerIds.has(existingPeerId)) {
                    this.handlePeerLeft(existingPeerId);
                }
            }

            // Update count (including self)
            this.onParticipantCount?.(snapshot.docs.length);
        }, (error) => {
            this.onError?.(error);
        });
    }

    // ─── Firestore: Signal Handling ──────────────────────────────────────────

    private listenToSignals(): void {
        const colRef = collection(
            db,
            signalsColPath(this.config.communityId, this.config.roomId)
        );

        const q = query(colRef, orderBy('createdAt', 'asc'));

        this.unsubSignals = onSnapshot(q, (snapshot) => {
            if (this.destroyed) return;

            snapshot.docChanges().forEach((change) => {
                if (change.type !== 'added') return;

                const signalId = change.doc.id;
                if (this.processedSignals.has(signalId)) return;
                this.processedSignals.add(signalId);

                const signal = change.doc.data() as SignalMessage;

                // Only process signals addressed to us
                if (signal.to !== this.config.userId) return;

                this.handleSignal(signal, signalId);
            });
        }, (error) => {
            this.onError?.(error);
        });
    }

    private async handleSignal(signal: SignalMessage, signalId: string): Promise<void> {
        try {
            switch (signal.type) {
                case 'offer':
                    await this.handleOffer(signal);
                    break;
                case 'answer':
                    await this.handleAnswer(signal);
                    break;
                case 'ice-candidate':
                    await this.handleIceCandidate(signal);
                    break;
            }

            // Delete the signal doc after processing (cleanup)
            try {
                const signalRef = doc(
                    db,
                    signalsColPath(this.config.communityId, this.config.roomId),
                    signalId
                );
                await deleteDoc(signalRef);
            } catch {
                // Best effort cleanup
            }
        } catch (err) {
            console.error(`[LiveCheckin] Error handling signal ${signal.type} from ${signal.from}:`, err);
        }
    }

    private async handleOffer(signal: SignalMessage): Promise<void> {
        const peerId = signal.from;
        let pc = this.peerConnections.get(peerId);

        // If we already have a connection, close it and start fresh
        if (pc) {
            pc.close();
        }

        pc = this.createPeerConnection(peerId);
        this.peerConnections.set(peerId, pc);

        const sdp = signal.payload as unknown as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Apply any pending ICE candidates
        await this.applyPendingCandidates(peerId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer back
        await this.sendSignal({
            type: 'answer',
            from: this.config.userId,
            to: peerId,
            payload: { type: answer.type, sdp: answer.sdp } as unknown as Record<string, unknown>,
            createdAt: null,
        });
    }

    private async handleAnswer(signal: SignalMessage): Promise<void> {
        const peerId = signal.from;
        const pc = this.peerConnections.get(peerId);
        if (!pc) {
            console.warn(`[LiveCheckin] Received answer from unknown peer: ${peerId}`);
            return;
        }

        if (pc.signalingState !== 'have-local-offer') {
            console.warn(`[LiveCheckin] Ignoring answer in state: ${pc.signalingState}`);
            return;
        }

        const sdp = signal.payload as unknown as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Apply any pending ICE candidates
        await this.applyPendingCandidates(peerId);
    }

    private async handleIceCandidate(signal: SignalMessage): Promise<void> {
        const peerId = signal.from;
        const pc = this.peerConnections.get(peerId);
        const candidate = signal.payload as unknown as RTCIceCandidateInit;

        if (!pc || !pc.remoteDescription) {
            // Queue ICE candidates until remote description is set
            if (!this.pendingIceCandidates.has(peerId)) {
                this.pendingIceCandidates.set(peerId, []);
            }
            this.pendingIceCandidates.get(peerId)!.push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn(`[LiveCheckin] Error adding ICE candidate from ${peerId}:`, err);
        }
    }

    private async applyPendingCandidates(peerId: string): Promise<void> {
        const pending = this.pendingIceCandidates.get(peerId);
        if (!pending || pending.length === 0) return;

        const pc = this.peerConnections.get(peerId);
        if (!pc) return;

        for (const candidate of pending) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.warn(`[LiveCheckin] Error applying pending ICE candidate:`, err);
            }
        }
        this.pendingIceCandidates.delete(peerId);
    }

    private async sendSignal(signal: SignalMessage): Promise<void> {
        const colRef = collection(
            db,
            signalsColPath(this.config.communityId, this.config.roomId)
        );
        await addDoc(colRef, {
            ...signal,
            createdAt: serverTimestamp(),
        });
    }

    // ─── Peer Connection Management ──────────────────────────────────────────

    private handleNewParticipant(peerId: string, participantData: ParticipantDoc): void {
        // Deterministic offer direction: lower UID creates the offer
        if (this.config.userId < peerId) {
            this.initiateConnection(peerId, participantData);
        }
        // If our UID > peerId, we wait for their offer
    }

    private async initiateConnection(peerId: string, _participantData: ParticipantDoc): Promise<void> {
        try {
            const pc = this.createPeerConnection(peerId);
            this.peerConnections.set(peerId, pc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await this.sendSignal({
                type: 'offer',
                from: this.config.userId,
                to: peerId,
                payload: { type: offer.type, sdp: offer.sdp } as unknown as Record<string, unknown>,
                createdAt: null,
            });
        } catch (err) {
            console.error(`[LiveCheckin] Error initiating connection to ${peerId}:`, err);
            this.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
    }

    private createPeerConnection(peerId: string): RTCPeerConnection {
        const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

        // Add local tracks
        if (this.localStream) {
            for (const track of this.localStream.getTracks()) {
                pc.addTrack(track, this.localStream);
            }
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            if (this.destroyed) return;

            const [remoteStream] = event.streams;
            if (!remoteStream) return;

            this.remoteStreams.set(peerId, remoteStream);

            // Look up participant info from Firestore snapshot
            const participantRef = doc(
                db,
                participantsColPath(this.config.communityId, this.config.roomId),
                peerId
            );

            // We use the cached info or defaults
            this.onRemoteStream?.({
                peerId,
                stream: remoteStream,
                displayName: peerId, // Will be updated by the component
                avatarUrl: '',
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (this.destroyed || !event.candidate) return;

            this.sendSignal({
                type: 'ice-candidate',
                from: this.config.userId,
                to: peerId,
                payload: event.candidate.toJSON() as unknown as Record<string, unknown>,
                createdAt: null,
            }).catch((err) => {
                console.warn(`[LiveCheckin] Error sending ICE candidate to ${peerId}:`, err);
            });
        };

        // Handle connection state changes (reconnection logic)
        pc.onconnectionstatechange = () => {
            if (this.destroyed) return;

            const state = pc.connectionState;
            console.log(`[LiveCheckin] Connection to ${peerId}: ${state}`);

            if (state === 'failed') {
                // Tear down and re-initiate
                console.warn(`[LiveCheckin] Connection to ${peerId} failed, attempting reconnection...`);
                this.reconnectPeer(peerId);
            } else if (state === 'disconnected') {
                // Wait a bit before reconnecting — it may recover
                setTimeout(() => {
                    if (!this.destroyed && pc.connectionState === 'disconnected') {
                        console.warn(`[LiveCheckin] Connection to ${peerId} still disconnected, reconnecting...`);
                        this.reconnectPeer(peerId);
                    }
                }, 5_000);
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (this.destroyed) return;
            console.log(`[LiveCheckin] ICE state for ${peerId}: ${pc.iceConnectionState}`);
        };

        return pc;
    }

    private async reconnectPeer(peerId: string): Promise<void> {
        // Close existing connection
        const existingPc = this.peerConnections.get(peerId);
        if (existingPc) {
            existingPc.close();
            this.peerConnections.delete(peerId);
        }
        this.remoteStreams.delete(peerId);
        this.pendingIceCandidates.delete(peerId);

        // Re-initiate if we're the lower UID
        if (this.config.userId < peerId) {
            await this.initiateConnection(peerId, {} as ParticipantDoc);
        }
        // Otherwise, the other side will re-initiate
    }

    private handlePeerLeft(peerId: string): void {
        this.knownPeers.delete(peerId);

        const pc = this.peerConnections.get(peerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(peerId);
        }

        this.remoteStreams.delete(peerId);
        this.pendingIceCandidates.delete(peerId);
        this.onPeerLeft?.(peerId);
    }

    // ─── Heartbeat & Stale Detection ────────────────────────────────────────

    private startHeartbeat(): void {
        // Update lastActive periodically
        this.heartbeatTimer = setInterval(async () => {
            if (this.destroyed) return;
            try {
                const participantRef = doc(
                    db,
                    participantsColPath(this.config.communityId, this.config.roomId),
                    this.config.userId
                );
                await setDoc(participantRef, { lastActive: serverTimestamp() }, { merge: true });
            } catch {
                // Best effort
            }
        }, HEARTBEAT_INTERVAL_MS);

        // Check for stale peers periodically
        this.staleCleanupTimer = setInterval(() => {
            if (this.destroyed) return;
            this.cleanupStalePeers();
        }, STALE_THRESHOLD_MS);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.staleCleanupTimer) {
            clearInterval(this.staleCleanupTimer);
            this.staleCleanupTimer = null;
        }
    }

    private async cleanupStalePeers(): Promise<void> {
        try {
            const colRef = collection(
                db,
                participantsColPath(this.config.communityId, this.config.roomId)
            );
            const snapshot = await getDocs(colRef);
            const now = Date.now();

            snapshot.docs.forEach(async (docSnap) => {
                const peerId = docSnap.id;
                if (peerId === this.config.userId) return;

                const data = docSnap.data() as ParticipantDoc;
                if (data.lastActive) {
                    const lastActive = data.lastActive.toMillis();
                    if (now - lastActive > STALE_THRESHOLD_MS) {
                        console.warn(`[LiveCheckin] Removing stale peer: ${peerId}`);
                        try {
                            await deleteDoc(docSnap.ref);
                        } catch {
                            // Best effort
                        }
                    }
                }
            });
        } catch {
            // Best effort
        }
    }

    private async cleanupOwnSignals(): Promise<void> {
        const colRef = collection(
            db,
            signalsColPath(this.config.communityId, this.config.roomId)
        );
        const snapshot = await getDocs(colRef);

        const deletions = snapshot.docs
            .filter((d) => {
                const data = d.data() as SignalMessage;
                return data.from === this.config.userId || data.to === this.config.userId;
            })
            .map((d) => deleteDoc(d.ref));

        await Promise.allSettled(deletions);
    }
}
