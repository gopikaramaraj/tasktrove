'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Community, User } from '@/lib/types';
import { ArrowLeft, Clipboard, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const settingsFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Community name must be at least 3 characters.' })
    .max(50),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(280),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function CommunitySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = use(useParams());
  const { toast } = useToast();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId) return;
      setLoading(true);
      try {
        const communityDocRef = doc(db, 'communities', communityId);
        const communityDoc = await getDoc(communityDocRef);

        if (communityDoc.exists()) {
          const communityData = {
            id: communityDoc.id,
            ...communityDoc.data(),
          } as Community;
          setCommunity(communityData);

          // Check for ownership
          if (user && communityData.ownerId !== user.uid) {
            toast({
              variant: 'destructive',
              title: 'Unauthorized',
              description: 'You are not the owner of this community.',
            });
            router.push(`/communities/${communityId}`);
            return;
          }

          form.reset({
            name: communityData.name,
            description: communityData.description,
          });

          // Fetch members
          const membersQuery = collection(
            db,
            'communities',
            communityId,
            'members'
          );
          const membersSnapshot = await getDocs(membersQuery);
          const memberIds = membersSnapshot.docs.map((doc) => doc.id);

          if (memberIds.length > 0) {
            const usersQuery = collection(db, 'users');
            const usersSnapshot = await getDocs(usersQuery);
            const allUsers = usersSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() }) as User
            );
            const communityMembers = allUsers.filter((user) =>
              memberIds.includes(user.id)
            );
            setMembers(communityMembers);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Not Found',
            description: 'This community does not exist.',
          });
          router.push('/communities');
        }
      } catch (error) {
        console.error('Error fetching community settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load community settings.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCommunityData();
    }
  }, [communityId, authLoading, user, router, toast, form]);

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    if (!community) return;
    try {
      const communityDocRef = doc(db, 'communities', community.id);
      await updateDoc(communityDocRef, {
        name: data.name,
        description: data.description,
      });
      toast({
        title: 'Settings Saved',
        description: 'Your community details have been updated.',
      });
      // Update local state to reflect changes immediately
      setCommunity(prev => prev ? {...prev, ...data} : null);
    } catch (error) {
      console.error('Error updating community:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save changes. Please try again.',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!community || !user || user.uid === memberId) return;

    try {
        const memberDocRef = doc(db, 'communities', community.id, 'members', memberId);
        await deleteDoc(memberDocRef);

        // Also update member count on the community doc
        const communityDocRef = doc(db, 'communities', community.id);
        const currentMemberCount = community.memberCount || 0;
        await updateDoc(communityDocRef, {
            memberCount: currentMemberCount > 0 ? currentMemberCount - 1 : 0
        });

        setMembers(prev => prev.filter(m => m.id !== memberId));
        setCommunity(prev => prev ? {...prev, memberCount: prev.memberCount - 1} : null);

        toast({
            title: "Member Removed",
            description: "The user has been removed from the community."
        });
    } catch (error) {
        console.error("Error removing member:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not remove the member. Please try again."
        })
    }
  }

  const copyCommunityId = () => {
    if (community) {
      navigator.clipboard.writeText(community.id);
      toast({ title: 'Copied!', description: 'Community ID copied to clipboard.' });
    }
  };

  if (loading || authLoading || !community) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" asChild>
        <Link href={`/communities/${community.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {community.name}
        </Link>
      </Button>
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Community Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your &quot;{community.name}&quot; community.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-8">
            <Card>
            <CardHeader>
                <CardTitle>Community Details</CardTitle>
                <CardDescription>
                Update your community&apos;s name and description.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Community Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
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
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Community ID</CardTitle>
                    <CardDescription>Share this ID to allow others to join your private community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Input value={community.id} readOnly />
                        <Button variant="outline" size="icon" onClick={copyCommunityId}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                View and manage your community members.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                    <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person"/>
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    </div>
                    {user?.uid !== member.id && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove "{member.name}" from the community. They will have to rejoin.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                                    Remove Member
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    )}
                </div>
                ))}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton className="h-10 w-48" />
      <div>
        <Skeleton className="h-9 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    
