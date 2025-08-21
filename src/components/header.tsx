import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 border-b bg-card">
      <div className="container mx-auto flex items-center gap-2">
        <Leaf className="text-primary" />
        <h1 className="text-xl font-bold font-headline">CalorieCam</h1>
      </div>
    </header>
  );
}
