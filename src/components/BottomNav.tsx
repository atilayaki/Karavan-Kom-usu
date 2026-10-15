'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const PRIMARY_NAV = [
  { name: 'Keşfet',   path: '/kesfet',    icon: '🗺️' },
  { name: 'Manzara',  path: '/manzara',   icon: '📸' },
  { name: 'Telsiz',   path: '/telsiz',    icon: '📻', isCenter: true },
  { name: 'Pazar',    path: '/pazaryeri', icon: '🛒' },
];

const MORE_TOOLS = [
  { name: 'Rota Planlayıcı', path: '/rota',        icon: '🛣️', desc: 'Güvenli karavan rotası çiz' },
  { name: 'Bakım Takvimi',   path: '/bakim',       icon: '🔧', desc: 'Servis ve periyodik takip' },
  { name: 'Kamp Ateşi',      path: '/kamp-atesi',  icon: '🔥', desc: 'Gece 20:00 topluluk sohbeti' },
  { name: 'Etkinlikler',     path: '/etkinlikler', icon: '📅', desc: 'Festivaller ve buluşmalar' },
  { name: 'Karavan Rehberi', path: '/rehber',      icon: '📖', desc: 'Mevzuat ve teknik ipuçları' },
  { name: 'Karavan Günlüğü', path: '/gunluk',      icon: '🚐', desc: 'Profilin ve karavan pasaportun' },
  { name: 'Hakkımızda',      path: '/hakkimizda',  icon: '🧭', desc: 'Vizyonumuz ve manifestomuz' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = MORE_TOOLS.some(t => t.path === pathname);

  return (
    <>
      <nav className={styles.bottomNav}>
        {PRIMARY_NAV.slice(0, 2).map((item) => {
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

        {/* Center Prominent Telsiz Button */}
        {PRIMARY_NAV.slice(2, 3).map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.centerNavItem} ${isActive ? styles.centerActive : ''}`}
              aria-label="Telsiz ve Canlı İletişim"
            >
              <div className={styles.centerIconWrap}>
                <span className={styles.centerIcon}>{item.icon}</span>
                <span className={styles.livePulse}></span>
              </div>
              <span className={styles.centerLabel}>{item.name}</span>
            </Link>
          );
        })}

        {PRIMARY_NAV.slice(3, 4).map((item) => {
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

        {/* More / Tools Drawer Trigger */}
        <button
          type="button"
          className={`${styles.navItem} ${isMoreActive || isMoreOpen ? styles.active : ''}`}
          onClick={() => setIsMoreOpen(prev => !prev)}
          aria-label="Tüm Araçlar Menüsü"
        >
          <span className={styles.icon}>☰</span>
          <span className={styles.label}>Menü</span>
        </button>
      </nav>

      {/* Drawer Overlay for Mobile */}
      {isMoreOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setIsMoreOpen(false)}>
          <div className={styles.drawerSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHandleWrap}>
              <div className={styles.sheetHandle}></div>
            </div>

            <div className={styles.sheetHeader}>
              <div>
                <h3 className={styles.sheetTitle}>Karavan İstasyonu</h3>
                <p className={styles.sheetSub}>Tüm araçlar ve topluluk özellikleri</p>
              </div>
              <button
                className={styles.sheetCloseBtn}
                onClick={() => setIsMoreOpen(false)}
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <div className={styles.toolsGrid}>
              {MORE_TOOLS.map(tool => {
                const isActive = pathname === tool.path;
                return (
                  <Link
                    key={tool.path}
                    href={tool.path}
                    className={`${styles.toolCard} ${isActive ? styles.toolCardActive : ''}`}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    <span className={styles.toolIcon}>{tool.icon}</span>
                    <div className={styles.toolInfo}>
                      <span className={styles.toolName}>{tool.name}</span>
                      <span className={styles.toolDesc}>{tool.desc}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
