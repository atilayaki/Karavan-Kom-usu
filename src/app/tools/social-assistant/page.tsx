'use client';

import React, { useState } from 'react';
import styles from './social-assistant.module.css';

const platforms = [
  { id: 'twitter', name: 'Twitter (X)', url: 'https://x.com', icon: '🐦' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', icon: '🎵' },
  { id: 'custom', name: 'Özel URL', url: '', icon: '🔗' },
];

export default function SocialAssistantPage() {
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [message, setMessage] = useState('Harika paylaşım! 🔥');
  const [isLaunching, setIsLaunching] = useState(false);
  const [status, setStatus] = useState('Hazır');

  const handleLaunch = async () => {
    setIsLaunching(true);
    setStatus('Başlatılıyor...');
    
    const targetUrl = selectedPlatform.id === 'custom' ? customUrl : selectedPlatform.url;

    try {
      const res = await fetch('/api/social-assistant/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, message }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('Aktif');
      } else {
        setStatus('Hata: ' + data.error);
      }
    } catch (err) {
      setStatus('Bağlantı Hatası');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Command Center</h1>
          <p>Sosyal medya asistanınızı buradan yönetin.</p>
        </header>

        <div className={styles.grid}>
          <div className={styles.card}>
            <label className={styles.label}>Platform Seçimi</label>
            <div className={styles.platformSelector}>
              {platforms.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.platformBtn} ${selectedPlatform.id === p.id ? styles.active : ''}`}
                  onClick={() => setSelectedPlatform(p)}
                >
                  <span style={{ fontSize: '1.5rem' }}>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {selectedPlatform.id === 'custom' && (
              <>
                <label className={styles.label}>Hedef URL</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="https://example.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </>
            )}

            <label className={styles.label}>Otomatik Mesaj</label>
            <textarea
              className={`${styles.inputField} ${styles.textarea}`}
              placeholder="Yazılacak mesajı girin..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button 
              className={styles.launchBtn} 
              onClick={handleLaunch}
              disabled={isLaunching}
            >
              {isLaunching ? '🚀 Uzaya Gönderiliyor...' : '🚀 Asistanı Başlat'}
            </button>
          </div>

          <div className={`${styles.card} ${styles.statusCard}`}>
            <label className={styles.label}>Sistem Durumu</label>
            
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Durum</span>
              <span className={styles.statusValue}>
                <span className={styles.pulse}></span>
                {status}
              </span>
            </div>

            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Seçili Platform</span>
              <span className={styles.statusValue}>{selectedPlatform.name}</span>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
              <strong>Kullanım Kılavuzu:</strong><br />
              1. Platformu ve mesajı seçin.<br />
              2. Başlat'a basın, yeni bir tarayıcı açılacaktır.<br />
              3. Tarayıcıda yazı yazmak istediğiniz alana tıklamanız yeterlidir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
