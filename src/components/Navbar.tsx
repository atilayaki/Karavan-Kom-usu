'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { supabase } from '@/lib/supabase';

const NAV_CATEGORIES = [
  {
    label: 'Gezgin',
    items: [
      { href: '/manzara', label: 'Manzara',        icon: '📸' },
      { href: '/kesfet',  label: 'Keşfet & Rota', icon: '🗺️' },
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
    if (!open) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const [user, setUser] = useState<{ id: string; avatarUrl?: string | null } | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const fetchAvatar = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
    return data?.avatar_url ?? null;
  };

  useEffect(() => {
    // getSession reads from localStorage — instant, no network round-trip
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Show user icon immediately, load avatar in background
        setUser({ id: session.user.id, avatarUrl: null });
        setAuthReady(true);
        fetchAvatar(session.user.id).then(avatarUrl => {
          setUser(prev => prev ? { ...prev, avatarUrl } : null);
        });
      } else {
        setAuthReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        setUser(prev => prev?.id === session.user.id ? prev : { id: session.user.id, avatarUrl: null });
        setAuthReady(true);
        fetchAvatar(session.user.id).then(avatarUrl => {
          setUser(prev => prev ? { ...prev, avatarUrl } : null);
        });
      } else {
        setUser(null);
        setAuthReady(true);
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const drawer = (
    <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <Logo className={styles.drawerLogo} />
          <span className={styles.drawerBrand}>Karavan Komşusu</span>
          <button className={styles.drawerClose} onClick={() => setOpen(false)} aria-label="Kapat">✕</button>
        </div>

        <div className={styles.netflixBody}>
          {NAV_CATEGORIES.map((cat, catIdx) => (
            <div key={cat.label} className={styles.netflixRow}>
              <span className={styles.netflixRowLabel}>{cat.label}</span>
              <div className={styles.netflixScroll}>
                {cat.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-cat={catIdx}
                    className={`${styles.netflixCard} ${pathname === item.href ? styles.netflixCardActive : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.netflixCardIcon}>{item.icon}</span>
                    <span className={styles.netflixCardTitle}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <Link href={`/profil/${user.id}`} className={styles.drawerProfile} style={{marginBottom: 0}} onClick={() => setOpen(false)}>
            <span>👀</span>
            <span>Genel Profilimi Gör</span>
            <span className={styles.drawerArrow}>→</span>
          </Link>
        )}

        <Link href="/gunluk" className={styles.drawerProfile} onClick={() => setOpen(false)}>
          <span>⚙️</span>
          <span>Günlüğüm & Ayarlar</span>
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
              onClick={() => setOpen(v => !v)}
              aria-label="Menüyü aç"
              aria-expanded={open}
              type="button"
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
          {/* Desktop: sol üst */}
          <div className={styles.bellLeft}>
            <NotificationBell align="left" />
          </div>

          <div className={styles.actions}>
            {/* Mobile: sağ üst */}
            <div className={styles.bellMobile}><NotificationBell align="right" /></div>
            <Link href="/gunluk" className={`${styles.profileBtn} ${!authReady ? styles.profileBtnLoading : ''}`} aria-label="Günlüğüm">
              {!authReady
                ? null
                : user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="Profil" className={styles.profileAvatar} />
                  : '👤'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Portal drawer — rendered directly to body to escape nav stacking context */}
      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
