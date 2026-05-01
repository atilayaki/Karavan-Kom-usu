'use client';

import { useState } from 'react';
import styles from './CostCalculator.module.css';

export default function CostCalculator() {
  const [km, setKm] = useState<number>(0);
  const [consumption, setConsumption] = useState<number>(10); // L/100km
  const [fuelPrice, setFuelPrice] = useState<number>(45); // TL
  const [nights, setNights] = useState<number>(0);
  const [campFee, setCampFee] = useState<number>(0);
  const [dailyFood, setDailyFood] = useState<number>(500);

  const fuelCost = (km / 100) * consumption * fuelPrice;
  const campCost = nights * campFee;
  const foodCost = (nights || 1) * dailyFood;
  const total = fuelCost + campCost + foodCost;

  return (
    <div className={styles.calcContainer + " glass-card"}>
      <div className={styles.header}>
        <span style={{fontSize: '2rem'}}>📊</span>
        <div>
          <h3>Yol Maliyeti Hesaplayıcı</h3>
          <p>Rotanın sana ne kadara mal olacağını planla.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.inputGroup}>
          <label>Mesafe (KM)</label>
          <input type="number" value={km} onChange={(e) => setKm(Number(e.target.value))} />
        </div>
        <div className={styles.inputGroup}>
          <label>Yakıt Tüketimi (L/100km)</label>
          <input type="number" value={consumption} onChange={(e) => setConsumption(Number(e.target.value))} />
        </div>
        <div className={styles.inputGroup}>
          <label>Yakıt Fiyatı (TL)</label>
          <input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} />
        </div>
        <div className={styles.inputGroup}>
          <label>Konaklama (Gece)</label>
          <input type="number" value={nights} onChange={(e) => setNights(Number(e.target.value))} />
        </div>
        <div className={styles.inputGroup}>
          <label>Kamp Ücreti (TL/Gece)</label>
          <input type="number" value={campFee} onChange={(e) => setCampFee(Number(e.target.value))} />
        </div>
        <div className={styles.inputGroup}>
          <label>Günlük Harcama (Gıda vb.)</label>
          <input type="number" value={dailyFood} onChange={(e) => setDailyFood(Number(e.target.value))} />
        </div>
      </div>

      <div className={styles.result}>
        <div className={styles.resItem}>
          <span>Yakıt:</span>
          <strong>{fuelCost.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className={styles.resItem}>
          <span>Konaklama:</span>
          <strong>{campCost.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className={styles.resItem}>
          <span>Gıda/Ekstra:</span>
          <strong>{foodCost.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className={styles.total}>
          <span>Tahmini Toplam:</span>
          <strong>{total.toLocaleString('tr-TR')} ₺</strong>
        </div>
      </div>
    </div>
  );
}
