'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function Navbar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Logo className={styles.logoImage} />
          <span className={styles.logoText}>Karavan Komşusu</span>
        </Link>
        <div className={styles.links}>
          {showInstallBtn && (
            <button className={styles.installBtn} onClick={handleInstall}>İndir</button>
          )}
          <Link href="/kesfet">Keşfet</Link>
          <Link href="/manzara">Manzara</Link>
          <Link href="/telsiz">Telsiz</Link>
          <Link href="/pazaryeri">Pazaryeri</Link>
          <Link href="/rehber">Rehber</Link>
          <Link href="/gunluk" className={styles.profileBtn}>Günlüğüm</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
