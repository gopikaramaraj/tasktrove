'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GamesPage() {
  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Games</h2>
        <p className="text-muted-foreground">Have some fun with these simple games.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tic-Tac-Toe</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe
            src="https://tictactoe-g5.vercel.app"
            title="Tic-Tac-Toe Game"
            className="w-full h-[600px] border-0 rounded-lg"
            allowFullScreen
          />
        </CardContent>
      </Card>
    </div>
  );
}
