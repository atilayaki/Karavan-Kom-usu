'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './OnboardingModal.module.css';

const CARAVAN_TYPES = ['Tam Dönüşüm', 'Yarı Dönüşüm', 'Fabrika Karavan', 'Kamper', 'Çadır + Araba', 'Diğer'];
const INTERESTS = ['Doğa & Kamp', 'Tarihi Yerler', 'Deniz & Kıyı', 'Dağ & Yayla', 'Şehir Kaçışları', 'Uzun Rotalar', 'Teknik & Tadilat', 'Topluluk Etkinlikleri'];

interface Props {
  userId: string;
  onDone: () => void;
}

export default function OnboardingModal({ userId, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [caravanType, setCaravanType] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleInterest(interest: string) {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  }

  async function finish() {
    setSaving(true);
    await supabase.from('profiles').update({
      caravan_type: caravanType || null,
      bio: bio.trim() || (selectedInterests.length ? `Sevdiğim şeyler: ${selectedInterests.join(', ')}` : null),
    }).eq('id', userId);
    setSaving(false);
    onDone();
  }

  const steps = [
    {
      emoji: '🚐',
      title: 'Karavanın nasıl?',
      sub: 'Hangi tip karavan kullanıyorsun?',
      content: (
        <div className={styles.grid}>
          {CARAVAN_TYPES.map(t => (
            <button
              key={t}
              className={`${styles.optBtn} ${caravanType === t ? styles.optSelected : ''}`}
              onClick={() => setCaravanType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      ),
      canSkip: true,
    },
    {
      emoji: '🗺️',
      title: 'Ne seversin?',
      sub: 'İlgi alanlarını seç (birden fazla olabilir)',
      content: (
        <div className={styles.grid}>
          {INTERESTS.map(i => (
            <button
              key={i}
              className={`${styles.optBtn} ${selectedInterests.includes(i) ? styles.optSelected : ''}`}
              onClick={() => toggleInterest(i)}
            >
              {i}
            </button>
          ))}
        </div>
      ),
      canSkip: true,
    },
    {
      emoji: '✍️',
      title: 'Kendini tanıt',
      sub: 'Profilinde görünecek kısa bir bio yaz (isteğe bağlı)',
      content: (
        <textarea
          className={styles.bioInput}
          placeholder="Örn: 5 yıldır yolda, deniz kenarı mola yerleri arıyorum..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={200}
          rows={4}
        />
      ),
      canSkip: true,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal + ' glass-card'}>
        {/* Progress dots */}
        <div className={styles.dots}>
          {steps.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i <= step ? styles.dotActive : ''}`} />
          ))}
        </div>

        <div className={styles.emoji}>{current.emoji}</div>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.sub}>{current.sub}</p>

        <div className={styles.content}>{current.content}</div>

        <div className={styles.actions}>
          {current.canSkip && (
            <button className={styles.skipBtn} onClick={() => isLast ? finish() : setStep(s => s + 1)}>
              Atla
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : isLast ? '🎉 Başlayalım!' : 'Devam Et →'}
          </button>
        </div>
      </div>
    </div>
  );
}
