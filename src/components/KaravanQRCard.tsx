'use client';

import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/lib/database.types';
import styles from './KaravanQRCard.module.css';

export default function KaravanQRCard({
  profile,
  userId,
  onClose,
}: {
  profile: Profile;
  userId: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(`${window.location.origin}/profil/${userId}`);
    }
  }, [userId]);

  const qrSrc = profileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=2D5A27&bgcolor=FDF5E6&qzone=2&data=${encodeURIComponent(profileUrl)}`
    : '';

  const handlePrint = () => window.print();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal + ' glass-card'} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🚐 Karavan Kartın</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <p className={styles.desc}>
          Bu kartı yazdır, ön cama yapıştır. Yolda karşılaştığın komşular telefonla okutup profilini görsün.
        </p>

        <div className={styles.cardWrapper}>
          <div className={styles.card} ref={cardRef}>
            <div className={styles.cardLeft}>
              <span className={styles.brandTag}>KARAVAN KOMŞUSU</span>
              <h2 className={styles.cardName}>{profile.full_name || 'Karavancı'}</h2>
              {profile.username && <div className={styles.cardHandle}>@{profile.username}</div>}
              {profile.caravan_type && (
                <div className={styles.cardType}>
                  <span>🚐</span> {profile.caravan_type}
                </div>
              )}
              {profile.bio && (
                <p className={styles.cardBio}>{profile.bio.substring(0, 70)}{profile.bio.length > 70 ? '…' : ''}</p>
              )}
              <div className={styles.cardFooter}>
                karavan-komsusu.app
              </div>
            </div>
            <div className={styles.cardRight}>
              {qrSrc && <img src={qrSrc} alt="QR kod" />}
              <span className={styles.qrLabel}>Tara → Profil</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className="btn-primary" onClick={handlePrint}>🖨️ Yazdır</button>
          <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(profileUrl).then(() => alert('Link kopyalandı'))}>
            🔗 Linki Kopyala
          </button>
        </div>
      </div>
    </div>
  );
}
