import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import InstallPWA from "@/components/InstallPWA";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Karavan Komşusu | Yolun Tadını Birlikte Çıkaralım",
  description: "Türkiye'nin karavancılara özel premium sosyal platformu. Güvenli konaklama noktaları, uzman ustalar, anlık haberleşme ve topluluk.",
  manifest: "/manifest.json",
  applicationName: "Karavan Komşusu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Karavan Komşusu",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Karavan Komşusu",
    description: "Yolun Tadını Birlikte Çıkaralım",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport = {
  themeColor: "#2D5A27",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <div className="bg-shape bg-shape-1" aria-hidden="true"></div>
          <div className="bg-shape bg-shape-2" aria-hidden="true"></div>
          <div className="bg-shape bg-shape-3" aria-hidden="true"></div>
          <Navbar />
          <VerifyEmailBanner />
          <main style={{ marginTop: 'var(--nav-height)', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          <BottomNav />
          <InstallPWA />
          <ServiceWorkerRegistration />
        </ToastProvider>
      </body>
    </html>
  );
}
