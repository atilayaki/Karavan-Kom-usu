'use client';

import { useState, useEffect } from 'react';
import styles from './InstallPWA.module.css';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Better iOS detection
    const ua = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(ios);

    // Show button for testing
    setIsVisible(true);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('iPhone/iPad için: Paylaş butonuna basıp "Ana Ekrana Ekle" seçeneğini seçin. 📲');
      return;
    }

    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.installContainer}>
      <button onClick={handleInstallClick} className={styles.installBtn}>
        <span className={styles.icon}>📲</span>
        {isIOS ? 'Uygulamayı Yükle (İpucu)' : 'Ana Ekrana Ekle'}
      </button>
    </div>
  );
}
