'use client';

import { useState } from 'react';
import styles from './egzersiz.module.css';
import ExerciseVisual from '@/components/ExerciseVisual';
import GuidedWorkoutModal from '@/components/GuidedWorkoutModal';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import StatsDashboard from '@/components/StatsDashboard';
import { KARAVAN_EXERCISES, WORKOUT_ROUTINES, KaravanExercise } from '@/data/karavanExercises';

const CATEGORIES = [
  { id: 'all', label: 'Tüm Hareketler', icon: '✨' },
  { id: 'surus-sonrasi', label: '🧘 Sürüş & Bel Açma', icon: '🧘' },
  { id: 'bacak-kalca', label: '🦵 Bacak & Kalça', icon: '🦵' },
  { id: 'gogus-kol', label: '💪 Göğüs & Kol', icon: '💪' },
  { id: 'core-denge', label: '🔥 Core & Denge', icon: '🔥' },
  { id: 'sabah-esnemesi', label: '🌅 Sabah Güneşe Selam', icon: '🌅' },
];

export default function EgzersizPage() {
  const [activeTab, setActiveTab] = useState<'exercises' | 'stats'>('exercises');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRoutineTitle, setActiveRoutineTitle] = useState('Günün Kamp Hareketi');
  const [modalExercises, setModalExercises] = useState<KaravanExercise[]>([]);

  // Weekly Days (like openGym Screenshot 1)
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // 0: Mon ... 6: Sun
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((name, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIndex + i);
    return {
      name,
      dayNum: d.getDate(),
      isToday: i === currentDayIndex,
    };
  });

  // Filter Exercises
  const filteredExercises = KARAVAN_EXERCISES.filter(ex => {
    const matchesCat = selectedCategory === 'all' || ex.category === selectedCategory;
    const cleanQ = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanQ ||
      ex.name.toLowerCase().includes(cleanQ) ||
      ex.tagline.toLowerCase().includes(cleanQ) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(cleanQ)) ||
      ex.equipment.toLowerCase().includes(cleanQ);
    return matchesCat && matchesSearch;
  });

  const startRoutine = (routineId: string) => {
    const routine = WORKOUT_ROUTINES.find(r => r.id === routineId) || WORKOUT_ROUTINES[0];
    const list = routine.exerciseIds
      .map(id => KARAVAN_EXERCISES.find(e => e.id === id))
      .filter(Boolean) as KaravanExercise[];

    setActiveRoutineTitle(routine.title);
    setModalExercises(list.length > 0 ? list : [KARAVAN_EXERCISES[0]]);
    setIsModalOpen(true);
  };

  const startSingleExercise = (ex: KaravanExercise) => {
    setActiveRoutineTitle(`Odak: ${ex.name}`);
    setModalExercises([ex]);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* ─── Hero Header & Today's Highlight ─── */}
      <header className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <span>⚡</span> VanLife Fit
            </span>
            <span className={styles.streakPill}>
              🔥 12 Hafta Serisi
            </span>
          </div>

          <div className={styles.titleArea}>
            <h1 className={styles.mainTitle}>Karavan & Kamp Egzersizleri</h1>
            <p className={styles.mainDesc}>
              openGym standartlarında hareketli animasyonlar, geri sayım sayacı ve sürüş sonrası bel-sırt esnetme rehberi.
            </p>
          </div>

          {/* openGym Screenshot 1: Weekly Calendar Selector */}
          <div className={styles.weekCalendarCard}>
            <div className={styles.weekTitleRow}>
              <span>Bu Hafta</span>
              <span>Bugün: {weekDays[currentDayIndex].name} {weekDays[currentDayIndex].dayNum}</span>
            </div>

            <div className={styles.weekDaysGrid}>
              {weekDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`${styles.dayPill} ${d.isToday ? styles.activeDay : ''}`}
                >
                  <span className={styles.dayPillName}>{d.name}</span>
                  <span className={styles.dayPillNum}>{d.dayNum}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Recommended Routine Card */}
          <div className={styles.todayRoutineCard}>
            <div className={styles.routineInfo}>
              <span className={styles.routineLabel}>Günün Önerilen Kamp Rutini</span>
              <h2 className={styles.routineName}>🚐 Uzun Sürüş Sonrası Bel & Sırt Rahatlatma</h2>
              <p className={styles.routineSub}>
                Direksiyon kasılmalarını çözen 10 dakikalık omurga ve bacak açma seansı (4 Hareket).
              </p>
            </div>

            <button
              className={styles.startWorkoutBtn}
              onClick={() => startRoutine('surus-kurtarma')}
            >
              <span>▶</span> Seansa Başla
            </button>
          </div>
        </div>
      </header>

      {/* ─── Tabs: Exercises vs Stats (openGym) ─── */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'exercises' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <span>🏋️</span> Hareket Kütüphanesi & Rutinler
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'stats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <span>📊</span> İstatistikler & Heatmap
        </button>
      </nav>

      {/* ─── Main Content ─── */}
      <main className={styles.mainSection}>
        {activeTab === 'exercises' ? (
          <>
            {/* Filter Chips */}
            <div className={styles.filterChipsRow}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterChip} ${selectedCategory === cat.id ? styles.chipActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className={styles.searchBox}>
              <span style={{ fontSize: '1.1rem' }}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Hareket, kas grubu veya ekipman ara (örn: kobra, squat, basamak)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Exercises Grid with Moving Live Animations */}
            <div className={styles.exercisesGrid}>
              {filteredExercises.map(ex => (
                <div key={ex.id} className={styles.exerciseCard}>
                  {/* Moving Animated Demo Visual with Tap to Pause */}
                  <ExerciseVisual
                    animationType={ex.animationType}
                    exerciseName={ex.name}
                    targetMuscles={ex.targetMuscles}
                    interactive={true}
                  />

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{ex.name}</h3>
                    <p className={styles.cardTagline}>{ex.tagline}</p>

                    <div className={styles.cardTags}>
                      <span className={styles.miniTag}>🛠️ {ex.equipment}</span>
                      <span className={styles.miniTag}>🎯 {ex.targetMuscles[0]}</span>
                      <span className={styles.miniTag}>⏱️ {ex.durationSec}s</span>
                      <span className={styles.miniTag}>🔥 ~{ex.caloriesBurnEstimate} kcal</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {ex.setsDefault} Set · {ex.durationSec ? `${ex.durationSec} sn` : `${ex.repsDefault} tekrar`}
                    </span>
                    <button
                      className={styles.startSingleBtn}
                      onClick={() => startSingleExercise(ex)}
                    >
                      ▶ Çalış
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Stats & openGym Activity Heatmap */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <StatsDashboard />
            <ActivityHeatmap />
          </div>
        )}
      </main>

      {/* ─── Guided Workout Modal (openGym Guided Session) ─── */}
      <GuidedWorkoutModal
        isOpen={isModalOpen}
        routineTitle={activeRoutineTitle}
        exercises={modalExercises}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
