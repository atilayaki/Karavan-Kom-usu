'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './wrapped.module.css';

interface WrappedStats {
  totalPosts: number;
  totalItems: number;
  totalRoutes: number;
  totalXP: number;
  topCity: string | null;
  joinedAt: string | null;
  topMonth: string | null;
  achievements: number;
  stickers: number;
  level: number;
  name: string;
}

const SLIDES = [
  'intro',
  'journey',
  'posts',
  'routes',
  'city',
  'xp',
  'stickers',
  'finale',
] as const;
type Slide = typeof SLIDES[number];

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export default function WrappedPage() {
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const year = new Date().getFullYear();
      const yearStart = `${year}-01-01T00:00:00.000Z`;

      const [
        { data: profile },
        { data: posts },
        { data: items },
        { count: routesCount },
        { count: achCount },
        { count: stickerCount },
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, xp, level, joined_at').eq('id', user.id).single(),
        supabase.from('posts').select('location_name, created_at').eq('user_id', user.id).gte('created_at', yearStart),
        supabase.from('marketplace_items').select('id').eq('user_id', user.id).gte('created_at', yearStart),
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_achievements').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_city_stickers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const cityCount: Record<string, number> = {};
      const monthCount: Record<number, number> = {};
      (posts || []).forEach(p => {
        if (p.location_name) cityCount[p.location_name] = (cityCount[p.location_name] || 0) + 1;
        const m = new Date(p.created_at).getMonth();
        monthCount[m] = (monthCount[m] || 0) + 1;
      });

      const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const topMonthIdx = Object.entries(monthCount).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
      const topMonth = topMonthIdx ? MONTHS_TR[Number(topMonthIdx[0])] : null;

      setStats({
        totalPosts: (posts || []).length,
        totalItems: (items || []).length,
        totalRoutes: routesCount || 0,
        totalXP: profile?.xp || 0,
        topCity,
        joinedAt: profile?.joined_at || null,
        topMonth,
        achievements: achCount || 0,
        stickers: stickerCount || 0,
        level: profile?.level || Math.floor((profile?.xp || 0) / 100) + 1,
        name: profile?.full_name || 'Karavancı',
      });
      setLoading(false);
    })();
  }, []);

  function goNext() {
    if (slide < SLIDES.length - 1) {
      setRevealed(false);
      setTimeout(() => { setSlide(s => s + 1); setRevealed(true); }, 50);
    }
  }

  function goPrev() {
    if (slide > 0) {
      setRevealed(false);
      setTimeout(() => { setSlide(s => s - 1); setRevealed(true); }, 50);
    }
  }

  useEffect(() => {
    setRevealed(true);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (slide < SLIDES.length - 1) {
      autoTimer.current = setTimeout(goNext, 5000);
    }
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>🚐</div>
          <p>Yolculuğun hesaplanıyor...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.page}>
        <div className={styles.notLoggedIn}>
          <h2>Giriş yapman gerekiyor</h2>
          <p>Yıl sonu özetini görmek için hesabına giriş yap.</p>
          <Link href="/gunluk" className="btn-primary">Giriş Yap</Link>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const currentSlide = SLIDES[slide];

  return (
    <div className={styles.page} onClick={goNext}>
      {/* Progress bars */}
      <div className={styles.progressBar}>
        {SLIDES.map((_, i) => (
          <div key={i} className={styles.progressSegment}>
            <div
              className={styles.progressFill}
              style={{
                width: i < slide ? '100%' : i === slide ? '0%' : '0%',
                animation: i === slide ? `fillProgress 5s linear forwards` : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <button className={styles.navPrev} onClick={e => { e.stopPropagation(); goPrev(); }} aria-label="Önceki">‹</button>
      <button className={styles.navNext} onClick={e => { e.stopPropagation(); goNext(); }} aria-label="Sonraki">›</button>

      {/* Slide content */}
      <div className={`${styles.slide} ${styles[currentSlide]} ${revealed ? styles.revealed : ''}`}>

        {currentSlide === 'intro' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>🚐</div>
            <p className={styles.wrappedLabel}>KARAVAN KOMŞUSU</p>
            <h1>{year} Yol Özeti</h1>
            <p className={styles.slideDesc}>Merhaba <strong>{stats.name}</strong>, bu yıl neler yaptığına bir bakalım.</p>
            <p className={styles.tapHint}>Devam etmek için ekrana dokun →</p>
          </div>
        )}

        {currentSlide === 'journey' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>🗓️</div>
            <p className={styles.wrappedLabel}>YOL GÜNLÜĞÜN</p>
            <h1>Yolculuk devam ediyor</h1>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <span className={styles.statBig}>{stats.totalPosts}</span>
                <span>Paylaşım</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statBig}>{stats.totalItems}</span>
                <span>İlan</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statBig}>{stats.totalRoutes}</span>
                <span>Rota</span>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 'posts' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>📸</div>
            <p className={styles.wrappedLabel}>MANZARA</p>
            <h1>
              <span className={styles.highlightNum}>{stats.totalPosts}</span>
              <br />paylaşım yaptın
            </h1>
            {stats.topMonth && (
              <p className={styles.slideDesc}>
                En aktif ayın <strong>{stats.topMonth}</strong> oldu.
              </p>
            )}
          </div>
        )}

        {currentSlide === 'routes' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>🗺️</div>
            <p className={styles.wrappedLabel}>ROTALAR</p>
            <h1>
              <span className={styles.highlightNum}>{stats.totalRoutes}</span>
              <br />rota çizdin
            </h1>
            <p className={styles.slideDesc}>Her rota bir macera, her mola bir hikâye.</p>
          </div>
        )}

        {currentSlide === 'city' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>📍</div>
            <p className={styles.wrappedLabel}>EN SEVDİĞİN YER</p>
            {stats.topCity ? (
              <>
                <h1 className={styles.cityName}>{stats.topCity}</h1>
                <p className={styles.slideDesc}>Bu şehre en çok döndün.</p>
              </>
            ) : (
              <>
                <h1>Yolun hep açık olsun</h1>
                <p className={styles.slideDesc}>Bu yıl henüz konum etiketlemedin.</p>
              </>
            )}
          </div>
        )}

        {currentSlide === 'xp' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>⭐</div>
            <p className={styles.wrappedLabel}>DENEYİM</p>
            <h1>
              <span className={styles.highlightNum}>{stats.totalXP.toLocaleString('tr-TR')}</span>
              <br />XP topladın
            </h1>
            <div className={styles.levelBadge}>Seviye {stats.level}</div>
            <p className={styles.slideDesc}>{stats.achievements} başarım kazandın.</p>
          </div>
        )}

        {currentSlide === 'stickers' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji}>🗺️</div>
            <p className={styles.wrappedLabel}>ŞEHİR DAMGALARı</p>
            <h1>
              <span className={styles.highlightNum}>{stats.stickers}</span>
              <br />şehri damgaladın
            </h1>
            <p className={styles.slideDesc}>Türkiye&apos;nin dört bir yanına izler bıraktın.</p>
          </div>
        )}

        {currentSlide === 'finale' && (
          <div className={styles.slideInner}>
            <div className={styles.bigEmoji} style={{ filter: 'drop-shadow(0 0 30px gold)' }}>🏕️</div>
            <p className={styles.wrappedLabel}>{year} YOL ÖZETİ</p>
            <h1>İyi yolculuklar, {stats.name.split(' ')[0]}!</h1>
            <p className={styles.slideDesc}>
              Bu yıl {stats.totalPosts} paylaşım, {stats.totalRoutes} rota ve {stats.stickers} şehir damgasıyla yolculuğun güzel geçti.
            </p>
            <div className={styles.finaleActions} onClick={e => e.stopPropagation()}>
              <Link href="/profil" className="btn-primary">Profilime Git</Link>
              <button
                className={styles.shareBtn}
                onClick={() => navigator.share?.({ title: `Karavan Komşusu ${year} Özeti`, text: `Bu yıl ${stats.totalPosts} paylaşım, ${stats.stickers} şehir damgası topladım!`, url: window.location.href })}
              >
                Paylaş
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
