'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ActivityHeatmap.module.css';

interface WorkoutRecord {
  id: string;
  routineTitle: string;
  date: string;
  durationMinutes: number;
  exerciseCount: number;
  calories: number;
}

export default function ActivityHeatmap() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; minutes: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadWorkouts = () => {
    try {
      const stored = localStorage.getItem('karavan_fit_workouts');
      if (stored) {
        setWorkouts(JSON.parse(stored));
      } else {
        // Generate realistic sample activity if brand new
        const sampleWorkouts: WorkoutRecord[] = [
          { id: 'w1', routineTitle: 'Sabah Uyanış Rutini', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), durationMinutes: 12, exerciseCount: 3, calories: 45 },
          { id: 'w2', routineTitle: 'Sürüş Sonrası Bel Açma', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), durationMinutes: 15, exerciseCount: 4, calories: 60 },
          { id: 'w3', routineTitle: 'Kamp Yeri Kuvvet', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), durationMinutes: 20, exerciseCount: 5, calories: 90 },
          { id: 'w4', routineTitle: 'Güneşe Selam', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), durationMinutes: 10, exerciseCount: 3, calories: 35 },
          { id: 'w5', routineTitle: 'Basamak Kardiyo', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), durationMinutes: 18, exerciseCount: 4, calories: 80 },
          { id: 'w6', routineTitle: 'Sürüş Kurtarma', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), durationMinutes: 14, exerciseCount: 4, calories: 55 },
        ];
        localStorage.setItem('karavan_fit_workouts', JSON.stringify(sampleWorkouts));
        setWorkouts(sampleWorkouts);
      }
    } catch {
      // Ignore localStorage failure
    }
  };

  useEffect(() => {
    loadWorkouts();

    const handleUpdate = () => loadWorkouts();
    window.addEventListener('karavan:workout-completed', handleUpdate);
    return () => window.removeEventListener('karavan:workout-completed', handleUpdate);
  }, []);

  // Scroll to the latest dates automatically (right side)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [workouts]);

  // Map dates to workout count and minutes
  const dateMap: { [isoDate: string]: { count: number; minutes: number } } = {};
  workouts.forEach(w => {
    const day = w.date.split('T')[0];
    if (!dateMap[day]) {
      dateMap[day] = { count: 0, minutes: 0 };
    }
    dateMap[day].count += 1;
    dateMap[day].minutes += w.durationMinutes || 15;
  });

  // Calculate Streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    if (dateMap[iso] && dateMap[iso].count > 0) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }

  // Generate 20 weeks calendar grid (140 days)
  const WEEKS_COUNT = 24;
  const todayISO = today.toISOString().split('T')[0];

  const columns: { date: string; count: number; minutes: number; isToday: boolean }[][] = [];
  
  // Calculate start day: Monday of (WEEKS_COUNT weeks ago)
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 is Monday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (WEEKS_COUNT * 7 - 1) - currentDayOfWeek);

  for (let w = 0; w < WEEKS_COUNT; w++) {
    const col: { date: string; count: number; minutes: number; isToday: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);
      const iso = cellDate.toISOString().split('T')[0];
      const data = dateMap[iso] || { count: 0, minutes: 0 };
      col.push({
        date: iso,
        count: data.count,
        minutes: data.minutes,
        isToday: iso === todayISO,
      });
    }
    columns.push(col);
  }

  const getLevelClass = (count: number, minutes: number) => {
    if (count === 0) return styles.l0;
    if (minutes < 15) return styles.l1;
    if (minutes < 25) return styles.l2;
    if (minutes < 40) return styles.l3;
    return styles.l4;
  };

  return (
    <div className={styles.heatmapContainer}>
      <div className={styles.heatmapHeader}>
        <div className={styles.titleArea}>
          <h4 className={styles.title}>
            <span>📊</span> Aktivite & Kamp Hareket Haritası
          </h4>
          <p className={styles.subtitle}>Son 6 aydaki düzenli hareket ve esneme günlerin</p>
        </div>

        <div className={styles.streakBadge}>
          <span>🔥</span>
          <span>{streak > 0 ? `${streak} Gün Seri` : 'Seri Başlat'}</span>
        </div>
      </div>

      <div className={styles.scrollWrapper} ref={scrollRef}>
        <div className={styles.gridContainer}>
          {/* Day of week labels */}
          <div className={styles.dayLabels}>
            <span>Pzt</span>
            <span>Çar</span>
            <span>Cum</span>
            <span>Paz</span>
          </div>

          {/* 7-row columns */}
          <div className={styles.columnsWrap}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} className={styles.column}>
                {col.map((cell) => {
                  const levelCls = getLevelClass(cell.count, cell.minutes);
                  const isHovered = hoveredCell?.date === cell.date;

                  return (
                    <div
                      key={cell.date}
                      className={`${styles.cell} ${levelCls} ${cell.isToday ? styles.todayCell : ''}`}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${cell.date}: ${cell.count ? `${cell.count} seans · ${cell.minutes} dk` : 'Aktivite yok'}`}
                    >
                      {isHovered && (
                        <div className={styles.tooltip}>
                          <strong>{cell.date}</strong>
                          <br />
                          {cell.count > 0 ? `${cell.count} seans · ${cell.minutes} dk` : 'Dinlenme Günü'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.legendRow}>
        <span>Daha az</span>
        <div className={styles.legendCells}>
          <div className={`${styles.cell} ${styles.l0}`} />
          <div className={`${styles.cell} ${styles.l1}`} />
          <div className={`${styles.cell} ${styles.l2}`} />
          <div className={`${styles.cell} ${styles.l3}`} />
          <div className={`${styles.cell} ${styles.l4}`} />
        </div>
        <span>Daha çok</span>
      </div>
    </div>
  );
}
