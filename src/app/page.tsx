import { Header } from '@/components/header';
import DashboardClient from '@/app/dashboard-client';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <Header />
      <DashboardClient />
    </main>
  );
}
