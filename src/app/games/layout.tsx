import { AppLayout } from '@/components/layout/AppLayout';

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
