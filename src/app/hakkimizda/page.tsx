import styles from './hakkimizda.module.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hakkımızda | Karavan Komşusu',
  description: 'Türkiye\'nin karavancılara özel sosyal platformu. Misyonumuz, özellikleri ve topluluğumuz hakkında her şey.',
};

const FEATURES = [
  {
    icon: '📸',
    title: 'Manzara',
    desc: 'Yolda yakaladığın anları paylaş. Polaroid filtreler, hashtag keşfi ve gerçek zamanlı etkileşimlerle fotoğrafların hayat bulsun.',
    href: '/manzara',
  },
  {
    icon: '🗺️',
    title: 'Keşfet & Rota',
    desc: 'Binlerce karavancının rotasına bak, kendi güzergahını oluştur, gizli kalmış konaklamayı keşfet.',
    href: '/kesfet',
  },
  {
    icon: '📻',
    title: 'Telsiz',
    desc: 'Deneyimlerini, sorularını, önerilerini topluluğunla paylaş. Karavancılar arası en samimi sohbet kanalı.',
    href: '/telsiz',
  },
  {
    icon: '🔥',
    title: 'Kamp Ateşi',
    desc: 'Günün yorgunluğunu kamp ateşinin etrafında at. Hikayeler, anılar ve tavsiyeler bir arada.',
    href: '/kamp-atesi',
  },
  {
    icon: '💬',
    title: 'Mesajlar',
    desc: 'Komşunla doğrudan iletişim kur. İlan sahibiyle, tur arkadaşınla ya da yeni tanıştığın karavancıyla.',
    href: '/mesajlar',
  },
  {
    icon: '📅',
    title: 'Etkinlikler',
    desc: 'Bölgenize yakın buluşmaları gör, kendi etkinliğini organize et, karavan festivallerine katıl.',
    href: '/etkinlikler',
  },
  {
    icon: '🛒',
    title: 'Pazaryeri',
    desc: 'Fazla ekipmanını sat, ihtiyacını uygun fiyata bul. Karavancılar arası güvenli, çoklu fotoğraflı ilan sistemi.',
    href: '/pazaryeri',
  },
  {
    icon: '🔧',
    title: 'Bakım & Servis',
    desc: 'Karavanına bakan ustaları bul, bakım takvimine ulaş, teknik rehberlere göz at.',
    href: '/bakim',
  },
  {
    icon: '🏕️',
    title: 'Yıl Özeti',
    desc: 'Yılın kaç km yol yaptın? Kaç konaklamayı deneyimledin? Yolculuğunu rakamlarla gör.',
    href: '/wrapped',
  },
];

const VALUES = [
  { icon: '🤝', title: 'Topluluk Önce', desc: 'Her özellik, karavancıların birbirini bulması ve desteklemesi için tasarlandı.' },
  { icon: '🛡️', title: 'Güvenli Alan', desc: 'Doğrulanmış profiller, şeffaf iletişim ve topluluk denetimi ile güvenli bir ortam.' },
  { icon: '🌿', title: 'Yolun Ruhu', desc: 'Hız değil derinlik. Gösteriş değil gerçeklik. Yolculuğun özü burada.' },
  { icon: '📱', title: 'Her Yerde', desc: 'PWA desteğiyle telefonuna yükle, çevrimdışı bile çalış. İnternet olmayan yerlerde de yanında.' },
];

export default function HakkimizdaPage() {
  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Türkiye'nin Karavancı Platformu</span>
          <h1 className={styles.heroTitle}>
            Yolun Tadını<br />
            <span className={styles.gradient}>Birlikte</span> Çıkaralım
          </h1>
          <p className={styles.heroSub}>
            Karavan Komşusu; rotaları, manzaraları, pazarı ve topluluğu tek çatı altında
            birleştiren — yolda olmanın anlam kazandığı sosyal platformdur.
          </p>
          <div className={styles.heroCta}>
            <Link href="/gunluk" className="btn-primary">Hemen Başla</Link>
            <Link href="/kesfet" className="btn-ghost">Rotaları Keşfet</Link>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className={styles.mission}>
        <div className={styles.missionInner + ' glass-card'}>
          <div className={styles.missionIcon}>🧭</div>
          <h2>Misyonumuz</h2>
          <p>
            Karavancılık bir yaşam biçimidir. Özgürlüğün, maceranın ve doğayla bağ kurmanın
            en saf halidir. Ama bu yolculuk yalnız çıkılması gerekmiyor.
          </p>
          <p>
            Karavan Komşusu olarak amacımız; Türkiye'nin dört bir yanına yayılmış karavancıları
            bir araya getirmek, deneyimlerini paylaşmalarına ortam hazırlamak, birbirlerine
            rehber olmalarını sağlamak ve her seyahati daha güvenli, daha anlamlı kılmaktır.
          </p>
          <p className={styles.missionHighlight}>
            "İyi bir yol, paylaşıldığında ikiye katlanır."
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionLabel}>Ne Sunuyoruz</div>
        <h2 className={styles.sectionTitle}>Her İhtiyacın Tek Platformda</h2>
        <div className={styles.featuresGrid}>
          {FEATURES.map(f => (
            <Link key={f.href} href={f.href} className={styles.featureCard + ' glass-card'}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className={styles.featureArrow}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Gamification callout ── */}
      <section className={styles.gameBanner + ' glass-card'}>
        <div className={styles.gameBannerContent}>
          <div className={styles.gameBannerText}>
            <h2>Yolculuğun Seni Ödüllendiriyor</h2>
            <p>
              Her paylaşım, her giriş, her rozet seni bir adım ileriye taşır.
              XP kazan, seviyeleri geç, şehir rozetleri topla ve liderlik tablosunda
              yerini al. Karavancılık artık hem macera hem oyun.
            </p>
          </div>
          <div className={styles.gameBadges}>
            <div className={styles.gameBadge}>🏆</div>
            <div className={styles.gameBadge}>🗺️</div>
            <div className={styles.gameBadge}>📸</div>
            <div className={styles.gameBadge}>⭐</div>
            <div className={styles.gameBadge}>🌄</div>
            <div className={styles.gameBadge}>🔥</div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className={styles.valuesSection}>
        <div className={styles.sectionLabel}>Değerlerimiz</div>
        <h2 className={styles.sectionTitle}>Neden Karavan Komşusu?</h2>
        <div className={styles.valuesGrid}>
          {VALUES.map(v => (
            <div key={v.title} className={styles.valueCard + ' glass-card'}>
              <div className={styles.valueIcon}>{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} aria-hidden />
        <div className={styles.ctaInner + ' glass-card'}>
          <h2>Yola Çık. Toplulukla Buluş.</h2>
          <p>
            Binlerce karavancı seni bekliyor. Ücretsiz hesap oluştur,
            profilini kur ve Türkiye'nin en büyük karavancı ailesine katıl.
          </p>
          <Link href="/gunluk" className="btn-primary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
            Karavan Komşusu'na Katıl
          </Link>
        </div>
      </section>

    </div>
  );
}
