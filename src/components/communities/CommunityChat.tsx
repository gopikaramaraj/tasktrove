'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';
import { formatRelative } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CommunityChatProps {
  communityId: string;
}

export function CommunityChat({ communityId }: CommunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { userData, user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'communities', communityId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    }, async (error) => {
      const permissionError = new FirestorePermissionError({
          path: `communities/${communityId}/messages`,
          operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userData) return;

    const messagesCollectionRef = collection(db, 'communities', communityId, 'messages');
    const messageData = {
      text: newMessage,
      createdAt: serverTimestamp(),
      userId: user.uid,
      userName: userData.name,
      userAvatar: userData.avatarUrl,
    };

    setNewMessage('');

    addDoc(messagesCollectionRef, messageData)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: messagesCollectionRef.path,
                operation: 'create',
                requestResourceData: messageData
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Community Chat</CardTitle>
        <CardDescription>Discuss topics and connect with other members in real-time.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {loading && (
              <>
                <MessageSkeleton />
                <MessageSkeleton reversed />
                <MessageSkeleton />
              </>
            )}
            {!loading && messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.userId === user?.uid ? 'justify-end' : 'justify-start'
                )}
              >
                {message.userId !== user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.userAvatar} data-ai-hint="person avatar"/>
                    <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col gap-1", message.userId === user?.uid ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-xs md:max-w-md rounded-lg p-3 text-sm',
                      message.userId === user?.uid
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary rounded-bl-none'
                    )}
                  >
                    {message.userId !== user?.uid && <p className="font-semibold mb-1 text-xs">{message.userName}</p>}
                    <p>{message.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                      {message.createdAt ? formatRelative(new Date(message.createdAt.seconds * 1000), new Date()) : 'sending...'}
                  </span>
                </div>
                 {message.userId === user?.uid && userData && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData.avatarUrl} data-ai-hint="person avatar" />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {!loading && messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                    <p>No messages yet. Be the first to say something!</p>
                </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!userData}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || !userData}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}


function MessageSkeleton({ reversed = false }: { reversed?: boolean }) {
  return (
    <div className={cn("flex items-start gap-3", reversed && 'justify-end')}>
      {!reversed && <Skeleton className="h-8 w-8 rounded-full" />}
      <div className={cn("flex flex-col gap-1", reversed ? 'items-end' : 'items-start')}>
        <Skeleton className="h-16 w-48 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
      {reversed && <Skeleton className="h-8 w-8 rounded-full" />}
    </div>
  )
}
