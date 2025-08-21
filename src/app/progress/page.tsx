import { Header } from '@/components/header';
import ProgressClient from './progress-client';

export default function ProgressPage() {
  return (
    <main className="min-h-screen w-full">
      <Header />
      <ProgressClient />
    </main>
  );
}
