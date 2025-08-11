'use client';

import { CreateCommunityForm } from '@/components/communities/CreateCommunityForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function CreateCommunityPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">Create a New Community</h2>
                <p className="text-muted-foreground">Build a space for people to connect and grow together.</p>
                </div>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Community Details</CardTitle>
                    <CardDescription>Give your community a name and a purpose.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateCommunityForm />
                </CardContent>
            </Card>
        </div>
    );
}
