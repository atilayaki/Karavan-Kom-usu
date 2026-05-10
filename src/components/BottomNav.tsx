'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './BottomNav.module.css';

const MAIN_ITEMS = [
  { name: 'Manzara',  path: '/manzara',   icon: '📸' },
  { name: 'Mesajlar', path: '/mesajlar',  icon: '💬' },
  { name: 'Telsiz',   path: '/telsiz',    icon: '📻' },
  { name: 'Pazar',    path: '/pazaryeri', icon: '🛒' },
  { name: 'Günlük',   path: '/gunluk',    icon: '🚐' },
];

const MORE_ITEMS = [
  { name: 'Keşfet & Rota',  path: '/kesfet',       icon: '🗺️' },
  { name: 'Kamp Ateşi',     path: '/kamp-atesi',   icon: '🔥' },
  { name: 'Etkinlikler',    path: '/etkinlikler',  icon: '📅' },
  { name: 'Bakım',          path: '/bakim',        icon: '🔧' },
  { name: 'Rehber',         path: '/rehber',       icon: '📖' },
  { name: 'Yıl Özeti',      path: '/wrapped',      icon: '🏕️' },
  { name: 'Hakkımızda',     path: '/hakkimizda',   icon: '🧭' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onTap = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', onTap);
    document.addEventListener('touchstart', onTap);
    return () => {
      document.removeEventListener('mousedown', onTap);
      document.removeEventListener('touchstart', onTap);
    };
  }, [drawerOpen]);

  const moreActive = MORE_ITEMS.some(i => i.path === pathname);

  return (
    <>
      {drawerOpen && <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />}

      {drawerOpen && (
        <div className={styles.drawer} ref={drawerRef}>
          <div className={styles.drawerHandle} />
          <div className={styles.drawerGrid}>
            {MORE_ITEMS.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.drawerItem} ${pathname === item.path ? styles.drawerActive : ''}`}
              >
                <span className={styles.drawerIcon}>{item.icon}</span>
                <span className={styles.drawerLabel}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className={styles.bottomNav}>
        {MAIN_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.name}</span>
            </Link>
          );
        })}

        <button
          className={`${styles.navItem} ${moreActive || drawerOpen ? styles.active : ''}`}
          onClick={() => setDrawerOpen(o => !o)}
          aria-label="Daha Fazla"
        >
          <span className={styles.icon}>{drawerOpen ? '✕' : '⋯'}</span>
          <span className={styles.label}>Daha Fazla</span>
        </button>
      </nav>
    </>
  );
}
