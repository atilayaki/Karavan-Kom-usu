import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Karavan Komşusu | Yolun Tadını Birlikte Çıkaralım",
  description: "Karavancılar için premium sosyal ağ ve bilgi platformu.",
  manifest: "/manifest.json",
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
      <body className="">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
        <Navbar />
        <main style={{ marginTop: 'var(--nav-height)', paddingBottom: '70px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
