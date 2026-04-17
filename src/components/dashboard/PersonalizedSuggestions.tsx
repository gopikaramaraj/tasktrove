'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  suggestPersonalizedChallenges,
  SuggestPersonalizedChallengesOutput,
} from '@/ai/flows/suggest-personalized-challenges';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Challenge } from '@/lib/types';

export function PersonalizedSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] =
    useState<SuggestPersonalizedChallengesOutput | null>(null);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [userGoal, setUserGoal] = useState<string>('');
  const [liked, setLiked] = useState<Record<string, string>>({});   // challengeId → likeDocId
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(6);
  const [feedOrder, setFeedOrder] = useState<Challenge[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();

  // FETCH USER GOAL + ALL CHALLENGES
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const userSnap = await getDocs(
        query(collection(db, 'users'), where('id', '==', user.uid))
      );
      if (!userSnap.empty) {
        setUserGoal(userSnap.docs[0].data().goal ?? '');
      }

      const communitiesSnap = await getDocs(collection(db, 'communities'));
      const all: Challenge[] = [];

      await Promise.all(
        communitiesSnap.docs.map(async (communityDoc) => {
          const challengesSnap = await getDocs(
            collection(db, 'communities', communityDoc.id, 'challenges')
          );
          challengesSnap.forEach((d) => {
            all.push({ id: d.id, ...d.data() } as Challenge);
          });
        })
      );

      setAllChallenges(all);
    };

    fetchData();
  }, [user]);

  // STABLE FEED ORDER — only shuffle once when challenges load
  useEffect(() => {
    if (allChallenges.length === 0) return;
    const shuffled = [...allChallenges].sort(() => Math.random() - 0.5);
    setFeedOrder(shuffled);
  }, [allChallenges]);

  // FETCH USER LIKES (store docId for toggling)
  useEffect(() => {
    const fetchLikes = async () => {
      if (!user) return;
      const snap = await getDocs(
        query(collection(db, 'likes'), where('userId', '==', user.uid))
      );
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        map[d.data().challengeId as string] = d.id;
      });
      setLiked(map);
    };

    fetchLikes();
  }, [user]);

  // FETCH LIKE COUNTS
  useEffect(() => {
    const fetchCounts = async () => {
      const snap = await getDocs(collection(db, 'likes'));
      const counts: Record<string, number> = {};
      snap.forEach((d) => {
        const id = d.data().challengeId as string;
        counts[id] = (counts[id] ?? 0) + 1;
      });
      setLikesCount(counts);
    };

    fetchCounts();
  }, []);

  // TOGGLE LIKE
  const handleLike = useCallback(
    async (challengeId: string) => {
      if (!user) return;

      if (liked[challengeId]) {
        // unlike
        await deleteDoc(doc(db, 'likes', liked[challengeId]));
        setLiked((prev) => {
          const next = { ...prev };
          delete next[challengeId];
          return next;
        });
        setLikesCount((prev) => ({
          ...prev,
          [challengeId]: Math.max((prev[challengeId] ?? 1) - 1, 0),
        }));
      } else {
        // like
        const docRef = await addDoc(collection(db, 'likes'), {
          userId: user.uid,
          challengeId,
        });
        setLiked((prev) => ({ ...prev, [challengeId]: docRef.id }));
        setLikesCount((prev) => ({
          ...prev,
          [challengeId]: (prev[challengeId] ?? 0) + 1,
        }));
      }
    },
    [user, liked]
  );

  // AI SUGGESTIONS
  const getSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    setSuggestions(null);

    try {
      const result = await suggestPersonalizedChallenges({
        userActivity: 'Basic activity',
        communityTrends: 'General trends',
      });
      setSuggestions(result);
    } catch (error: unknown) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch suggestions.',
      });
    } finally {
      setLoading(false);
    }
  };

  // DERIVED LISTS
  const recommended = allChallenges.filter((c) => c.category === userGoal);
  const trending = [...allChallenges].sort(
    (a, b) => (likesCount[b.id] ?? 0) - (likesCount[a.id] ?? 0)
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Smart Personalized Feed</CardTitle>
            <CardDescription>AI + Pinterest-style recommendations</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>

        {/* AI SUGGESTIONS */}
        {!suggestions && !loading && (
          <div className="text-center p-6 border rounded-lg mb-6">
            <Button onClick={getSuggestions}>
              <Zap className="mr-2 h-4 w-4" />
              Generate AI Suggestions
            </Button>
          </div>
        )}

        {loading && <Skeleton className="h-20 w-full mb-6" />}

        {suggestions && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">AI Suggestions</h3>
            <ul className="space-y-1">
              {suggestions.suggestedChallenges.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* FOR YOU */}
        {recommended.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-3">For You</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recommended.slice(0, 6).map((c) => (
                <Card key={c.id} className="p-3">
                  <p className="text-sm font-medium">{c.title}</p>
                  <span className="text-xs text-green-500">Recommended</span>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* TRENDING */}
        {trending.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-3">Trending</h3>
            <div className="grid grid-cols-2 gap-4">
              {trending.slice(0, 4).map((c) => (
                <Card key={c.id} className="p-3">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {likesCount[c.id] ?? 0} likes
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* EXPLORE */}
        {feedOrder.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-3">Explore</h3>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {feedOrder.slice(0, visibleCount).map((c) => (
                <div key={c.id} className="break-inside-avoid mb-4">
                  <Card className="p-3">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{c.xp} XP</p>
                    <Button
                      size="sm"
                      variant={liked[c.id] ? 'default' : 'outline'}
                      onClick={() => handleLike(c.id)}
                    >
                      {liked[c.id] ? '♥' : '♡'} {likesCount[c.id] ?? 0}
                    </Button>
                  </Card>
                </div>
              ))}
            </div>

            {visibleCount < feedOrder.length && (
              <Button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="mt-4 w-full"
                variant="outline"
              >
                Load More
              </Button>
            )}
          </>
        )}

      </CardContent>
    </Card>
  );
}