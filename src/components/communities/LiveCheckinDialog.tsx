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
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LiveCheckinDialogProps {
    triggerButton: React.ReactNode;
    challengeTitle?: string;
}

export function LiveCheckinDialog({ triggerButton, challengeTitle = "Live Check-in" }: LiveCheckinDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isOpen) {
        // Stop all tracks when dialog is closed
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        return;
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [isOpen, toast]);

  const toggleVideo = () => {
      if (streamRef.current) {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) {
              videoTrack.enabled = !videoOn;
              setVideoOn(!videoOn);
          }
      }
  }
  const toggleMic = () => {
      if (streamRef.current) {
          const audioTrack = streamRef.current.getAudioTracks()[0];
          if (audioTrack) {
              audioTrack.enabled = !micOn;
              setMicOn(!micOn);
          }
      }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                         {!videoOn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <UserSquare className="w-16 h-16 text-slate-600" />
                            </div>
                        )}
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
                   { !hasCameraPermission && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature. You may need to refresh the page after granting permission.
                            </AlertDescription>
                        </Alert>
                   )}
                </div>
                 <DialogFooter className="flex-row justify-center items-center gap-4 bg-secondary p-4 rounded-lg">
                    <Button variant={micOn ? "outline" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={toggleMic}>
                        {micOn ? <Mic /> : <MicOff />}
                    </Button>
                    <Button variant={videoOn ? "outline" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={toggleVideo}>
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
