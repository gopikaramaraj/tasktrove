import { AppLayout } from '@/components/layout/AppLayout';
import CreateCommunityPage from './create/page';

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
