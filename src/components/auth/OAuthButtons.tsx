'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.4 64.8C337.7 112.7 297.6 96 248 96c-106.1 0-192 85.9-192 192s85.9 192 192 192c60.6 0 112.6-28.7 146.2-72.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
    </svg>
);


export function OAuthButtons() {
    const { toast } = useToast();
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Create a new user document in Firestore
                await setDoc(userDocRef, {
                    id: user.uid,
                    name: user.displayName,
                    email: user.email,
                    avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`,
                    xp: 0,
                    level: 1,
                    bio: 'Just joined with Google!',
                });
            }
            
            toast({
              title: "Sign-in with Google successful!",
              description: "Redirecting to your dashboard...",
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Google sign-in error", error);
            toast({
                variant: 'destructive',
                title: 'Google Sign-in Failed',
                description: 'Could not sign in with Google. Please try again.',
            });
        }
    }

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <GoogleIcon />
        Google
      </Button>
    </div>
  );
}
