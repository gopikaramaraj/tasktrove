import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BarChart, Bot, Users, Video } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function Home() {
  const features = [
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Community Management',
      description: 'Create and join vibrant communities. Manage members and foster collaboration.',
    },
    {
      icon: <Award className="h-10 w-10 text-primary" />,
      title: 'Challenge Tracking',
      description: 'Set and track personal or community-wide challenges and build healthy habits.',
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: 'Gamification System',
      description: 'Earn XP, unlock badges, and maintain streaks. Compete on leaderboards.',
    },
    {
      icon: <Video className="h-10 w-10 text-primary" />,
      title: 'Live Video Check-ins',
      description: 'Connect with your community through live video for accountability and support.',
    },
    {
      icon: <Bot className="h-10 w-10 text-primary" />,
      title: 'AI-Powered Suggestions',
      description: 'Get personalized recommendations for new challenges and habits to try.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Logo />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter mb-6 text-primary animate-fade-in-down">
              Unlock Your Potential, Together.
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              TaskTrove is a gamified productivity app that helps you build habits and achieve goals within a supportive community. Turn your tasks into triumphs.
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/signup">Start Your Quest</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-20 bg-secondary">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Everything You Need to Succeed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-center mb-4">{feature.icon}</div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container text-center">
             <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-6">
              Ready to Join the Trove?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Start for free, and begin your journey towards a more productive and connected life. No credit card required.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t bg-secondary">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by You. Powered by Community.
          </p>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} TaskTrove Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
