import { Hero } from '@/components/hero';
import { Demo } from '@/components/demo';
import { Features } from '@/components/features';
import { Install } from '@/components/install';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Demo />
      <Features />
      <Install />
      <Footer />
    </main>
  );
}
