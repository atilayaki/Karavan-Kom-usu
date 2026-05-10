'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import SidebarNav from "@/components/SidebarNav";
import BottomNav from "@/components/BottomNav";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import OnboardingTour from "@/components/OnboardingTour";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTool = pathname?.startsWith('/tools/');

  if (isTool) {
    return (
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <SidebarNav />
      <VerifyEmailBanner />
      <main style={{
        marginTop: 'calc(var(--nav-height) + env(safe-area-inset-top))',
        paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
        position: 'relative',
      }}>
        {children}
      </main>
      <BottomNav />
      <OnboardingTour />
    </>
  );
}
