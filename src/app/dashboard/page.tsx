import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Flame, Star, Zap } from 'lucide-react';
import { PersonalizedSuggestions } from '@/components/dashboard/PersonalizedSuggestions';
import { StatCard } from '@/components/dashboard/StatCard';

export default function DashboardPage() {
  const badges = [
    { icon: <Star className="text-primary" />, name: 'First Quest' },
    { icon: <Flame className="text-red-500" />, name: '7-Day Streak' },
    { icon: <Zap className="text-blue-500" />, name: 'Community Starter' },
    { icon: <Award className="text-green-500" />, name: 'Habit Master' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Welcome back, Questmaster!</h2>
        <p className="text-muted-foreground">Here&apos;s a look at your progress. Keep it up!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="XP Points" value="1,250" icon={<Star className="text-primary" />} description="+50 from yesterday" />
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
              <span className="text-sm font-medium">Level 5</span>
              <span className="text-sm text-muted-foreground">1250 / 2000 XP</span>
            </div>
            <Progress value={62.5} className="w-full h-4" />
            <p className="text-center text-sm text-muted-foreground mt-2">750 XP to Level 6</p>
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
