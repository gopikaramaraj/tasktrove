'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Challenge title must be at least 5 characters.' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(500),
});

interface CreateChallengeFormProps {
    communityId: string;
}

export function CreateChallengeForm({ communityId }: CreateChallengeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not authenticated',
            description: 'You must be logged in to create a challenge.',
        });
        return;
    }
    if (!communityId) {
         toast({
            variant: 'destructive',
            title: 'Community Not Found',
            description: 'Could not identify the community for this challenge.',
        });
        return;
    }

    try {
      await addDoc(collection(db, 'communities', communityId, 'challenges'), {
        title: values.title,
        description: values.description,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Challenge Created!',
        description: `The "${values.title}" challenge is now available in the community.`,
      });
      router.push(`/communities/${communityId}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not create the challenge. Please try again.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Run 5k Every Day" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the challenge rules, goals, and benefits."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Challenge'}
        </Button>
      </form>
    </Form>
  );
}
