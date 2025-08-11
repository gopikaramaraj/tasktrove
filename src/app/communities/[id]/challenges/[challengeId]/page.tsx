'use client';
import { Button } from '@/components/ui/button';
import type { Challenge, User, UserChallenge } from '@/lib/types';
import { Leaderboard } from '@/components/communities/Leaderboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  query,
  where,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { use, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Zap } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ChallengeDetailPage({
  params,
}: {
  params: { id: string; challengeId: string };
}) {
  const { id: communityId, challengeId } = use(params);
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<User[]>([]);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(
    null
  );
  const [isJoining, setIsJoining] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!communityId || !challengeId || authLoading) return;
      setLoading(true);
      try {
        // Fetch challenge details
        const challengeDocRef = doc(
          db,
          'communities',
          communityId,
          'challenges',
          challengeId
        );
        const challengeDoc = await getDoc(challengeDocRef);
        if (challengeDoc.exists()) {
          setChallenge({ id: challengeDoc.id, ...challengeDoc.data() } as Challenge);
        } else {
          setLoading(false);
          return;
        }

        // Fetch leaderboard data
        const userChallengesQuery = query(
          collection(db, 'user_challenges'),
          where('challengeId', '==', challengeId)
        );
        const userChallengesSnapshot = await getDocs(userChallengesQuery);
        const participants = userChallengesSnapshot.docs.map(
          (doc) => doc.data() as UserChallenge
        );

        if (participants.length > 0) {
          const userIds = participants.map((p) => p.userId);
          const usersQuery = query(collection(db, 'users'), where('id', 'in', userIds));
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map((doc) => doc.data() as User);
          // For now, we sort by XP as progress is not fully implemented
          const sortedUsers = users.sort((a, b) => b.xp - a.xp);
          setLeaderboardUsers(sortedUsers);
        }

        // Check if the current user has joined this challenge
        if (user) {
          const userChallengeQuery = query(
            collection(db, 'user_challenges'),
            where('userId', '==', user.uid),
            where('challengeId', '==', challengeId),
            limit(1)
          );
          const userChallengeSnapshot = await getDocs(userChallengeQuery);
          if (!userChallengeSnapshot.empty) {
            setUserChallenge({
              id: userChallengeSnapshot.docs[0].id,
              ...userChallengeSnapshot.docs[0].data(),
            } as UserChallenge);
          }
        }
      } catch (error) {
        console.error('Failed to fetch challenge data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load challenge details.',
        });
      }
      setLoading(false);
    };

    fetchChallengeData();
  }, [communityId, challengeId, authLoading, user, toast]);

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;
    setIsJoining(true);

    try {
      const batch = writeBatch(db);

      // Create a new user_challenge document
      const userChallengeRef = doc(collection(db, 'user_challenges'));
      batch.set(userChallengeRef, {
        userId: user.uid,
        challengeId: challenge.id,
        communityId: challenge.communityId,
        progress: 0,
        xpGained: 0,
        joinedAt: serverTimestamp(),
        completedAt: null,
      });

      // Increment participant count on the challenge
      const challengeRef = doc(db, 'communities', challenge.communityId, 'challenges', challenge.id);
      batch.update(challengeRef, { participantCount: increment(1) });
      
      await batch.commit();

      setUserChallenge({
        id: userChallengeRef.id,
        userId: user.uid,
        challengeId: challenge.id,
        communityId: challenge.communityId,
        progress: 0,
        xpGained: 0,
        joinedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        completedAt: null,
      });

       setChallenge(prev => prev ? {...prev, participantCount: prev.participantCount + 1} : null);

      toast({
        title: 'Challenge Joined!',
        description: `You are now participating in "${challenge.title}".`,
      });
    } catch (error) {
      console.error('Error joining challenge: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not join the challenge. Please try again.',
      });
    } finally {
      setIsJoining(false);
    }
  };


  if (loading || authLoading) {
    return <ChallengeDetailSkeleton />;
  }

  if (!challenge) {
    return <div>Challenge not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" asChild>
        <Link href={`/communities/${communityId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Link>
      </Button>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">{challenge.title}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress tracking UI would go here */}
              {!userChallenge && user && (
                <p className="text-muted-foreground">You have not joined this challenge yet.</p>
              )}
                 {userChallenge && (
                <div className="space-y-4">
                    <p className="font-semibold">Your Progress</p>
                    <div className="flex items-center gap-4">
                        <Zap className="text-primary" />
                        <span className="text-lg font-bold">{userChallenge.progress}%</span>
                    </div>
                     <p className="text-sm text-muted-foreground">Keep going! You can do it.</p>
                </div>
            )}
            </CardContent>
            <CardFooter>
            {!user ? (
                 <Button disabled>Login to Join</Button>
            ) : userChallenge ? (
                <Button disabled>Challenge Joined</Button>
            ) : (
                <Button onClick={handleJoinChallenge} disabled={isJoining}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isJoining ? 'Joining...' : 'Join Challenge'}
                </Button>
            )}
            </CardFooter>
          </Card>
        </div>
        <div className="md:col-span-1">
          <Leaderboard users={leaderboardUsers} />
        </div>
      </div>
    </div>
  );
}

function ChallengeDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-9 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-1/2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-36" />
            </CardFooter>
          </Card>
        </div>
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
