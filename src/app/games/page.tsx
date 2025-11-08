'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GamesPage() {

  const games = [
    {
      title: 'Mikutap',
      url: 'https://aidn.jp/mikutap/',
    },
    {
      title: 'Tic-Tac-Toe',
      url: 'https://tictactoe-g5.vercel.app',
    },
    {
      title: 'Wordle',
      url: 'https://wordlegame.vercel.app/',
    },
    {
      title: '2048',
      url: 'https://2048-game-react.vercel.app/',
    }
  ]

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Game Library</h2>
        <p className="text-muted-foreground">Have some fun with these simple games.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {games.map((game) => (
            <Card key={game.title}>
              <CardHeader>
                <CardTitle>{game.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  src={game.url}
                  title={`${game.title} Game`}
                  className="w-full h-[600px] border-0 rounded-lg"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin"
                />
              </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
