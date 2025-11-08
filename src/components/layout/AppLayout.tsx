'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { Home, Users, Trophy, UserCircle, Gamepad2 } from 'lucide-react';
import { Header } from './Header';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { href: '/communities', label: 'Communities', icon: <Users /> },
    { href: '/games', label: 'Games', icon: <Gamepad2 /> },
    { href: '/profile', label: 'Profile', icon: <UserCircle /> },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  href={item.href}
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  asChild
                >
                  <a href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="flex flex-col gap-2 p-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} TaskTrove</p>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
