import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Challenge } from '@/lib/types';
import { LiveCheckinDialog } from './LiveCheckinDialog';
import { Button } from '../ui/button';
import { Video } from 'lucide-react';


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
        {/* User-specific progress would be shown here */}
        <p className="text-sm text-muted-foreground">Join this challenge to track your progress!</p>
      </CardContent>
      <CardFooter>
        <LiveCheckinDialog 
            triggerButton={
                <Button variant="outline" className="w-full">
                    <Video className="mr-2 h-4 w-4"/>
                    Live Check-in
                </Button>
            }
            challengeTitle={challenge.title}
        />
      </CardFooter>
    </Card>
  );
}
