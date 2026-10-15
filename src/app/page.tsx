'use client';

import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import WeatherWidget from '@/components/WeatherWidget';
import SeasonalTips from '@/components/SeasonalTips';
import ActivityFeed from '@/components/ActivityFeed';
import ChallengesWidget from '@/components/ChallengesWidget';
import KomsuRadar from '@/components/KomsuRadar';
import { IconTool, IconCamp, IconRadio, IconShop, IconBook, IconMap, IconCalendar, IconCaravan } from '@/components/Icons';

const HERO_IMAGES = [
  '/hero-bg.png',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2000&auto=format&fit=crop'
];

const formatCount = (n: number): string => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n >= 100) return Math.floor(n / 10) * 10 + '+';
  return String(n);
};

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useScrollReveal();
  const [stats, setStats] = useState([
    { label: 'Karavancı', value: '—', icon: '🚐' },
    { label: 'Konaklama Noktası', value: '—', icon: '📍' },
    { label: 'Paylaşılan Manzara', value: '—', icon: '📸' },
    { label: 'Aktif İlan', value: '—', icon: '🛒' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [users, spots, posts, items] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('spots').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
      ]);
      if (!mounted) return;
      setStats([
        { label: 'Karavancı', value: formatCount(users.count || 0), icon: '🚐' },
        { label: 'Konaklama Noktası', value: formatCount(spots.count || 0), icon: '📍' },
        { label: 'Paylaşılan Manzara', value: formatCount(posts.count || 0), icon: '📸' },
        { label: 'Aktif İlan', value: formatCount(items.count || 0), icon: '🛒' },
      ]);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={styles.page} ref={scrollRef}>
      {/* ─── Hero Section ─── */}
      <section className={styles.hero}>
        {HERO_IMAGES.map((img, index) => (
          <div
            key={index}
            className={styles.heroBg}
            style={{
              backgroundImage: `url(${img})`,
              opacity: index === currentImageIndex ? 1 : 0,
              zIndex: index === currentImageIndex ? 1 : 0,
            }}
          />
        ))}

        <div className={styles.heroOverlay}></div>
        <div className={styles.heroParticles} aria-hidden="true"></div>

        <div className={styles.heroContent}>
          <span className={`${styles.heroAccent} font-accent`}>Hoş Geldin, Komşu!</span>
          <h1 className={styles.title}>
            Yolun Tadını <br />
            <span>Birlikte Çıkaralım</span>
          </h1>
          <p className={styles.subtitle}>
            Türkiye&apos;nin en samimi karavan topluluğuna katıl.<br />
            Ustanı bul, gizli durakları keşfet, telsizle komşularına selam ver.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/kesfet" className="btn-primary">
              <IconMap size={18} /> Keşfetmeye Başla
            </Link>
            <Link href="/gunluk" className="btn-secondary" style={{ color: 'white' }}>
              <IconCaravan size={18} /> Karavan Pasaportum
            </Link>
          </div>

          <button
            className={styles.tourBtn}
            onClick={() => window.dispatchEvent(new CustomEvent('karavan:show-tour'))}
          >
            🗺️ Platform Turu
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel}></div>
          </div>
          <span>Kokpit</span>
        </div>
      </section>

      {/* ─── Hızlı Karavan Kokpiti (Quick Actions) ─── */}
      <section className={`${styles.cockpitBar} reveal`}>
        <div className={styles.cockpitGrid}>
          <Link href="/kesfet" className={styles.cockpitActionCard}>
            <span className={styles.cockpitActionIcon}>💧</span>
            <div className={styles.cockpitActionText}>
              <strong>Su & Elektrik Bul</strong>
              <small>En yakın ikmal noktaları</small>
            </div>
          </Link>

          <Link href="/telsiz" className={styles.cockpitActionCard}>
            <span className={styles.cockpitActionIcon}>📻</span>
            <div className={styles.cockpitActionText}>
              <strong>Telsize Bağlan</strong>
              <small>Canlı çevre frekansı</small>
            </div>
          </Link>

          <Link href="/rota" className={styles.cockpitActionCard}>
            <span className={styles.cockpitActionIcon}>🛣️</span>
            <div className={styles.cockpitActionText}>
              <strong>Rota Planlayıcı</strong>
              <small>Karavana uygun yol çiz</small>
            </div>
          </Link>

          <Link href="/telsiz?channel=Acil%20Durum" className={`${styles.cockpitActionCard} ${styles.cockpitActionSOS}`}>
            <span className={styles.cockpitActionIcon}>🚨</span>
            <div className={styles.cockpitActionText}>
              <strong>Acil SOS Yayını</strong>
              <small>Kanal 16 acil yardım</small>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className={`${styles.statsBar} reveal`}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </section>

      <div className={styles.contentArea}>
        {/* ─── Modern Bento Grid: Karavan Kontrol Paneli ─── */}
        <section className={styles.bentoSection}>
          <div className={styles.bentoHeader}>
            <h2 className={styles.sectionTitle}>
              <span className="font-accent" style={{ color: 'var(--sunset-orange)', fontSize: '1.2em' }}>Seyahat Kokpiti</span>
              <br />Yol Durumu & Komşular
            </h2>
            <p className={styles.sectionSub}>Konumuna ve mevsime özel anlık güncellemeler</p>
          </div>

          <div className={styles.bentoGrid}>
            {/* Bento Sol: Hava Durumu & Mevsim Rehberi */}
            <div className={styles.bentoCol}>
              <div className="reveal">
                <WeatherWidget />
              </div>
              <div className="reveal" style={{ transitionDelay: '100ms' }}>
                <SeasonalTips />
              </div>
            </div>

            {/* Bento Sağ: Komşu Radarı & Haftalık Meydan Okuma */}
            <div className={styles.bentoCol}>
              <div className="reveal" style={{ transitionDelay: '150ms' }}>
                <KomsuRadar />
              </div>
              <div className="reveal" style={{ transitionDelay: '200ms' }}>
                <ChallengesWidget />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Feature Cards (Ekosistem) ─── */}
        <section className={`${styles.features} stagger-children`}>
          <div className={styles.bentoHeader}>
            <h2 className={styles.sectionTitle}>
              <span className="font-accent" style={{ color: 'var(--sunset-orange)', fontSize: '1.2em' }}>Neler Var?</span>
              <br />Karavan Ekosistemi
            </h2>
            <p className={styles.sectionSub}>Yolculuğunu kolaylaştıracak ve keyif katacak tüm araçlar</p>
          </div>

          <div className={styles.featureGrid}>
            <Link href="/kesfet" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(45, 90, 39, 0.15)' }}>
                <IconCamp size={28} color="var(--forest-green)" />
              </div>
              <h3>Sakin Köşeler</h3>
              <p>Güvenli ve huzurlu konaklama noktalarını filtreleyip haritada keşfet.</p>
            </Link>

            <Link href="/kesfet?category=Yol%20Yardımcısı" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(255, 140, 66, 0.15)' }}>
                <IconTool size={28} color="var(--sunset-orange)" />
              </div>
              <h3>Yol Yardımcıları</h3>
              <p>Güneş paneli, webasto, marangoz — karavanına özel uzman ustalar.</p>
            </Link>

            <Link href="/telsiz" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(135, 206, 235, 0.2)' }}>
                <IconRadio size={28} color="var(--sky-blue)" />
              </div>
              <h3>Telsiz & SOS</h3>
              <p>Yoldaki komşularınla anlık haberleş, acil durumda koordinat paylaş.</p>
            </Link>

            <Link href="/manzara" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(255, 140, 66, 0.15)' }}>
                <IconMap size={28} color="var(--sunset-orange)" />
              </div>
              <h3>Yol Manzarası & Rotalar</h3>
              <p>Fotoğraflarınla ilham ver, komşuların askıda bıraktığı notları oku.</p>
            </Link>

            <Link href="/pazaryeri" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(139, 69, 19, 0.15)' }}>
                <IconShop size={28} color="var(--earth-brown)" />
              </div>
              <h3>Pazaryeri</h3>
              <p>İkinci el karavan ekipmanlarını komşularınla güvenle al ve sat.</p>
            </Link>

            <Link href="/bakim" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(45, 90, 39, 0.15)' }}>
                <span style={{ fontSize: '1.6rem' }}>🔧</span>
              </div>
              <h3>Bakım Takvimi</h3>
              <p>Akü, yağ, tüp ve su tesisatı servis geçmişini dijital ortamda takip et.</p>
            </Link>

            <Link href="/kamp-atesi" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(255, 100, 50, 0.2)' }}>
                <span style={{ fontSize: '1.6rem' }}>🔥</span>
              </div>
              <h3>Kamp Ateşi</h3>
              <p>Her gece 20:00'da alevlenen ve gece yarısı sönen topluluk muhabbeti.</p>
            </Link>

            <Link href="/rehber" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(45, 90, 39, 0.15)' }}>
                <IconBook size={28} color="var(--forest-green)" />
              </div>
              <h3>Mevzuat Rehberi</h3>
              <p>Dönüşüm mevzuatı, TSE, B sınıfı ehliyet — bilmen gereken her kural.</p>
            </Link>
          </div>
        </section>

        {/* ─── Activity Feed (Canlı Topluluk Akışı) ─── */}
        <div className="reveal" style={{ transitionDelay: '150ms' }}>
          <ActivityFeed />
        </div>

      </div>
    </div>
  );
}
