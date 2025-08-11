import { Button } from '@/components/ui/button';
import { CommunityCard } from '@/components/communities/CommunityCard';
import type { Community } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Productivity Pioneers',
    description: 'A group for those dedicated to mastering their productivity and workflows.',
    memberCount: 1204,
    isPrivate: false,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
  {
    id: '2',
    name: 'Fitness Fanatics',
    description: 'Join us to track fitness goals, share workout plans, and stay motivated.',
    memberCount: 876,
    isPrivate: false,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
  {
    id: '3',
    name: 'Code & Coffee',
    description: 'A community for developers to tackle coding challenges and share projects.',
    memberCount: 2350,
    isPrivate: false,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
  {
    id: '4',
    name: 'Bookworms United',
    description: 'For avid readers to set reading goals, discuss books, and discover new titles.',
    memberCount: 452,
    isPrivate: true,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
  {
    id: '5',
    name: 'Early Risers Club',
    description: 'A private group for those who want to build a habit of waking up early.',
    memberCount: 150,
    isPrivate: true,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
    {
    id: '6',
    name: 'Daily Meditators',
    description: 'Find your center with us. A space for daily meditation and mindfulness.',
    memberCount: 789,
    isPrivate: false,
    imageUrl: 'https://placehold.co/400x300.png',
    bannerUrl: 'https://placehold.co/1200x400.png',
  },
];


export default function CommunitiesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Explore Communities</h2>
          <p className="text-muted-foreground">Find your tribe and start achieving goals together.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Community
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCommunities.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>
    </div>
  );
}
