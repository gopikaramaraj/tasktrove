'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Flame, Star, Zap } from 'lucide-react';
import { PersonalizedSuggestions } from '@/components/dashboard/PersonalizedSuggestions';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { userData, loading } = useAuth();

  const badges = [
    { icon: <Star className="text-primary" />, name: 'First Quest' },
    { icon: <Flame className="text-red-500" />, name: '7-Day Streak' },
    { icon: <Zap className="text-blue-500" />, name: 'Community Starter' },
    { icon: <Award className="text-green-500" />, name: 'Habit Master' },
  ];

  if (loading || !userData) {
    return <DashboardSkeleton />;
  }

  const progressToNextLevel = (userData.xp / (userData.level * 1000)) * 100;
  const xpToNextLevel = (userData.level * 1000) - userData.xp;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Welcome back, {userData.name}!</h2>
        <p className="text-muted-foreground">Here&apos;s a look at your progress. Keep it up!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="XP Points" value={userData.xp.toLocaleString()} icon={<Star className="text-primary" />} description="+50 from yesterday" />
        <StatCard title="Current Streak" value="14 Days" icon={<Flame className="text-red-500" />} description="New personal best!" />
        <StatCard title="Challenges Done" value="8" icon={<Award className="text-green-500" />} description="2 active challenges" />
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
