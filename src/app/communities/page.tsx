'use client';
import { Button } from '@/components/ui/button';
import { CommunityCard } from '@/components/communities/CommunityCard';
import type { Community } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      const communitiesCollection = collection(db, 'communities');
      const communitySnapshot = await getDocs(communitiesCollection);
      const communitiesList = communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
      setCommunities(communitiesList);
      setLoading(false);
    };

    fetchCommunities();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Explore Communities</h2>
          <p className="text-muted-foreground">Find your tribe and start achieving goals together.</p>
        </div>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/communities/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Community
          </Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CommunityCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityCardSkeleton() {
    return (
        <Card className="flex flex-col overflow-hidden animate-pulse">
            <Skeleton className="w-full h-40" />
            <CardContent className="p-6 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="p-6 pt-0 flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-20" />
            </CardFooter>
        </Card>
    );
}
// To make skeleton work, we need to import these components
import { Card, CardContent, CardFooter } from '@/components/ui/card';
