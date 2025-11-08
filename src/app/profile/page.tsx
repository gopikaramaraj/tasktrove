'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

const profileFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  email: z.string().email(),
  bio: z.string().max(160).optional(),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { userData, loading, user } = useAuth();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        username: userData.name,
        email: userData.email,
        bio: userData.bio || '',
      });
    }
  }, [userData, form]);


  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            name: values.username,
            bio: values.bio,
        });
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
    } catch (error) {
        console.error("Error updating profile: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save your changes. Please try again.",
        });
    }
  }

  if (loading || !userData) {
      return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={userData.avatarUrl} data-ai-hint="person avatar"/>
                <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-2xl">{userData.name}</CardTitle>
              <CardDescription>Level {userData.level} Adventurer</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full">Change Avatar</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Tabs defaultValue="account">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Account Information</CardTitle>
                            <CardDescription>Make changes to your account here. Click save when you&apos;re done.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" readOnly disabled {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Tell us a little about yourself" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="password">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Change Password</CardTitle>
                            <CardDescription>Update your password here. It's a good idea to use a strong password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Password changes are not yet implemented.</p>
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <Input type="password" disabled />
                            </FormItem>
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <Input type="password" disabled />
                            </FormItem>
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <Input type="password" disabled />
                            </FormItem>
                            <Button disabled>Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}


function ProfileSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <Skeleton className="h-9 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
             <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Skeleton className="w-24 h-24 rounded-full mb-4" />
                            <Skeleton className="h-8 w-3/4 mb-2" />
                            <Skeleton className="h-5 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-1/3 mb-2" />
                            <Skeleton className="h-5 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-20 w-full" /></div>
                            <Skeleton className="h-10 w-32" />
                        </CardContent>
                    </Card>
                 </div>
             </div>
        </div>
    )
}
