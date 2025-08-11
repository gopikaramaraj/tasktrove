'use client';

import { useState, useEffect } from 'react';
import { suggestPersonalizedChallenges, SuggestPersonalizedChallengesOutput } from '@/ai/flows/suggest-personalized-challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ThumbsUp, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Challenge, Community, UserChallenge } from '@/lib/types';


export function PersonalizedSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestPersonalizedChallengesOutput | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    setSuggestions(null);

    try {
        // Fetch user's completed challenges
        const userChallengesQuery = query(
            collection(db, 'user_challenges'),
            where('userId', '==', user.uid),
            where('progress', '==', 100),
            limit(5)
        );
        const userChallengesSnapshot = await getDocs(userChallengesQuery);
        const completedChallenges = await Promise.all(userChallengesSnapshot.docs.map(async (doc) => {
            const userChallenge = doc.data() as UserChallenge;
            const challengeDoc = await getDocs(query(collection(db, 'communities', userChallenge.communityId, 'challenges'), where('id', '==', userChallenge.challengeId)));
            return challengeDoc.docs.length > 0 ? (challengeDoc.docs[0].data() as Challenge).title : null
        }));
        const userActivity = `Completed challenges: ${completedChallenges.filter(Boolean).join(', ') || 'None'}`;
        
        // Fetch community trends
        const communitiesQuery = query(collection(db, 'communities'), limit(5));
        const communitiesSnapshot = await getDocs(communitiesQuery);
        const communityTrends = await Promise.all(communitiesSnapshot.docs.map(async (communityDoc) => {
            const community = communityDoc.data() as Community;
            const challengesQuery = query(collection(db, 'communities', community.id, 'challenges'), limit(2));
            const challengesSnapshot = await getDocs(challengesQuery);
            const challengeTitles = challengesSnapshot.docs.map(d => (d.data() as Challenge).title);
            return `In ${community.name}, trending challenges are: ${challengeTitles.join(', ')}`;
        }));

      const result = await suggestPersonalizedChallenges({
        userActivity: userActivity,
        communityTrends: communityTrends.join('. '),
      });
      setSuggestions(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error getting suggestions',
        description: 'Could not fetch personalized suggestions. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline">AI-Powered Suggestions</CardTitle>
            <CardDescription>Discover new challenges and habits tailored just for you.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions && !loading && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <p className="mb-4 text-muted-foreground">Click the button to generate your personalized path to success.</p>
            <Button onClick={getSuggestions}>
              <Zap className="mr-2 h-4 w-4" />
              Generate My Suggestions
            </Button>
          </div>
        )}
        {loading && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        )}
        {suggestions && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold font-headline mb-2">Suggested Challenges</h3>
              <ul className="space-y-2">
                {suggestions.suggestedChallenges.map((challenge, i) => (
                  <li key={`challenge-${i}`} className="flex items-start gap-3">
                    <Zap className="h-5 w-5 mt-1 text-accent shrink-0" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold font-headline mb-2">Suggested Habits</h3>
              <ul className="space-y-2">
                {suggestions.suggestedHabits.map((habit, i) => (
                  <li key={`habit-${i}`} className="flex items-start gap-3">
                    <ThumbsUp className="h-5 w-5 mt-1 text-accent shrink-0" />
                    <span>{habit}</span>
                  </li>
                ))}
              </ul>
            </div>
             <div className="md:col-span-2 text-center mt-4">
                <Button onClick={getSuggestions} variant="outline">
                    <Zap className="mr-2 h-4 w-4" />
                    Regenerate
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
