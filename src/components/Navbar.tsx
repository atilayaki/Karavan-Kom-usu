'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const NAV_CATEGORIES = [
  {
    label: 'Gezgin',
    items: [
      { href: '/kesfet',   label: 'Keşfet',   icon: '🗺️' },
      { href: '/rota',     label: 'Rota',      icon: '🧭' },
      { href: '/manzara',  label: 'Manzara',   icon: '📸' },
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
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const drawer = (
    <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <Logo className={styles.drawerLogo} />
          <span className={styles.drawerBrand}>Karavan Komşusu</span>
          <button className={styles.drawerClose} onClick={() => setOpen(false)} aria-label="Kapat">✕</button>
        </div>

        <div className={styles.drawerBody}>
          {NAV_CATEGORIES.map(cat => (
            <div key={cat.label} className={styles.drawerSection}>
              <span className={styles.drawerSectionLabel}>{cat.label}</span>
              <div className={styles.drawerGrid}>
                {cat.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.drawerItem} ${pathname === item.href ? styles.drawerItemActive : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.drawerIcon}>{item.icon}</span>
                    <span className={styles.drawerLabel}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link href="/gunluk" className={styles.drawerProfile} onClick={() => setOpen(false)}>
          <span>👤</span>
          <span>Günlüğüm & Profil</span>
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
          <div className={styles.actions}>
            <NotificationBell />
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
