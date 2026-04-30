import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <img src="/logo.png" alt="Karavan Komşusu Logo" className={styles.logoImage} />
          <span className={styles.logoText}>Karavan Komşusu</span>
        </Link>
        <div className={styles.links}>
          <Link href="/kesfet">Keşfet</Link>
          <Link href="/manzara">Manzara</Link>
          <Link href="/telsiz">Telsiz</Link>
          <Link href="/pazaryeri">Pazaryeri</Link>
          <Link href="/rehber">Rehber</Link>
          <Link href="/gunluk" className={styles.profileBtn}>Günlüğüm</Link>
        </div>
      </div>
    </nav>
  );
}
