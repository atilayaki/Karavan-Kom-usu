'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import QuickSearchModal from './QuickSearchModal';
import { supabase } from '@/lib/supabase';

const NAV_CATEGORIES = [
  {
    label: 'Gezgin',
    items: [
      { href: '/kesfet',  label: 'Keşfet & Harita', icon: '🗺️' },
      { href: '/rota',    label: 'Rota Planlayıcı', icon: '🛣️' },
      { href: '/manzara', label: 'Manzara & Rotalar', icon: '📸' },
    ],
  },
  {
    label: 'Topluluk',
    items: [
      { href: '/telsiz',      label: 'Telsiz & SOS',  icon: '📻' },
      { href: '/kamp-atesi',  label: 'Kamp Ateşi',    icon: '🔥' },
      { href: '/mesajlar',    label: 'Mesajlar',      icon: '💬' },
      { href: '/etkinlikler', label: 'Etkinlikler',   icon: '📅' },
    ],
  },
  {
    label: 'Araçlar & Rehber',
    items: [
      { href: '/pazaryeri',  label: 'Pazaryeri',     icon: '🛒' },
      { href: '/bakim',      label: 'Bakım Takvimi', icon: '🔧' },
      { href: '/rehber',     label: 'Karavan Rehberi', icon: '📖' },
      { href: '/wrapped',    label: 'Yıl Özeti',     icon: '🏕️' },
      { href: '/hakkimizda', label: 'Hakkımızda',    icon: '🧭' },
    ],
  },
];

const ALL_ITEMS = NAV_CATEGORIES.flatMap(c => c.items);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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
              <div
                className={styles.netflixScroll}
                style={{ gridTemplateColumns: `repeat(${cat.items.length <= 4 ? cat.items.length : 5}, 1fr)` }}
              >
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
          <span>Günlüğüm & Karavan Pasaportum</span>
          <span className={styles.drawerArrow}>→</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>

          {/* Sol Kısım: Menü Butonu & Logo */}
          <div className={styles.leftSection}>
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
              <div className={styles.logoTextWrap}>
                <span className={styles.logoText}>Karavan Komşusu</span>
                <span className={styles.logoBadge}>PRO</span>
              </div>
            </Link>
          </div>

          {/* Orta Kısım: Spotlight Arama Çubuğu */}
          <div className={styles.centerSection}>
            <button
              type="button"
              className={styles.searchBarBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Hızlı Arama"
            >
              <span className={styles.searchBarIcon}>🔍</span>
              <span className={styles.searchBarPlaceholder}>Mekan, rota, usta veya ekipman ara...</span>
              <kbd className={styles.searchKeyHint}>⌘K</kbd>
            </button>
          </div>

          {/* Sağ Kısım: SOS, Bildirim, Tema, Profil */}
          <div className={styles.actions}>
            {/* Hızlı SOS Butonu */}
            <Link
              href="/telsiz?channel=Acil%20Durum"
              className={styles.sosQuickBtn}
              title="Acil Durum SOS Telsizi"
            >
              <span className={styles.sosDot}></span>
              <span>SOS</span>
            </Link>

            {/* Arama Butonu (Mobilde) */}
            <button
              type="button"
              className={styles.mobileSearchIconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Ara"
            >
              🔍
            </button>

            {/* Tema Değiştirici */}
            <div className={styles.themeToggleWrap}>
              <ThemeToggle />
            </div>

            {/* Bildirim Zili */}
            <div className={styles.bellWrap}>
              <NotificationBell align="right" />
            </div>

            {/* Profil Avatarı */}
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

      {/* Global Quick Search Modal */}
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Portal drawer — rendered directly to body to escape nav stacking context */}
      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
