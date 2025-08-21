import { Leaf, LineChart } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Leaf className="text-primary-foreground" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">CalorieCam</h1>
        </Link>

        <nav>
            <Link href="/progress" passHref>
                <Button variant="ghost">
                    <LineChart className="mr-2 h-4 w-4"/>
                    Progress
                </Button>
            </Link>
        </nav>
      </div>
    </header>
  );
}
