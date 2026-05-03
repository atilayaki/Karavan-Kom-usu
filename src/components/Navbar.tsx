'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { href: '/kesfet', label: 'Keşfet', icon: '🗺️' },
  { href: '/rota', label: 'Rota', icon: '🧭' },
  { href: '/manzara', label: 'Manzara', icon: '📸' },
  { href: '/telsiz', label: 'Telsiz', icon: '📻' },
  { href: '/pazaryeri', label: 'Pazaryeri', icon: '🛒' },
  { href: '/etkinlikler', label: 'Etkinlikler', icon: '📅' },
  { href: '/kamp-atesi', label: 'Kamp Ateşi', icon: '🔥' },
  { href: '/mesajlar', label: 'Mesajlar', icon: '💬' },
  { href: '/bakim', label: 'Bakım Takvimi', icon: '🔧' },
  { href: '/rehber', label: 'Rehber', icon: '📖' },
  { href: '/wrapped', label: 'Yıl Özeti', icon: '🏕️' },
  { href: '/gunluk', label: 'Günlüğüm', icon: '👤' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
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
        <div
          className={styles.menuWrapper}
          ref={wrapperRef}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <button
            className={`${styles.menuBtn} ${open ? styles.menuBtnOpen : ''}`}
            onClick={() => setOpen(!open)}
            aria-label="Menüyü aç"
            aria-expanded={open}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

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

        <Link
          href="/"
          className={styles.logo}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo className={styles.logoImage} />
          <span className={styles.logoText}>Karavan Komşusu</span>
        </Link>

        <div className={styles.actions}>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
