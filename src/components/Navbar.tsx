'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { supabase } from '@/lib/supabase';

const NAV_CATEGORIES = [
  {
    label: 'Gezgin',
    items: [
      { href: '/kesfet',  label: 'Keşfet & Rota', icon: '🗺️' },
      { href: '/manzara', label: 'Manzara',        icon: '📸' },
    ],
  },
  {
    label: 'Topluluk',
    items: [
      { href: '/telsiz',      label: 'Telsiz',      icon: '📻' },
      { href: '/kamp-atesi',  label: 'Kamp Ateşi',  icon: '🔥' },
      { href: '/mesajlar',    label: 'Mesajlar',    icon: '💬' },
      { href: '/etkinlikler', label: 'Etkinlikler', icon: '📅' },
    ],
  },
  {
    label: 'Araçlar',
    items: [
      { href: '/pazaryeri', label: 'Pazaryeri',     icon: '🛒' },
      { href: '/bakim',     label: 'Bakım',         icon: '🔧' },
      { href: '/rehber',    label: 'Rehber',        icon: '📖' },
      { href: '/wrapped',   label: 'Yıl Özeti',    icon: '🏕️' },
    ],
  },
];

// Flat list for desktop dropdown
const ALL_ITEMS = NAV_CATEGORIES.flatMap(c => c.items);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const drawer = (
    <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <Logo className={styles.drawerLogo} />
          <span className={styles.drawerBrand}>Karavan Komşusu</span>
          <button className={styles.drawerClose} onClick={() => setOpen(false)} aria-label="Kapat">✕</button>
        </div>

        <div className={styles.netflixBody}>
          {NAV_CATEGORIES.map((cat, catIdx) => (
            <div key={cat.label} className={styles.netflixRow}>
              <span className={styles.netflixRowLabel}>{cat.label}</span>
              <div className={styles.netflixScroll}>
                {cat.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-cat={catIdx}
                    className={`${styles.netflixCard} ${pathname === item.href ? styles.netflixCardActive : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.netflixCardIcon}>{item.icon}</span>
                    <span className={styles.netflixCardTitle}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <Link href={`/profil/${user.id}`} className={styles.drawerProfile} style={{marginBottom: 0}} onClick={() => setOpen(false)}>
            <span>👀</span>
            <span>Genel Profilimi Gör</span>
            <span className={styles.drawerArrow}>→</span>
          </Link>
        )}

        <Link href="/gunluk" className={styles.drawerProfile} onClick={() => setOpen(false)}>
          <span>⚙️</span>
          <span>Günlüğüm & Ayarlar</span>
          <span className={styles.drawerArrow}>→</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>

          {/* Hamburger + desktop dropdown */}
          <div className={styles.menuWrapper} ref={wrapperRef}>
            <button
              className={`${styles.menuBtn} ${open ? styles.menuBtnOpen : ''}`}
              onTouchStart={(e) => { e.preventDefault(); setOpen(v => !v); }}
              onClick={() => setOpen(v => !v)}
              aria-label="Menüyü aç"
              aria-expanded={open}
            >
              <span></span><span></span><span></span>
            </button>

            {open && (
              <div className={styles.dropdown + ' glass-card'}>
                {ALL_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={styles.dropdownItem}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.dropdownIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Logo */}
          <Link
            href="/"
            className={styles.logo}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo className={styles.logoImage} />
            <span className={styles.logoText}>Karavan Komşusu</span>
          </Link>

          {/* Right actions */}
          {/* Desktop: sol üst */}
          <div className={styles.bellLeft}>
            <NotificationBell align="left" />
          </div>

          <div className={styles.actions}>
            {/* Mobile: sağ üst */}
            <div className={styles.bellMobile}><NotificationBell align="right" /></div>
            <Link href="/gunluk" className={styles.profileBtn} aria-label="Günlüğüm">👤</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Portal drawer — rendered directly to body to escape nav stacking context */}
      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
