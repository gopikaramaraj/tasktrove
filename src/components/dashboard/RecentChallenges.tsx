'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Challenge, UserChallenge } from '@/lib/types';
import { Trophy } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface RecentChallengesProps {
  challenges: UserChallenge[];
}

function RecentChallengeItem({ userChallenge }: { userChallenge: UserChallenge }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallengeData = async () => {
      setLoading(true);
      const challengeRef = doc(db, 'communities', userChallenge.communityId, 'challenges', userChallenge.challengeId);
      const challengeSnap = await getDoc(challengeRef);
      if (challengeSnap.exists()) {
        setChallenge({ id: challengeSnap.id, ...challengeSnap.data() } as Challenge);
      }
      setLoading(false);
    };

    fetchChallengeData();
  }, [userChallenge]);

  if (loading || !challenge) {
    return (
        <div className="flex flex-col justify-between p-4 border rounded-lg h-full">
             <div className="animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full mt-2"></div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col justify-between p-4 border rounded-lg h-full bg-secondary/50">
      <div>
        <h4 className="font-semibold text-md font-headline">{challenge.title}</h4>
        <p className="text-sm text-muted-foreground truncate mb-2">
          {challenge.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          <span>{challenge.xp} XP</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{userChallenge.progress}%</span>
        </div>
        <Progress value={userChallenge.progress} className="h-2" />
         <Button asChild variant="link" className="px-0 h-auto mt-2">
          <Link href={`/communities/${challenge.communityId}/challenges/${challenge.id}`}>View Challenge</Link>
        </Button>
      </div>
    </div>
  );
}

export function RecentChallenges({ challenges }: RecentChallengesProps) {
  if (challenges.length === 0) {
    return null; // Don't render anything if there are no recent challenges
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Your Recent Challenges</CardTitle>
        <CardDescription>
          Pick up where you left off and keep the momentum going!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <RecentChallengeItem key={challenge.id} userChallenge={challenge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
