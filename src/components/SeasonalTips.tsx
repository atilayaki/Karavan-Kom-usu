'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './SeasonalTips.module.css';

export default function SeasonalTips() {
  const [tips, setTips] = useState<any[]>([]);
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    const fetchTips = async () => {
      const { data } = await supabase
        .from('seasonal_tips')
        .select('*')
        .eq('month', currentMonth);
      if (data) setTips(data);
    };
    fetchTips();
  }, [currentMonth]);

  if (tips.length === 0) return null;

  const monthNames = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h3>🌿 {monthNames[currentMonth]} Ayı Yol Rehberi</h3>
        <p>Bu ay yolda dikkat etmen gerekenler ve özel rota önerileri.</p>
      </div>
      <div className={styles.tipsGrid}>
        {tips.map(tip => (
          <div key={tip.id} className={styles.tipCard + " glass-card"}>
            <span className={styles.category}>{tip.category}</span>
            <h4>{tip.title}</h4>
            <p>{tip.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
