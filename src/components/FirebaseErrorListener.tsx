'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(
        'Firestore Permission Error:',
        JSON.stringify(error.context, null, 2)
      );
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: `Your request was denied by security rules. Check the developer console for details.`,
        duration: 10000,
      });

      // Throwing the error here will cause it to be caught by Next.js's
      // development error overlay.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
