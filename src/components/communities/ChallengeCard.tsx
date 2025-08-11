import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-bold text-primary">{challenge.progress}%</span>
        </div>
        <Progress value={challenge.progress} />
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
