'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Community name must be at least 3 characters.' }).max(50, { message: 'Community name cannot be longer than 50 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(280, { message: 'Description cannot be longer than 280 characters.' }),
  isPrivate: z.boolean().default(false),
});

export function CreateCommunityForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not authenticated',
            description: 'You must be logged in to create a community.',
        });
        return;
    }

    try {
      const communityDocRef = await addDoc(collection(db, 'communities'), {
        name: values.name,
        description: values.description,
        isPrivate: values.isPrivate,
        memberCount: 1,
        createdAt: serverTimestamp(),
        ownerId: user.uid,
        imageUrl: `https://placehold.co/400x300.png`,
        bannerUrl: `https://placehold.co/1200x400.png`,
      });
      
      // Add the creator as the first member
      await setDoc(doc(db, 'communities', communityDocRef.id, 'members', user.uid), {
          joinedAt: serverTimestamp(),
          role: 'admin',
      });

      toast({
        title: 'Community Created!',
        description: `The "${values.name}" community is now live.`,
      });
      router.push(`/communities/${communityDocRef.id}`);
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not create the community. Please try again.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fitness Fanatics" {...field} />
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
                  placeholder="Tell everyone what your community is about."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Private Community</FormLabel>
                <FormDescription>
                  If enabled, users will have to request to join.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Community'}
        </Button>
      </form>
    </Form>
  );
}
