'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function GamesPage() {

  const games = [
    {
      title: 'Tic-Tac-Toe',
      url: 'https://tictactoe-g5.vercel.app',
    },
    {
      title: 'Wordle',
      url: 'https://wordle-in-react.vercel.app/',
    },
    {
      title: '2048',
      url: 'https://2048-game-react.vercel.app/',
    }
  ]

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Games</h2>
        <p className="text-muted-foreground">Have some fun with these simple games.</p>
      </div>
      <Carousel className="w-full max-w-4xl mx-auto">
      <CarouselContent>
        {games.map((game) => (
          <CarouselItem key={game.title}>
            <div className="p-1">
              <Card>
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={game.url}
                    title={`${game.title} Game`}
                    className="w-full h-[600px] border-0 rounded-lg"
                    allowFullScreen
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
  );
}
