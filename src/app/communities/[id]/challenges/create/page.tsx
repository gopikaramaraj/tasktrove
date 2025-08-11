'use client';

import { CreateChallengeForm } from '@/components/communities/CreateChallengeForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Community } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CreateChallengePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const communityId = params.id as string;
    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (communityId) {
            const fetchCommunity = async () => {
                const communityDoc = await getDoc(doc(db, 'communities', communityId));
                if (communityDoc.exists()) {
                    setCommunity({ id: communityDoc.id, ...communityDoc.data() } as Community);
                }
                setLoading(false);
            }
            fetchCommunity();
        }
    }, [communityId])

    if (authLoading || loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        router.push('/login');
        return null;
    }
    
    if (!community) {
        return <div>Community not found.</div>
    }

    return (
        <div className="space-y-8">
            <Button variant="ghost" asChild>
                <Link href={`/communities/${communityId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {community.name}
                </Link>
            </Button>
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">Create a New Challenge</h2>
                <p className="text-muted-foreground">Define a new challenge for the "{community.name}" community.</p>
                </div>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Challenge Details</CardTitle>
                    <CardDescription>What is the new challenge you want to propose?</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateChallengeForm communityId={communityId} />
                </CardContent>
            </Card>
        </div>
    );
}