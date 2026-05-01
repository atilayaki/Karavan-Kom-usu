'use client';

import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import Link from "next/link";
import { useScrollReveal } from '@/hooks/useScrollReveal';
import WeatherWidget from '@/components/WeatherWidget';
import SeasonalTips from '@/components/SeasonalTips';
import ActivityFeed from '@/components/ActivityFeed';
import { IconTool, IconCamp, IconRadio, IconShop, IconBook, IconMap, IconCalendar, IconTrophy, IconCaravan } from '@/components/Icons';

const HERO_IMAGES = [
  '/hero-bg.png',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2000&auto=format&fit=crop'
];

const STATS = [
  { label: 'Karavancı', value: '2.4K+', icon: '🚐' },
  { label: 'Konaklama Noktası', value: '850+', icon: '📍' },
  { label: 'Uzman Usta', value: '120+', icon: '🔧' },
  { label: 'Günlük Mesaj', value: '5K+', icon: '💬' },
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useScrollReveal();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
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
              <IconCaravan size={18} /> Aramıza Katıl
            </Link>
          </div>
        </div>

        {/* Slider Dots */}
        <div className={styles.sliderDots}>
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Görsel ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel}></div>
          </div>
          <span>Keşfet</span>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className={`${styles.statsBar} reveal`}>
        {STATS.map((stat, i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </section>

      <div className={styles.contentArea}>
        {/* ─── Weather Widget ─── */}
        <div className="reveal">
          <WeatherWidget />
        </div>

        {/* ─── Seasonal Tips ─── */}
        <div className="reveal" style={{ transitionDelay: '100ms' }}>
          <SeasonalTips />
        </div>

        {/* ─── Feature Cards ─── */}
        <section className={`${styles.features} stagger-children`}>
          <h2 className={styles.sectionTitle}>
            <span className="font-accent" style={{ color: 'var(--sunset-orange)', fontSize: '1.2em' }}>Neler Var?</span>
            <br />Tüm Özellikler
          </h2>

          <div className={styles.featureGrid}>
            <Link href="/kesfet" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(45, 90, 39, 0.1)' }}>
                <IconTool size={28} color="var(--forest-green)" />
              </div>
              <h3>Yol Yardımcıları</h3>
              <p>Güneş paneli, webasto, marangoz — karavanına özel uzman ustalar.</p>
            </Link>

            <Link href="/kesfet" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(255, 140, 66, 0.1)' }}>
                <IconCamp size={28} color="var(--sunset-orange)" />
              </div>
              <h3>Sakin Köşeler</h3>
              <p>Güvenli ve huzurlu konaklama noktalarını haritada keşfet.</p>
            </Link>

            <Link href="/telsiz" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(135, 206, 235, 0.15)' }}>
                <IconRadio size={28} color="var(--sky-blue)" />
              </div>
              <h3>Telsiz</h3>
              <p>Yoldaki komşularınla anlık haberleş, acil durumda SOS gönder.</p>
            </Link>

            <Link href="/pazaryeri" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(139, 69, 19, 0.1)' }}>
                <IconShop size={28} color="var(--earth-brown)" />
              </div>
              <h3>Pazaryeri</h3>
              <p>İkinci el karavan ekipmanlarını güvenle al ve sat.</p>
            </Link>

            <Link href="/rehber" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(45, 90, 39, 0.1)' }}>
                <IconBook size={28} color="var(--forest-green)" />
              </div>
              <h3>Rehber</h3>
              <p>Dönüşüm mevzuatı, TSE, ruhsat — bilmen gereken her şey.</p>
            </Link>

            <Link href="/manzara" className={`${styles.featureCard} glass-card`}>
              <div className={styles.featureIconWrap} style={{ background: 'rgba(255, 140, 66, 0.1)' }}>
                <IconMap size={28} color="var(--sunset-orange)" />
              </div>
              <h3>Yol Manzarası</h3>
              <p>Fotoğraflarınla ilham ver, rotanı ve anılarını paylaş.</p>
            </Link>
          </div>
        </section>

        {/* ─── Activity Feed ─── */}
        <div className="reveal" style={{ transitionDelay: '200ms' }}>
          <ActivityFeed />
        </div>

        {/* ─── CTA Banner ─── */}
        <section className={`${styles.ctaBanner} glass-card reveal`}>
          <div className={styles.ctaBannerContent}>
            <span className="font-accent" style={{ fontSize: '1.5rem', color: 'var(--sunset-orange)' }}>Hadi başlayalım!</span>
            <h2>Karavancılar Seni Bekliyor</h2>
            <p>Türkiye&apos;nin dört bir yanında binlerce komşun var. Kayıt ol, profilini oluştur ve yolculuğa başla.</p>
            <Link href="/gunluk" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
              Hemen Ücretsiz Katıl
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
