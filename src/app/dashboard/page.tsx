'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Flame, Star, Zap } from 'lucide-react';
import { PersonalizedSuggestions } from '@/components/dashboard/PersonalizedSuggestions';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserChallenge, UserHabit } from '@/lib/types';
import { differenceInCalendarDays } from 'date-fns';
import { RecentChallenges } from '@/components/dashboard/RecentChallenges';
import { ChatBot } from '@/components/dashboard/ChatBot';

export default function DashboardPage() {
  const { userData, loading: authLoading } = useAuth();
  const [challengesDone, setChallengesDone] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentChallenges, setRecentChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!userData) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Fetch completed challenges
        const userChallengesQuery = query(
          collection(db, 'user_challenges'),
          where('userId', '==', userData.id)
        );
        const userChallengesSnapshot = await getDocs(userChallengesQuery);
        
        const allUserChallenges = userChallengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserChallenge));

        const completedChallenges = allUserChallenges.filter(c => c.progress === 100);
        setChallengesDone(completedChallenges.length);

        // Sort challenges by joinedAt date to get the recent ones
        const sortedChallenges = [...allUserChallenges].sort((a, b) => {
            if (a.joinedAt && b.joinedAt) {
              return b.joinedAt.seconds - a.joinedAt.seconds;
            }
            return 0;
          }
        );
        setRecentChallenges(sortedChallenges.slice(0, 3));


        // Fetch habits to calculate streak
        const habitsQuery = query(
            collection(db, 'user_habits'),
            where('userId', '==', userData.id)
        );
        const habitsSnapshot = await getDocs(habitsQuery);
        const habits = habitsSnapshot.docs.map(doc => doc.data() as UserHabit);
        
        let streak = 0;
        if (habits.length > 0) {
          const sortedHabits = habits.sort((a,b) => b.lastCheckIn.seconds - a.lastCheckIn.seconds);
          const lastCheckinDate = new Date(sortedHabits[0].lastCheckIn.seconds * 1000);
          const today = new Date();
          const diffDays = differenceInCalendarDays(today, lastCheckinDate);

          if (diffDays <= 1) {
              streak = 1; // Start with 1 for today/yesterday's check-in
              let currentDate = lastCheckinDate;
              for (let i = 1; i < sortedHabits.length; i++) {
                  const prevDate = new Date(sortedHabits[i].lastCheckIn.seconds * 1000);
                  if (differenceInCalendarDays(currentDate, prevDate) === 1) {
                      streak++;
                      currentDate = prevDate;
                  } else if (differenceInCalendarDays(currentDate, prevDate) > 1) {
                      break; 
                  }
              }
          }
        }
        setCurrentStreak(streak);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [userData, authLoading]);


  const badges = [
    { icon: <Star className="text-primary" />, name: 'First Quest' },
    { icon: <Flame className="text-red-500" />, name: '7-Day Streak' },
    { icon: <Zap className="text-blue-500" />, name: 'Community Starter' },
    { icon: <Award className="text-green-500" />, name: 'Habit Master' },
  ];

  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!userData) {
      return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Welcome!</h2>
            <p className="text-muted-foreground">It looks like your user data is not yet available. Please try again shortly.</p>
        </div>
      )
  }

  const progressToNextLevel = (userData.xp / (userData.level * 1000)) * 100;
  const xpToNextLevel = (userData.level * 1000) - userData.xp;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Welcome back, {userData.name}!</h2>
        <p className="text-muted-foreground">Here&apos;s a look at your progress. Keep it up!</p>
      </div>

      {recentChallenges.length > 0 && <RecentChallenges challenges={recentChallenges} />}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="XP Points" value={userData.xp.toLocaleString()} icon={<Star className="text-primary" />} description="Keep earning XP!" />
        <StatCard title="Current Streak" value={`${currentStreak} Days`} icon={<Flame className="text-red-500" />} description="Check-in daily to keep it going!" />
        <StatCard title="Challenges Done" value={challengesDone.toString()} icon={<Award className="text-green-500" />} description="Great work completing challenges!" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Level {userData.level}</span>
              <span className="text-sm text-muted-foreground">{userData.xp.toLocaleString()} / {(userData.level * 1000).toLocaleString()} XP</span>
            </div>
            <Progress value={progressToNextLevel} className="w-full h-4" />
            <p className="text-center text-sm text-muted-foreground mt-2">{xpToNextLevel.toLocaleString()} XP to Level {userData.level + 1}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle className="font-headline">Your Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around gap-4">
              {badges.map((badge, index) => (
                <div key={index} className="flex flex-col items-center gap-2" title={badge.name}>
                  <div className="p-3 rounded-full bg-secondary">
                    {badge.icon}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PersonalizedSuggestions />
      <ChatBot />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <Skeleton className="h-9 w-1/2 mb-2" />
        <Skeleton className="h-5 w-3/4" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/4" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader><Skeleton className="h-5 w-1/3 mb-2" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader></Card>
        <Card><CardHeader><Skeleton className="h-5 w-1/3 mb-2" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader></Card>
        <Card><CardHeader><Skeleton className="h-5 w-1/3 mb-2" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-1/3 mx-auto mt-2" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent className="flex justify-around gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
        <CardContent className="text-center p-8">
            <Skeleton className="h-6 w-1/2 mx-auto mb-4" />
            <Skeleton className="h-10 w-48 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
