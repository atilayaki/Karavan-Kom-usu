'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { href: '/kesfet',     label: 'Keşfet',         icon: '🗺️' },
  { href: '/rota',       label: 'Rota',            icon: '🧭' },
  { href: '/manzara',    label: 'Manzara',         icon: '📸' },
  { href: '/telsiz',     label: 'Telsiz',          icon: '📻' },
  { href: '/pazaryeri',  label: 'Pazaryeri',       icon: '🛒' },
  { href: '/etkinlikler',label: 'Etkinlikler',     icon: '📅' },
  { href: '/kamp-atesi', label: 'Kamp Ateşi',      icon: '🔥' },
  { href: '/mesajlar',   label: 'Mesajlar',        icon: '💬' },
  { href: '/bakim',      label: 'Bakım Takvimi',   icon: '🔧' },
  { href: '/rehber',     label: 'Rehber',          icon: '📖' },
  { href: '/wrapped',    label: 'Yıl Özeti',       icon: '🏕️' },
  { href: '/gunluk',     label: 'Günlüğüm',        icon: '👤' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close dropdown on outside click (desktop)
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>

        {/* ── Hamburger + Desktop dropdown ── */}
        <div
          className={styles.menuWrapper}
          ref={wrapperRef}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <button
            className={`${styles.menuBtn} ${open ? styles.menuBtnOpen : ''}`}
            onClick={() => setOpen(v => !v)}
            aria-label="Menüyü aç"
            aria-expanded={open}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Desktop dropdown */}
          {open && (
            <div className={styles.dropdown + ' glass-card'}>
              {NAV_ITEMS.map(item => (
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

        {/* ── Logo ── */}
        <Link
          href="/"
          className={styles.logo}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo className={styles.logoImage} />
          <span className={styles.logoText}>Karavan Komşusu</span>
        </Link>

        {/* ── Right actions ── */}
        <div className={styles.actions}>
          <NotificationBell />
          <Link href="/gunluk" className={styles.profileBtn} aria-label="Günlüğüm">👤</Link>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Mobile full-screen drawer ── */}
      {open && (
        <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <Logo className={styles.drawerLogo} />
              <span className={styles.drawerBrand}>Karavan Komşusu</span>
              <button className={styles.drawerClose} onClick={() => setOpen(false)} aria-label="Kapat">✕</button>
            </div>

            <div className={styles.drawerGrid}>
              {NAV_ITEMS.map(item => (
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
        </div>
      )}
    </nav>
  );
}
