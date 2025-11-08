'use client';
import { Button } from '@/components/ui/button';
import { CommunityCard } from '@/components/communities/CommunityCard';
import type { Community } from '@/lib/types';
import { PlusCircle, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

function JoinCommunityDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [communityId, setCommunityId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const handleJoin = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to join a community.' });
            return;
        }
        if (!communityId.trim()) {
            toast({ variant: 'destructive', title: 'Invalid ID', description: 'Please enter a community ID.' });
            return;
        }

        setIsJoining(true);
        try {
            const communityRef = doc(db, 'communities', communityId.trim());
            const memberRef = doc(db, 'communities', communityId.trim(), 'members', user.uid);
            
            const communityDoc = await getDoc(communityRef);
            if (!communityDoc.exists()) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No community found with that ID.' });
                setIsJoining(false);
                return;
            }
            
            const memberDoc = await getDoc(memberRef);
            if (memberDoc.exists()) {
                 toast({ variant: 'default', title: 'Already a member', description: 'You are already a member of this community.' });
                 router.push(`/communities/${communityId.trim()}`);
                 setIsOpen(false);
                 return;
            }

            const batch = writeBatch(db);
            batch.set(memberRef, { joinedAt: new Date(), role: 'member' });
            batch.update(communityRef, { memberCount: increment(1) });
            await batch.commit();

            toast({ title: 'Success!', description: `You have joined the community.` });
            router.push(`/communities/${communityId.trim()}`);
            setIsOpen(false);

        } catch (error) {
            console.error("Error joining community by ID:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not join the community. Please check the ID and try again.' });
        } finally {
            setIsJoining(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Community
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Join a Community</DialogTitle>
                <DialogDescription>
                    Enter the ID of the community you want to join. This is useful for private communities.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="community-id" className="text-right">
                    Community ID
                    </Label>
                    <Input
                    id="community-id"
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter community ID"
                    />
                </div>
                </div>
                <DialogFooter>
                <Button onClick={handleJoin} disabled={isJoining}>
                    {isJoining ? 'Joining...' : 'Join'}
                </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function CommunitiesPage() {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        const communitiesCollection = collection(db, 'communities');
        const communitySnapshot = await getDocs(communitiesCollection);
        const communitiesList = communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
        setAllCommunities(communitiesList);
        setFilteredCommunities(communitiesList);
      } catch (error) {
        console.error("Error fetching communities:", error);
      }
      setLoading(false);
    };

    fetchCommunities();
  }, []);

  useEffect(() => {
    let communities = [...allCommunities];
    if (searchTerm) {
        communities = communities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredCommunities(communities);
  }, [searchTerm, allCommunities]);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Explore Communities</h2>
          <p className="text-muted-foreground">Find your tribe and start achieving goals together.</p>
        </div>
        <div className="flex items-center gap-4">
            <Input 
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
            />
            <JoinCommunityDialog />
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/communities/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Community
                </Link>
            </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CommunityCardSkeleton key={i} />)}
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      ) : (
         <div className="text-center p-8 border-2 border-dashed rounded-lg bg-secondary col-span-full">
            <p className="text-muted-foreground">No communities found that match your search.</p>
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
import { useRouter } from 'next/navigation';
