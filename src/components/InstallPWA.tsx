'use client';

import { useState, useEffect } from 'react';
import styles from './InstallPWA.module.css';

const DISMISS_KEY = 'kk_install_dismissed_at';
const DISMISS_DAYS = 14;

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    const standalone = (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;

    setPlatform(ios ? 'ios' : android ? 'android' : 'desktop');
    setIsStandalone(standalone);

    // Already installed → don't show
    if (standalone) return;

    // Recently dismissed → wait
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const elapsed = Date.now() - parseInt(dismissed, 10);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Show FAB right away on every non-installed platform.
    // iOS has no beforeinstallprompt; Android/desktop may dispatch it later.
    setShowFab(true);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowFab(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = async () => {
    if (platform === 'ios') {
      setShowSheet(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowFab(false);
      }
      setDeferredPrompt(null);
    } else {
      // Desktop without prompt: show same iOS-style guide as fallback
      setShowSheet(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowFab(false);
    setShowSheet(false);
  };

  if (isStandalone || !showFab) return null;

  return (
    <>
      <button className={styles.fab} onClick={handleClick} aria-label="Uygulamayı yükle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 21h14" />
        </svg>
        <span>Ana Ekrana Ekle</span>
        <button
          className={styles.fabClose}
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          aria-label="Kapat"
          type="button"
        >×</button>
      </button>

      {showSheet && (
        <div className={styles.sheetOverlay} onClick={() => setShowSheet(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <h3 className={styles.sheetTitle}>📲 Ana Ekrana Ekle</h3>
            <p className={styles.sheetSub}>
              {platform === 'ios'
                ? 'iPhone veya iPad\'inde Karavan Komşusu\'na uygulama gibi tek dokunuşla ulaş.'
                : 'Tarayıcı menüsünden bu siteyi uygulama olarak yükleyebilirsin.'}
            </p>

            {platform === 'ios' ? (
              <ol className={styles.steps}>
                <li>
                  <span className={styles.stepNum}>1</span>
                  <span>
                    Safari'nin alt çubuğundaki <strong>Paylaş</strong> ikonuna dokun
                    <span className={styles.iconInline}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>
                  </span>
                </li>
                <li>
                  <span className={styles.stepNum}>2</span>
                  <span>Açılan menüde aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine dokun</span>
                </li>
                <li>
                  <span className={styles.stepNum}>3</span>
                  <span>Sağ üstteki <strong>Ekle</strong>'ye dokun. Hazır! 🎉</span>
                </li>
              </ol>
            ) : (
              <ol className={styles.steps}>
                <li>
                  <span className={styles.stepNum}>1</span>
                  <span>Tarayıcının sağ üstündeki <strong>⋮</strong> menüsünü aç</span>
                </li>
                <li>
                  <span className={styles.stepNum}>2</span>
                  <span><strong>"Uygulamayı yükle"</strong> veya <strong>"Ana ekrana ekle"</strong>'ye dokun</span>
                </li>
                <li>
                  <span className={styles.stepNum}>3</span>
                  <span>Onayla. Hazır! 🎉</span>
                </li>
              </ol>
            )}

            <div className={styles.sheetActions}>
              <button className={styles.sheetSecondary} onClick={handleDismiss}>Bir daha gösterme</button>
              <button className={styles.sheetPrimary} onClick={() => setShowSheet(false)}>Anladım</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
