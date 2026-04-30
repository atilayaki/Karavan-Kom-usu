import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Yolun Tadını <br /><span>Birlikte Çıkaralım</span></h1>
          <p className={styles.subtitle}>
            Türkiye'nin en samimi karavan topluluğuna hoş geldin. <br />
            En yakın ustayı bul, gizli durakları keşfet, telsizle komşularına selam ver.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/kesfet" className="btn-primary">Keşfetmeye Başla</Link>
            <Link href="/gunluk" className="btn-secondary">Aramıza Katıl</Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard + " glass-card"}>
          <span className={styles.icon}>🛠️</span>
          <h3>Yol Yardımcıları</h3>
          <p>Karavanına özel uzman ustalar bir tık uzağında.</p>
        </div>
        <div className={styles.featureCard + " glass-card"}>
          <span className={styles.icon}>🏕️</span>
          <h3>Sakin Köşeler</h3>
          <p>Güvenli ve huzurlu konaklama noktalarını keşfet.</p>
        </div>
        <div className={styles.featureCard + " glass-card"}>
          <span className={styles.icon}>📻</span>
          <h3>Telsiz</h3>
          <p>Yoldaki diğer komşularınla anlık haberleş.</p>
        </div>
      </section>
    </div>
  );
}
