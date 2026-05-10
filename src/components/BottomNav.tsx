'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { name: 'Manzara',  path: '/manzara',   icon: '📸' },
  { name: 'Mesajlar', path: '/mesajlar',  icon: '💬' },
  { name: 'Telsiz',   path: '/telsiz',    icon: '📻' },
  { name: 'Pazar',    path: '/pazaryeri', icon: '🛒' },
  { name: 'Günlük',   path: '/gunluk',    icon: '🚐' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
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
    </nav>
  );
}
