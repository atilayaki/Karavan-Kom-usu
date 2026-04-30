'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Keşfet', path: '/kesfet', icon: '🗺️' },
    { name: 'Manzara', path: '/manzara', icon: '📸' },
    { name: 'Telsiz', path: '/telsiz', icon: '📻' },
    { name: 'Pazar', path: '/pazaryeri', icon: '🛒' },
    { name: 'Günlük', path: '/gunluk', icon: '🚐' },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
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
