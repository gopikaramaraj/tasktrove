'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, UserSquare } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface LiveCheckinDialogProps {
    triggerButton: React.ReactNode;
    challengeTitle?: string;
}

export function LiveCheckinDialog({ triggerButton, challengeTitle = "Live Check-in" }: LiveCheckinDialogProps) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
            <div className="bg-slate-900 flex flex-col items-center justify-between p-4 rounded-l-lg">
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                    {/* Main Speaker */}
                    <div className="col-span-2 bg-black rounded-lg relative overflow-hidden">
                        <Image src="https://placehold.co/600x400.png" layout="fill" objectFit='cover' alt="Main speaker" data-ai-hint="person talking"/>
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">Alex</span>
                    </div>
                    {/* Other participants */}
                    <div className="bg-black rounded-lg relative overflow-hidden">
                        <Image src="https://placehold.co/300x200.png" layout="fill" objectFit='cover' alt="Participant 2" data-ai-hint="person portrait"/>
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">Beth</span>
                    </div>
                     <div className="bg-black rounded-lg flex items-center justify-center relative">
                        <UserSquare className="w-16 h-16 text-slate-600" />
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">You</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col p-6">
                 <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">{challengeTitle}</DialogTitle>
                    <DialogDescription>
                        Live check-in in progress.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow my-6 bg-secondary p-4 rounded-lg">
                    <p className="font-semibold">Chat / Notes</p>
                    <p className="text-sm text-muted-foreground mt-2">This is where chat messages or shared notes would appear.</p>
                </div>
                 <DialogFooter className="flex-row justify-center items-center gap-4 bg-secondary p-4 rounded-lg">
                    <Button variant={micOn ? "outline" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => setMicOn(!micOn)}>
                        {micOn ? <Mic /> : <MicOff />}
                    </Button>
                    <Button variant={videoOn ? "outline" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => setVideoOn(!videoOn)}>
                        {videoOn ? <Video /> : <VideoOff />}
                    </Button>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="rounded-full h-14 w-14">
                            <PhoneOff />
                        </Button>
                    </DialogTrigger>
                </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
