import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Community } from '@/lib/types';
import { Users, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <Image
          src={community.imageUrl}
          alt={community.name}
          width={400}
          height={300}
          className="w-full h-40 object-cover"
          data-ai-hint="community abstract"
        />
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl mb-2">{community.name}</CardTitle>
            {community.isPrivate && <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" /> Private</Badge>}
        </div>
        <CardDescription>{community.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex justify-between items-center">
        <div className="flex items-center text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-sm">{community.memberCount.toLocaleString()} members</span>
        </div>
        <Button asChild>
          <Link href={`/communities/${community.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
