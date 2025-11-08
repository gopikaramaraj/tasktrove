'use client';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserPlus, PlusCircle, Video, Settings, LogOut, Check } from 'lucide-react';
import type { Challenge, User, Community } from '@/lib/types';
import { ChallengeCard } from '@/components/communities/ChallengeCard';
import { Leaderboard } from '@/components/communities/Leaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveCheckinDialog } from '@/components/communities/LiveCheckinDialog';
import { useEffect, useState, use } from 'react';
import { collection, doc, getDoc, getDocs, writeBatch, deleteDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!id) return;
        setLoading(true);
        try {
            // Fetch community details
            const communityDocRef = doc(db, 'communities', id);
            const communityDoc = await getDoc(communityDocRef);
            if (communityDoc.exists()) {
                const communityData = { id: communityDoc.id, ...communityDoc.data() } as Community;
                setCommunity(communityData);

                // Fetch members (users) of the community
                const membersQuery = collection(db, 'communities', id, 'members');
                const membersSnapshot = await getDocs(membersQuery);
                const memberIds = membersSnapshot.docs.map(doc => doc.id);
                
                if (user && memberIds.includes(user.uid)) {
                    setIsMember(true);
                }

                if (memberIds.length > 0) {
                    const usersQuery = collection(db, 'users');
                    const usersSnapshot = await getDocs(usersQuery);
                    const allUsers = usersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as User);
                    const communityMembers = allUsers.filter(user => memberIds.includes(user.id));
                    setMembers(communityMembers);
                } else {
                    setMembers([]);
                }
            }
            
            // Fetch challenges for the community
            const challengesQuery = collection(db, 'communities', id, 'challenges');
            const challengesSnapshot = await getDocs(challengesQuery);
            const challengesList = challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
            setChallenges(challengesList);

        } catch (error) {
            console.error("Failed to fetch community data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load community details.' });
        }
        setLoading(false);
    };

    fetchCommunityData();
  }, [id, user, toast]);

  const handleJoinLeaveCommunity = async () => {
    if (!user || !community) return;
    setIsProcessing(true);

    const batch = writeBatch(db);
    const memberDocRef = doc(db, 'communities', community.id, 'members', user.uid);
    const communityDocRef = doc(db, 'communities', community.id);
    const currentUserData = members.find(m => m.id === user.uid);

    if (isMember) {
        // Leave community
        batch.delete(memberDocRef);
        batch.update(communityDocRef, { memberCount: increment(-1) });
        batch.commit()
            .then(() => {
                setMembers(prev => prev.filter(m => m.id !== user.uid));
                setCommunity(prev => prev ? {...prev, memberCount: prev.memberCount - 1} : null);
                setIsMember(false);
                toast({ title: 'Community Left', description: `You have left ${community.name}.` });
                setIsProcessing(false);
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: memberDocRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
                setIsProcessing(false);
            });
    } else {
        // Join community
        const memberData = { joinedAt: new Date(), role: 'member' };
        batch.set(memberDocRef, memberData);
        batch.update(communityDocRef, { memberCount: increment(1) });
        batch.commit()
            .then(async () => {
                if (currentUserData) {
                    setMembers(prev => [...prev, currentUserData]);
                } else {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if(userDoc.exists()) setMembers(prev => [...prev, userDoc.data() as User]);
                }
                setCommunity(prev => prev ? {...prev, memberCount: prev.memberCount + 1} : null);
                setIsMember(true);
                toast({ title: 'Community Joined!', description: `Welcome to ${community.name}!` });
                setIsProcessing(false);
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: memberDocRef.path,
                    operation: 'create',
                    requestResourceData: memberData,
                });
                errorEmitter.emit('permission-error', permissionError);
                setIsProcessing(false);
            });
    }
  }


  if (loading) {
    return <CommunityDetailSkeleton />
  }
  
  if (!community) {
      return <div>Community not found.</div>
  }

  const isOwner = user && community && user.uid === community.ownerId;
  const isPrivateAndNotMember = community.isPrivate && !isMember;

  return (
    <div className="space-y-8">
      <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden">
        <Image src={community.bannerUrl} layout="fill" objectFit="cover" alt={`${community.name} banner`} data-ai-hint="community technology" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-headline">{community.name}</h1>
          <p className="text-white/90 max-w-2xl mt-1">{community.description}</p>
        </div>
        <div className="absolute top-4 right-4">
            {user && (
                <Button 
                    className={isMember ? "bg-secondary hover:bg-secondary/80" : "bg-accent hover:bg-accent/90 text-accent-foreground"}
                    onClick={handleJoinLeaveCommunity}
                    disabled={isProcessing || (isOwner && isMember)}
                >
                    {isMember ? (isOwner ? <><Check className="mr-2 h-4 w-4" />Owner</> : <><LogOut className="mr-2 h-4 w-4" />Leave</>) : <><UserPlus className="mr-2 h-4 w-4" />Join</>}
                </Button>
            )}
        </div>
      </div>

      {isPrivateAndNotMember ? (
          <Card className="text-center p-8">
            <CardTitle>This community is private</CardTitle>
            <CardContent className="mt-4">
                <p>You must be a member to see its content.</p>
            </CardContent>
          </Card>
      ) : (
        <Tabs defaultValue="challenges" className="w-full">
            <TabsList className={cn("grid w-full", isOwner ? "grid-cols-5" : "grid-cols-4")}>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="checkins">Live Check-ins</TabsTrigger>
            {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
            </TabsList>
            <TabsContent value="challenges" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold font-headline">Active Challenges</h3>
                    {isOwner && (
                        <Button variant="outline" asChild>
                            <Link href={`/communities/${id}/challenges/create`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Challenge
                            </Link>
                        </Button>
                    )}
                </div>
                {challenges.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {challenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg bg-secondary">
                        <p className="text-muted-foreground">No active challenges in this community yet.</p>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-6">
                <Leaderboard users={members} />
            </TabsContent>
            <TabsContent value="members" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {members.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</p>
                        </div>
                    </div>
                ))}
                </div>
            </TabsContent>
            <TabsContent value="checkins" className="mt-6">
                <div className="text-center p-8 border-2 border-dashed rounded-lg bg-secondary">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Live Check-ins</h3>
                    <p className="text-muted-foreground mb-4">No live check-ins scheduled. Start one for a challenge!</p>
                    <LiveCheckinDialog triggerButton={<Button><Video className="mr-2 h-4 w-4"/>Start a Check-in</Button>} />
                </div>
            </TabsContent>
            {isOwner && (
                <TabsContent value="settings" className="mt-6">
                    <div className="text-center p-8 border-2 border-dashed rounded-lg bg-secondary">
                        <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold font-headline">Community Settings</h3>
                        <p className="text-muted-foreground mb-4">Manage your community settings here.</p>
                        <Button asChild>
                            <Link href={`/communities/${id}/settings`}>Go to Settings</Link>
                        </Button>
                    </div>
                </TabsContent>
            )}
        </Tabs>
      )}
    </div>
  );
}


function CommunityDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Skeleton className="relative h-48 md:h-64 w-full rounded-lg" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card><Skeleton className="h-48" /></Card>
                        <Card><Skeleton className="h-48" /></Card>
                        <Card><Skeleton className="h-48" /></Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
