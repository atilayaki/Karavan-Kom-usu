import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import InstallPWA from "@/components/InstallPWA";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import TimeOfDayTheme from "@/components/TimeOfDayTheme";
import AmbientSound from "@/components/AmbientSound";
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
  interactiveWidget: "resizes-content" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark-mode" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <TimeOfDayTheme />
          <div className="todOverlay" aria-hidden="true"></div>
          <div className="bg-shape bg-shape-1" aria-hidden="true"></div>
          <div className="bg-shape bg-shape-2" aria-hidden="true"></div>
          <div className="bg-shape bg-shape-3" aria-hidden="true"></div>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <InstallPWA />
          <AmbientSound />
          <ServiceWorkerRegistration />
        </ToastProvider>
      </body>
    </html>
  );
}
