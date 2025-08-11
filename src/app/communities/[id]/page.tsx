import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserPlus, PlusCircle, Video } from 'lucide-react';
import type { Challenge, User } from '@/lib/types';
import { ChallengeCard } from '@/components/communities/ChallengeCard';
import { Leaderboard } from '@/components/communities/Leaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveCheckinDialog } from '@/components/communities/LiveCheckinDialog';

const mockCommunity = {
  id: '3',
  name: 'Code & Coffee',
  description: 'A community for developers to tackle coding challenges and share projects.',
  memberCount: 2350,
  isPrivate: false,
  imageUrl: 'https://placehold.co/400x300.png',
  bannerUrl: 'https://placehold.co/1200x400.png',
};

const mockChallenges: Challenge[] = [
    { id: 'c1', title: '30 Days of React', description: 'Master React by building 30 small projects in 30 days.', progress: 75, communityName: 'Code & Coffee' },
    { id: 'c2', title: 'Python Weekly Challenge', description: 'Solve a new Python algorithm problem every week.', progress: 40, communityName: 'Code & Coffee' },
    { id: 'c3', title: 'UI/UX Design Sprint', description: 'Complete a full UI/UX design process for a fictional app in 2 weeks.', progress: 90, communityName: 'Code & Coffee' },
];

const mockUsers: User[] = [
    { id: 'u1', name: 'Alice', avatarUrl: 'https://placehold.co/40x40.png', xp: 5820 },
    { id: 'u2', name: 'Bob', avatarUrl: 'https://placehold.co/40x40.png', xp: 5140 },
    { id: 'u3', name: 'Charlie', avatarUrl: 'https://placehold.co/40x40.png', xp: 4990 },
    { id: 'u4', name: 'Diana', avatarUrl: 'https://placehold.co/40x40.png', xp: 4500 },
    { id: 'u5', name: 'Eve', avatarUrl: 'https://placehold.co/40x40.png', xp: 3210 },
];


export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch community data based on params.id
  const community = mockCommunity;

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
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <UserPlus className="mr-2 h-4 w-4" />
            Join Community
          </Button>
        </div>
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="checkins">Live Check-ins</TabsTrigger>
        </TabsList>
        <TabsContent value="challenges" className="mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold font-headline">Active Challenges</h3>
                 <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Challenge
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockChallenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard users={mockUsers} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               {mockUsers.map(user => (
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
      </Tabs>
    </div>
  );
}
