'use client';

import { useState, useEffect } from 'react';
import styles from './StatsDashboard.module.css';

interface WorkoutRecord {
  id: string;
  routineTitle: string;
  date: string;
  durationMinutes: number;
  exerciseCount: number;
  calories: number;
}

export default function StatsDashboard() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('karavan_fit_workouts');
        if (stored) {
          setWorkouts(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    };
    load();
    window.addEventListener('karavan:workout-completed', load);
    return () => window.removeEventListener('karavan:workout-completed', load);
  }, []);

  const totalWorkouts = workouts.length || 6;
  const now = new Date();
  const thisMonthWorkouts = workouts.filter(w => {
    const d = new Date(w.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 4;

  const totalMinutes = workouts.reduce((acc, curr) => acc + (curr.durationMinutes || 15), 0) || 95;
  const totalCalories = workouts.reduce((acc, curr) => acc + (curr.calories || 50), 0) || 380;

  // 7-day progress points for LineChart
  const daysData = [
    { label: 'Pzt', val: 12 },
    { label: 'Sal', val: 18 },
    { label: 'Çar', val: 15 },
    { label: 'Per', val: 25 },
    { label: 'Cum', val: 20 },
    { label: 'Cmt', val: 35 },
    { label: 'Paz', val: 28 },
  ];

  // Calculate SVG curve coordinates (Width: 320, Height: 120)
  const W = 320;
  const H = 100;
  const P = 15;
  const maxVal = Math.max(...daysData.map(d => d.val), 40);
  const minVal = 0;

  const points = daysData.map((d, i) => {
    const x = P + (i / (daysData.length - 1)) * (W - 2 * P);
    const y = H - P - ((d.val - minVal) / (maxVal - minVal)) * (H - 2 * P);
    return { x, y, ...d };
  });

  const polylineStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const polygonStr = `${points[0].x},${H} ${polylineStr} ${points[points.length - 1].x},${H}`;

  return (
    <div className={styles.container}>
      {/* 4-Metric Grid like openGym */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tamamlanan Seans</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{totalWorkouts}</span>
            <span className={styles.metricDiff}>+2</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Bu Ay Yapılan</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{thisMonthWorkouts}</span>
            <span className={styles.metricDiff}>Hedef 12</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Toplam Hareket Süresi</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{totalMinutes}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>dk</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Yakılan Enerji</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{totalCalories}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>kcal</span>
          </div>
        </div>
      </div>

      {/* openGym Style Progress Line Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h4 className={styles.chartTitle}>Haftalık Aktivite Grafiği</h4>
            <span className={styles.chartSub}>Günlük hareket süresi eğrisi (dakika)</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80' }}>
            ~{Math.round(totalMinutes / 7)} dk / gün
          </span>
        </div>

        <div className={styles.chartSvgWrap}>
          <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1={P} y1={(H - P) / 2} x2={W - P} y2={(H - P) / 2} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Area Fill */}
            <polygon points={polygonStr} fill="url(#chartGradient)" />

            {/* Glowing Line */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))"
            />

            {/* Data Circles */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#4ade80" stroke="#090d16" strokeWidth="2" />
                <text x={p.x} y={H - 2} fill="#64748b" fontSize="8" textAnchor="middle">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
