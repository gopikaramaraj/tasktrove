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

const profileFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  email: z.string().email(),
  bio: z.string().max(160).optional(),
});

export default function ProfilePage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: 'Questmaster',
      email: 'questmaster@tasktrove.com',
      bio: 'On a journey to achieve more, one task at a time!',
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    console.log(values);
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
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
                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person avatar"/>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-2xl">Questmaster</CardTitle>
              <CardDescription>Level 5 Adventurer</CardDescription>
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
                                    <Button type="submit">Save Changes</Button>
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
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <Input type="password" />
                            </FormItem>
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <Input type="password" />
                            </FormItem>
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <Input type="password" />
                            </FormItem>
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
