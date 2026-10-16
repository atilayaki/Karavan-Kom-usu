'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './QuickSearchModal.module.css';

interface SearchResult {
  id: string | number;
  type: 'spot' | 'market' | 'page' | 'route';
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: 'page-kesfet', type: 'page', title: 'Harita & Keşfet', subtitle: 'Konaklama noktaları ve yol ustaları', icon: '🗺️', href: '/kesfet' },
  { id: 'page-egzersiz', type: 'page', title: 'VanLife Fit & Egzersiz', subtitle: 'Sürüş sonrası bel açma, hareketli animasyonlar ve kamp fit', icon: '🏃', href: '/egzersiz' },
  { id: 'page-rota', type: 'page', title: 'Rota Planlayıcı', subtitle: 'Karavanına uygun güvenli rotalar çiz', icon: '🛣️', href: '/rota' },
  { id: 'page-telsiz', type: 'page', title: 'Telsiz & SOS', subtitle: 'Canlı frekans, yakındaki karavancılar', icon: '📻', href: '/telsiz' },
  { id: 'page-manzara', type: 'page', title: 'Manzara & Rotalar', subtitle: 'Topluluk fotoğrafları ve askıda notlar', icon: '📸', href: '/manzara' },
  { id: 'page-kampatesi', type: 'page', title: 'Kamp Ateşi', subtitle: 'Her gece 20:00 sohbeti', icon: '🔥', href: '/kamp-atesi' },
  { id: 'page-pazaryeri', type: 'page', title: 'Pazaryeri', subtitle: 'İkinci el ekipman ve malzeme alım-satım', icon: '🛒', href: '/pazaryeri' },
  { id: 'page-bakim', type: 'page', title: 'Bakım Takvimi', subtitle: 'Akü, su, filtre ve periyodik servis', icon: '🔧', href: '/bakim' },
  { id: 'page-etkinlikler', type: 'page', title: 'Etkinlikler', subtitle: 'Buluşmalar, kamplar ve festivaller', icon: '📅', href: '/etkinlikler' },
  { id: 'page-rehber', type: 'page', title: 'Karavan Rehberi', subtitle: 'Mevzuat, B ehliyet, teknik ipuçları', icon: '📖', href: '/rehber' },
  { id: 'page-gunluk', type: 'page', title: 'Karavan Günlüğüm', subtitle: 'Profilim, karavan pasaportum ve rozetler', icon: '🚐', href: '/gunluk' },
];

export default function QuickSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(STATIC_PAGES.slice(0, 5));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          navigate(results[selectedIndex].href);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(STATIC_PAGES.slice(0, 5));
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const cleanQ = query.toLowerCase().trim();

      // Static page matches
      const matchedPages = STATIC_PAGES.filter(
        p => p.title.toLowerCase().includes(cleanQ) || (p.subtitle && p.subtitle.toLowerCase().includes(cleanQ))
      );

      try {
        // Query spots and marketplace items
        const [spotsRes, itemsRes] = await Promise.all([
          supabase
            .from('spots')
            .select('id, title, address, category')
            .or(`title.ilike.%${cleanQ}%,address.ilike.%${cleanQ}%`)
            .limit(5),
          supabase
            .from('marketplace_items')
            .select('id, title, price, location_name')
            .ilike('title', `%${cleanQ}%`)
            .limit(4),
        ]);

        const spotResults: SearchResult[] = (spotsRes.data || []).map(s => ({
          id: `spot-${s.id}`,
          type: 'spot',
          title: s.title,
          subtitle: `${s.category} • ${s.address || 'Konum belirtilmedi'}`,
          icon: s.category === 'Yol Yardımcısı' ? '🔧' : '🏕️',
          href: `/kesfet?spot=${s.id}`,
        }));

        const itemResults: SearchResult[] = (itemsRes.data || []).map(item => ({
          id: `item-${item.id}`,
          type: 'market',
          title: item.title,
          subtitle: `${item.price ? `${item.price.toLocaleString('tr-TR')} ₺` : 'Fiyat Belirtilmemiş'} • ${item.location_name || ''}`,
          icon: '🛒',
          href: `/pazaryeri/${item.id}`,
        }));

        const combined = [...matchedPages, ...spotResults, ...itemResults];
        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        setResults(matchedPages);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Mekan, rota, usta, ekipman veya sayfa ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              ✕
            </button>
          )}
          <kbd className={styles.escBadge} onClick={onClose}>ESC</kbd>
        </div>

        <div className={styles.resultsList}>
          {loading && <div className={styles.loadingState}>Aranıyor... 🚐</div>}

          {!loading && results.length === 0 && (
            <div className={styles.emptyState}>
              <span style={{ fontSize: '2rem' }}>🏕️</span>
              <p>&quot;{query}&quot; ile eşleşen bir şey bulamadık.</p>
              <small>Farklı bir kelime aramayı veya haritaya göz atmayı deneyin.</small>
            </div>
          )}

          {!loading && results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                className={`${styles.resultItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className={styles.itemIcon}>{item.icon}</div>
                <div className={styles.itemMeta}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  {item.subtitle && <div className={styles.itemSubtitle}>{item.subtitle}</div>}
                </div>
                <div className={styles.itemAction}>
                  <span className={styles.typeBadge}>
                    {item.type === 'spot' ? 'Mekan' : item.type === 'market' ? 'İlan' : 'Sayfa'}
                  </span>
                  <span className={styles.enterHint}>↵</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footerHints}>
          <span><kbd>↑</kbd><kbd>↓</kbd> Gezin</span>
          <span><kbd>↵</kbd> Seç</span>
          <span><kbd>ESC</kbd> Kapat</span>
        </div>
      </div>
    </div>
  );
}
