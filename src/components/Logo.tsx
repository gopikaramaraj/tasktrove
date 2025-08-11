import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("group flex items-center gap-2", className)}>
      <Trophy className="h-7 w-7 text-primary transition-transform duration-300 group-hover:rotate-[-15deg]" />
      <span className="font-headline text-xl font-bold tracking-tight">TaskTrove</span>
    </Link>
  );
}
