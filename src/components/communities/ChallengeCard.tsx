import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Challenge } from '@/lib/types';
import { Button } from '../ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';


interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline">{challenge.title}</CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-sm">{challenge.participantCount || 0} participants</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href={`/communities/${challenge.communityId}/challenges/${challenge.id}`}>View Challenge</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
