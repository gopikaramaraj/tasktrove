'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LiveCheckinRoomManager, type RemotePeerInfo } from '@/lib/liveCheckinWebrtc';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RemotePeerState {
  stream: MediaStream;
  displayName: string;
  avatarUrl: string;
}

interface LiveCheckinDialogProps {
  triggerButton: React.ReactNode;
  challengeTitle?: string;
  communityId: string;
  roomId?: string;
}

// used to force video playback after a user gesture (autoplay policies)
interface PlayTriggerProps {
  playTrigger: number;
}

// ─── Local Video Tile ────────────────────────────────────────────────────────

function LocalVideoTile({ stream, playTrigger, addDebug }: { stream: MediaStream | null; playTrigger: number; addDebug?: (msg: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    console.log('[LocalVideoTile] effect run', { stream, playTrigger });
    addDebug?.(`[LocalVideoTile] effect run stream=${!!stream} trigger=${playTrigger}`);
    if (videoEl && stream) {
      console.log('[LocalVideoTile] attaching stream', stream);
      addDebug?.('[LocalVideoTile] attaching stream');
      // ensure muted so autoplay won't be blocked
      videoEl.muted = true;
      videoEl.srcObject = stream;

      const playVideo = () => {
        console.log('[LocalVideoTile] attempting play');
        addDebug?.('[LocalVideoTile] attempting play');
        videoEl.play().catch((err) => console.warn('Local video play failed:', err));
      };

      if (videoEl.readyState >= 1) {
        playVideo();
      } else {
        videoEl.onloadedmetadata = playVideo;
      }

      // also try again when the first frame is ready
      const onLoadedData = () => {
        console.log('[LocalVideoTile] loadeddata event');
        addDebug?.('[LocalVideoTile] loadeddata');
        playVideo();
      };
      videoEl.addEventListener('loadeddata', onLoadedData);

      if (playTrigger > 0) {
        console.log('[LocalVideoTile] playTrigger > 0, replay');
        addDebug?.('[LocalVideoTile] playTrigger replay');
        playVideo();
      }

      // if the underlying track becomes unmuted/active later (e.g. after permissions), retry
      const track = stream.getVideoTracks()[0];
      let cleanupTrack: (() => void) | null = null;
      if (track) {
        const onUnmute = () => {
          console.log('[LocalVideoTile] track unmute event');
          addDebug?.('[LocalVideoTile] track unmute');
          playVideo();
        };
        track.addEventListener('unmute', onUnmute);
        cleanupTrack = () => track.removeEventListener('unmute', onUnmute);
      }

      return () => {
        videoEl.onloadedmetadata = null;
        videoEl.removeEventListener('loadeddata', onLoadedData);
        if (cleanupTrack) cleanupTrack();
      };
    }
    // include playTrigger to re-run when the user interacts with the page
  }, [stream, playTrigger]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      autoPlay
      muted
      playsInline
    />
  );
}

// ─── Remote Video Tile ───────────────────────────────────────────────────────

function RemoteVideoTile({ peer, peerId, playTrigger, addDebug }: { peer: RemotePeerState; peerId: string; playTrigger: number; addDebug?: (msg: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && peer.stream) {
      // ensure element is muted before attempting playback so autoplay isn't blocked
      videoEl.muted = true;
      videoEl.srcObject = peer.stream;

      const playVideo = () => {
        videoEl.play().catch((err) => console.warn('Remote video play failed:', err));
      };

      if (videoEl.readyState >= 1) {
        playVideo();
      } else {
        videoEl.onloadedmetadata = playVideo;
      }

      // if we already have a user gesture, unmute and play again so audio flows
      if (playTrigger > 0) {
        videoEl.muted = false;
        setMuted(false);
        playVideo();
      }

      // retry when the incoming track becomes unmuted
      const track = peer.stream.getVideoTracks()[0];
      let cleanupTrack: (() => void) | null = null;
      if (track) {
        const onUnmute = () => {
          playVideo();
        };
        track.addEventListener('unmute', onUnmute);
        cleanupTrack = () => track.removeEventListener('unmute', onUnmute);
      }

      return () => {
        if (videoEl) {
          videoEl.srcObject = null;
          videoEl.onloadedmetadata = null;
        }
        if (cleanupTrack) cleanupTrack();
      };
    }
    return undefined;
  }, [peer.stream, playTrigger]);

  const hasVideo = peer.stream.getVideoTracks().some((t) => t.enabled && !t.muted);

  return (
    <div className="relative w-full h-full bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[120px]">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={muted}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Avatar className="h-16 w-16">
            <AvatarImage src={peer.avatarUrl} />
            <AvatarFallback className="text-2xl bg-slate-700 text-slate-300">
              {peer.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
        {peer.displayName}
      </span>
    </div>
  );
}

// ─── Video Grid Layout ───────────────────────────────────────────────────────

function VideoGrid({ children, count }: { children: React.ReactNode; count: number }) {
  let gridClass = 'grid-cols-1';
  if (count === 2) gridClass = 'grid-cols-2';
  else if (count >= 3 && count <= 4) gridClass = 'grid-cols-2';
  else if (count >= 5) gridClass = 'grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-2 w-full h-full auto-rows-fr`}>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LiveCheckinDialog({
  triggerButton,
  challengeTitle = 'Live Check-in',
  communityId,
  roomId: roomIdProp,
}: LiveCheckinDialogProps) {
  const roomId = roomIdProp || 'default';
  const { user, userData } = useAuth();
  const { toast } = useToast();

  // Dialog & connection state
  const [isOpen, setIsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // user interaction trigger (autoplay policies)
  const [playTrigger, setPlayTrigger] = useState(0);
  const registerInteraction = useCallback(() => setPlayTrigger((n) => n + 1), []);

  // Media controls
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeerState>>(new Map());
  const [participantCount, setParticipantCount] = useState(0);

  // on-screen debug panel
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const addDebug = useCallback((msg: string) => {
    setDebugMessages((prev) => [...prev, msg].slice(-50));
    console.log(msg);
  }, []);

  useEffect(() => {
  }, [localStream, addDebug]);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const managerRef = useRef<LiveCheckinRoomManager | null>(null);

  // Participant display name cache from Firestore
  const participantInfoRef = useRef<Map<string, { displayName: string; avatarUrl: string }>>(new Map());

  // Listen to participant info for display names
  useEffect(() => {
    if (!isJoined) return;

    const colRef = collection(
      db,
      `communities/${communityId}/liveRooms/${roomId}/participants`
    );

    const unsub = onSnapshot(colRef, (snapshot) => {
      const info = new Map<string, { displayName: string; avatarUrl: string }>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        info.set(doc.id, {
          displayName: data.displayName || doc.id.slice(0, 8),
          avatarUrl: data.avatarUrl || '',
        });
      });
      participantInfoRef.current = info;

      // Update any existing remote peers with correct display names
      setRemotePeers((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [peerId, peerState] of next) {
          const peerInfo = info.get(peerId);
          if (peerInfo && (peerState.displayName !== peerInfo.displayName || peerState.avatarUrl !== peerInfo.avatarUrl)) {
            next.set(peerId, { ...peerState, displayName: peerInfo.displayName, avatarUrl: peerInfo.avatarUrl });
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    return () => unsub();
  }, [isJoined, communityId, roomId]);

  // Cleanup on unmount or dialog close
  const cleanup = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.leave();
      managerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemotePeers(new Map());
    setIsJoined(false);
    setIsConnecting(false);
    setParticipantCount(0);
    setMicOn(true);
    setVideoOn(true);
  }, []);

  // Handle dialog open/close
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // beforeunload handler for tab-close
  useEffect(() => {
    if (!isJoined) return;

    const handleBeforeUnload = () => {
      managerRef.current?.leave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isJoined]);

  // Remove the useEffect since we'll use a ref callback directly on the video element

  // ─── Join Room ─────────────────────────────────────────────────────────

  const joinRoom = async () => {
    if (!user || !userData) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'Please log in to join a live check-in.',
      });
      return;
    }

    setIsConnecting(true);

    try {
      // register the fact that the user clicked join (gesture for autoplay)
      registerInteraction();
      // 1. Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasCameraPermission(true);
      // in case the initial play call was blocked by the permission prompt,
      // re-trigger playback once we have the stream
      registerInteraction();

      // 2. Create manager
      const manager = new LiveCheckinRoomManager({
        communityId,
        roomId,
        userId: user.uid,
        displayName: userData.name || user.email || 'Anonymous',
        avatarUrl: userData.avatarUrl || '',
      });

      // 3. Wire callbacks
      manager.onRemoteStream = (info: RemotePeerInfo) => {
        const peerInfo = participantInfoRef.current.get(info.peerId);
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.set(info.peerId, {
            stream: info.stream,
            displayName: peerInfo?.displayName || info.displayName || info.peerId.slice(0, 8),
            avatarUrl: peerInfo?.avatarUrl || info.avatarUrl || '',
          });
          return next;
        });
      };

      manager.onPeerLeft = (peerId: string) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      };

      manager.onParticipantCount = (count: number) => {
        setParticipantCount(count);
      };

      manager.onError = (error: Error) => {
        console.error('[LiveCheckin] Error:', error);
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: error.message || 'An error occurred with the live check-in.',
        });
      };

      managerRef.current = manager;

      // 4. Join
      await manager.join(stream);
      setIsJoined(true);
    } catch (error) {
      console.error('[LiveCheckin] Error joining room:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // ─── Leave Room ────────────────────────────────────────────────────────

  const leaveRoom = async () => {
    await cleanup();
    setIsOpen(false);
  };

  // ─── Media Controls ────────────────────────────────────────────────────

  const toggleMic = () => {
    registerInteraction();
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    registerInteraction();
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const totalTiles = 1 + remotePeers.size; // local + remotes

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        {/* always-visible debug overlay */}
        {debugMessages.length > 0 && (
          <div className="fixed top-4 right-4 max-h-40 w-1/3 overflow-auto text-xs bg-black/75 text-white p-2 rounded z-50">
            <pre className="whitespace-pre-wrap">{debugMessages.join('\n')}</pre>
          </div>
        )}
        {!isJoined ? (
          /* ── Pre-Join Screen ──────────────────────────────────────── */
          <div className="flex flex-col items-center p-8 gap-6">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-headline">{challengeTitle}</DialogTitle>
              <DialogDescription>
                Start your camera and microphone to join the live check-in.
              </DialogDescription>
            </DialogHeader>

            {!hasCameraPermission && (
              <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera and microphone access, then try again.
                </AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              onClick={joinRoom}
              disabled={isConnecting || !user}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Join Live Check-in
                </>
              )}
            </Button>
          </div>
        ) : (
          /* ── In-Call View ─────────────────────────────────────────── */
          <div className="flex flex-col h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold font-headline">{challengeTitle}</h2>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {participantCount}
                </Badge>
              </div>
            </div>

            {/* Video Grid Area */}
            <div className="flex-1 bg-slate-900 p-3 overflow-auto relative" onClick={registerInteraction}>
              <VideoGrid count={totalTiles}>
                {/* Local video tile */}
                <div className="relative w-full h-full bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[120px]">
                  <LocalVideoTile stream={localStream} playTrigger={playTrigger} addDebug={addDebug} />
                  {!videoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <Avatar className="h-16 w-16">
                        {userData?.avatarUrl && <AvatarImage src={userData.avatarUrl} />}
                        <AvatarFallback className="text-2xl bg-slate-700 text-slate-300">
                          {userData?.name?.charAt(0)?.toUpperCase() || 'Y'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    You
                  </span>
                  {!micOn && (
                    <span className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded-full">
                      <MicOff className="h-3 w-3" />
                    </span>
                  )}
                </div>

                {/* Remote video tiles */}
                {Array.from(remotePeers.entries()).map(([peerId, peer]) => (
                  <RemoteVideoTile key={peerId} peerId={peerId} peer={peer} playTrigger={playTrigger} addDebug={addDebug} />
                ))}
              </VideoGrid>

              {remotePeers.size === 0 && (
                <p className="text-center text-slate-400 text-sm mt-4 animate-pulse">
                  Waiting for other participants to join…
                </p>
              )}

              {/* debug panel */}
              {debugMessages.length > 0 && (
                <div className="absolute bottom-2 right-2 max-h-24 w-3/4 overflow-auto text-xs bg-black/80 text-white p-2 rounded">
                  <pre className="whitespace-pre-wrap">{debugMessages.join('\n')}</pre>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-4 px-4 py-4 border-t bg-background">
              <Button
                variant={micOn ? 'outline' : 'destructive'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleMic}
                title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micOn ? <Mic /> : <MicOff />}
              </Button>

              <Button
                variant={videoOn ? 'outline' : 'destructive'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleVideo}
                title={videoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoOn ? <Video /> : <VideoOff />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-14 w-14"
                onClick={leaveRoom}
                title="Leave check-in"
              >
                <PhoneOff />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
