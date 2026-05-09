'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './OnboardingTour.module.css';

const STORAGE_KEY = 'karavan_tour_v1';

interface Step {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  desc: string;
  features?: string[];
}

const STEPS: Step[] = [
  {
    icon: '🏕️',
    color: 'linear-gradient(135deg, #1a3a14 0%, #2d5a27 60%, #3d7a35 100%)',
    title: 'Karavan Komşusu\'na\nHoş Geldin!',
    subtitle: 'Yolun Tadını Birlikte Çıkaralım',
    desc: 'Türkiye\'nin karavancılara özel platformu. Her şey burada — harita, topluluk, pazaryeri ve daha fazlası.',
  },
  {
    icon: '📸',
    color: 'linear-gradient(135deg, #4a1a0a 0%, #8b3a1a 60%, #c05820 100%)',
    title: 'Manzara',
    subtitle: 'Anılarını Paylaş',
    desc: 'Karavan hayatının en güzel karelerini paylaş. Instagram gönderilerini de doğrudan ekleyebilirsin.',
    features: ['📷 Fotoğraf ve video paylaşımı', '❤️ Beğeni ve yorumlar', '🌐 Instagram entegrasyonu'],
  },
  {
    icon: '🗺️',
    color: 'linear-gradient(135deg, #0a2a4a 0%, #1a4a7a 60%, #2060a0 100%)',
    title: 'Keşfet & Rota',
    subtitle: 'Türkiye\'yi Kaşıf',
    desc: 'Binlerce konaklama noktasını haritada keşfet, hava durumuna bak, rota çiz ve komşulara not bırak.',
    features: ['📍 Konaklama noktaları & ustalar', '⛅ Anlık hava durumu', '🧭 Rota planlayıcı', '📌 Toplu notlar'],
  },
  {
    icon: '📻',
    color: 'linear-gradient(135deg, #2a1a4a 0%, #4a2a8a 60%, #6040b0 100%)',
    title: 'Telsiz',
    subtitle: 'Toplulukla Bağlan',
    desc: 'Şehir, konu veya ilgi alanına göre kanallarda anlık sohbet et. Tüm karavancılar buluşuyor.',
    features: ['📡 Bölge kanalları', '💬 Anlık mesajlaşma', '🔔 Bildirimler'],
  },
  {
    icon: '🔥',
    color: 'linear-gradient(135deg, #4a1a00 0%, #8a3a00 60%, #c05000 100%)',
    title: 'Kamp Ateşi',
    subtitle: 'Sohbet ve Deneyim',
    desc: 'Soru sor, tavsiye al, deneyimlerini paylaş. Toplulukla ateş başında sohbet gibi.',
    features: ['💡 İpuçları & tavsiyeler', '🤝 Yardımlaşma', '⭐ XP kazan'],
  },
  {
    icon: '💬',
    color: 'linear-gradient(135deg, #003a2a 0%, #006a4a 60%, #008a60 100%)',
    title: 'Mesajlar',
    subtitle: 'Özel Sohbetler',
    desc: 'Arkadaşlarınla bire bir mesajlaş. Pazaryerinden sorduğun ürünün satıcısıyla da burada konuşabilirsin.',
    features: ['👥 Arkadaş listesi', '🟢 Çevrimiçi durumu', '⚡ Anlık iletişim'],
  },
  {
    icon: '📅',
    color: 'linear-gradient(135deg, #1a0a3a 0%, #3a1a7a 60%, #5a30a0 100%)',
    title: 'Etkinlikler',
    subtitle: 'Buluşmalara Katıl',
    desc: 'Karavan festivalleri, buluşmalar ve teknik atölyelere katıl. Yakınındaki etkinlikleri kaçırma.',
    features: ['🎉 Festival & buluşmalar', '📍 Konum bazlı', '✅ Katılım takibi'],
  },
  {
    icon: '🛒',
    color: 'linear-gradient(135deg, #2a1a00 0%, #5a3a00 60%, #8a5a00 100%)',
    title: 'Pazaryeri',
    subtitle: 'Al, Sat, Değiş Tokuş',
    desc: 'İkinci el karavan ekipmanı, aksesuar ve hizmet ilanları. Sahibinden.com tarzı detay sayfaları ile hızlı iletişim.',
    features: ['🔍 Kategori filtreleri', '💰 Fiyat bilgisi', '📨 Anında mesaj at'],
  },
  {
    icon: '🔧',
    color: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a5a 60%, #3a3a7a 100%)',
    title: 'Bakım & Ustalar',
    subtitle: 'Aracını Sağlıklı Tut',
    desc: 'Bakım geçmişini kaydet, uyarıları takip et. Yakınındaki uzman karavanustalarını bul.',
    features: ['📋 Bakım geçmişi', '⚠️ Servis uyarıları', '👨‍🔧 Usta bul'],
  },
  {
    icon: '🌟',
    color: 'linear-gradient(135deg, #1a3a14 0%, #2d5a27 50%, #c07820 100%)',
    title: 'Hazırsın!',
    subtitle: 'Topluluğa Katıl',
    desc: 'Her keşif, her paylaşım, her yardım XP kazandırır. Rozet kazan, sıralamada yüksel, yolun tadını çıkar!',
    features: ['⭐ XP & rozet sistemi', '🏆 Liderlik tablosu', '🗓️ Yıl özeti'],
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow external trigger via custom event
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setDirection('forward');
      setExiting(false);
      setVisible(true);
    };
    window.addEventListener('karavan:show-tour', handler);
    return () => window.removeEventListener('karavan:show-tour', handler);
  }, []);

  const close = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      localStorage.setItem(STORAGE_KEY, '1');
    }, 350);
  }, []);

  const goNext = useCallback(() => {
    if (step === STEPS.length - 1) { close(); return; }
    setDirection('forward');
    setStep(s => s + 1);
  }, [step, close]);

  const goBack = useCallback(() => {
    if (step === 0) return;
    setDirection('back');
    setStep(s => s - 1);
  }, [step]);

  // keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, goNext, goBack, close]);

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className={`${styles.overlay} ${exiting ? styles.overlayOut : ''}`}>
      <div className={`${styles.card} ${exiting ? styles.cardOut : ''}`}>
        {/* Skip button */}
        {!isLast && (
          <button className={styles.skipBtn} onClick={close}>Atla ✕</button>
        )}

        {/* Illustration area */}
        <div
          className={`${styles.hero} ${direction === 'forward' ? styles.slideIn : styles.slideInBack}`}
          key={step}
          style={{ background: current.color }}
        >
          <div className={styles.heroGlow} />
          <span className={styles.heroIcon}>{current.icon}</span>
          <div className={styles.heroSubtitle}>{current.subtitle}</div>
        </div>

        {/* Content */}
        <div
          className={`${styles.content} ${direction === 'forward' ? styles.slideIn : styles.slideInBack}`}
          key={`c-${step}`}
        >
          <h2 className={styles.title} style={{whiteSpace: 'pre-line'}}>{current.title}</h2>
          <p className={styles.desc}>{current.desc}</p>
          {current.features && (
            <ul className={styles.features}>
              {current.features.map(f => (
                <li key={f} className={styles.featureItem}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: dots + nav */}
        <div className={styles.footer}>
          {/* Progress */}
          <div className={styles.dots}>
            <span className={styles.stepCounter}>{step + 1} / {STEPS.length}</span>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className={styles.navBtns}>
            {!isFirst && (
              <button className={styles.backNavBtn} onClick={goBack}>← Geri</button>
            )}
            <button className={styles.nextBtn} onClick={goNext}>
              {isLast ? '🚀 Başla!' : 'İleri →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
