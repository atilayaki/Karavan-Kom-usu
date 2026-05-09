'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        setKeyboardOpen(true);
        document.body.classList.add('keyboard-open');
      }
    };
    const onBlur = () => setTimeout(() => {
      setKeyboardOpen(false);
      document.body.classList.remove('keyboard-open');
    }, 150);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, []);

  const navItems = [
    { name: 'Manzara', path: '/manzara', icon: '📸' },
    { name: 'Mesajlar', path: '/mesajlar', icon: '💬' },
    { name: 'Telsiz', path: '/telsiz', icon: '📻' },
    { name: 'Pazar', path: '/pazaryeri', icon: '🛒' },
    { name: 'Günlük', path: '/gunluk', icon: '🚐' },
  ];

  if (keyboardOpen) return null;

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
