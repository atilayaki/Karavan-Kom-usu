'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../kesfet/kesfet-layout.module.css';

export default function RotaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <Link href="/kesfet" className={`${styles.tab} ${pathname === '/kesfet' ? styles.active : ''}`}>
          🗺️ Keşfet
        </Link>
        <Link href="/rota" className={`${styles.tab} ${pathname === '/rota' ? styles.active : ''}`}>
          🧭 Rota Planlayıcı
        </Link>
      </div>
      {children}
    </div>
  );
}
