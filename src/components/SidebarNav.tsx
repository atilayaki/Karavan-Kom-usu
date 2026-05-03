'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SidebarNav.module.css';

const NAV_CATEGORIES = [
  {
    label: 'Gezgin',
    items: [
      { href: '/kesfet',  label: 'Keşfet',      icon: '🗺️' },
      { href: '/rota',    label: 'Rota',         icon: '🧭' },
      { href: '/manzara', label: 'Manzara',      icon: '📸' },
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
      { href: '/pazaryeri', label: 'Pazaryeri', icon: '🛒' },
      { href: '/bakim',     label: 'Bakım',     icon: '🔧' },
      { href: '/rehber',    label: 'Rehber',    icon: '📖' },
      { href: '/wrapped',   label: 'Yıl Özeti', icon: '🏕️' },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {NAV_CATEGORIES.map(cat => (
        <div key={cat.label} className={styles.section}>
          <span className={styles.label}>{cat.label}</span>
          {cat.items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
      <Link href="/gunluk" className={`${styles.profile} ${pathname === '/gunluk' ? styles.active : ''}`}>
        <span>👤</span>
        <span>Günlüğüm</span>
      </Link>
    </aside>
  );
}
