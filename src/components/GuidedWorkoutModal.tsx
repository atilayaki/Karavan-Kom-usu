'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './GuidedWorkoutModal.module.css';
import ExerciseVisual from './ExerciseVisual';
import { KaravanExercise } from '@/data/karavanExercises';

interface GuidedWorkoutModalProps {
  routineTitle: string;
  exercises: KaravanExercise[];
  isOpen: boolean;
  onClose: () => void;
  onFinished?: () => void;
}

export default function GuidedWorkoutModal({
  routineTitle,
  exercises,
  isOpen,
  onClose,
  onFinished,
}: GuidedWorkoutModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<{ [exerciseId: string]: boolean[] }>({});
  
  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [initialTimer, setInitialTimer] = useState(45);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStartTime] = useState<number>(() => Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = exercises[currentIndex];

  // Initialize completedSets when modal opens or exercises change
  useEffect(() => {
    if (isOpen && exercises.length > 0) {
      setCurrentIndex(0);
      setIsFinished(false);
      const initial: { [key: string]: boolean[] } = {};
      exercises.forEach(ex => {
        initial[ex.id] = Array(ex.setsDefault).fill(false);
      });
      setCompletedSets(initial);
      setTimerSeconds(exercises[0].durationSec || 45);
      setInitialTimer(exercises[0].durationSec || 45);
      setIsTimerRunning(false);
    }
  }, [isOpen, exercises]);

  // Audio tone generator on timer finish
  const playTimerTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext not allowed or unsupported
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      playTimerTone();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen || !currentExercise) return null;

  const currentSets = completedSets[currentExercise.id] || Array(currentExercise.setsDefault).fill(false);

  const toggleSet = (setIdx: number) => {
    setCompletedSets(prev => {
      const updated = [...(prev[currentExercise.id] || Array(currentExercise.setsDefault).fill(false))];
      updated[setIdx] = !updated[setIdx];
      return { ...prev, [currentExercise.id]: updated };
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    // Auto-start rest timer if not already running
    if (!isTimerRunning) {
      setTimerSeconds(currentExercise.restSec || 30);
      setInitialTimer(currentExercise.restSec || 30);
      setIsTimerRunning(true);
    }
  };

  const addTime = (seconds: number) => {
    setTimerSeconds(prev => prev + seconds);
    setInitialTimer(prev => Math.max(prev, timerSeconds + seconds));
  };

  const skipTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const goToNextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextEx = exercises[nextIdx];
      setTimerSeconds(nextEx.durationSec || 45);
      setInitialTimer(nextEx.durationSec || 45);
      setIsTimerRunning(false);
    } else {
      completeWorkout();
    }
  };

  const goToPrevExercise = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevEx = exercises[prevIdx];
      setTimerSeconds(prevEx.durationSec || 45);
      setInitialTimer(prevEx.durationSec || 45);
      setIsTimerRunning(false);
    }
  };

  const completeWorkout = () => {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
    const totalCalories = exercises.reduce((acc, curr) => acc + (curr.caloriesBurnEstimate || 25), 0);

    // Save to LocalStorage for Heatmap and Stats
    const historyItem = {
      id: `workout_${Date.now()}`,
      routineTitle,
      date: new Date().toISOString(),
      durationMinutes: elapsedMinutes,
      exerciseCount: exercises.length,
      calories: totalCalories,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('karavan_fit_workouts') || '[]');
      existing.push(historyItem);
      localStorage.setItem('karavan_fit_workouts', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('karavan:workout-completed', { detail: historyItem }));
    } catch (e) {
      console.error('Error saving workout history:', e);
    }

    setIsFinished(true);
    onFinished?.();
  };

  // Timer Circle Progress calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = initialTimer > 0 ? timerSeconds / initialTimer : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.progressInfo}>
            <span className={styles.progressBadge}>
              {isFinished ? 'Seans Tamamlandı' : `Hareket ${currentIndex + 1} / ${exercises.length}`}
            </span>
            <span className={styles.routineTitle}>{routineTitle}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {!isFinished ? (
          <>
            <div className={styles.body}>
              {/* Exercise Title & Badges */}
              <div className={styles.exerciseHeader}>
                <h3 className={styles.exerciseTitle}>{currentExercise.name}</h3>
                <div className={styles.exerciseMetaRow}>
                  <span className={`${styles.badge} ${styles.badgeAccent}`}>{currentExercise.categoryLabel}</span>
                  <span className={styles.badge}>🛠️ {currentExercise.equipment}</span>
                  <span className={styles.badge}>🎯 {currentExercise.targetMuscles.join(', ')}</span>
                </div>
              </div>

              {/* openGym Animated Moving Visual */}
              <ExerciseVisual
                animationType={currentExercise.animationType}
                exerciseName={currentExercise.name}
                targetMuscles={currentExercise.targetMuscles}
                interactive={true}
              />

              {/* openGym Style Rest / Active Timer */}
              <div className={styles.timerCard}>
                <div className={styles.timerLeft}>
                  <div className={styles.timerRingWrap}>
                    <svg className={styles.timerSvg} viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r={radius} className={styles.timerCircleBg} />
                      <circle
                        cx="30"
                        cy="30"
                        r={radius}
                        className={styles.timerCircleProgress}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <span className={styles.timerTextInside}>
                      {timerSeconds}s
                    </span>
                  </div>
                  <div className={styles.timerInfo}>
                    <span className={styles.timerLabel}>
                      {isTimerRunning ? 'Geri Sayım / Dinlenme' : 'Sayaç Hazır'}
                    </span>
                    <span className={styles.timerDisplay}>{formatTime(timerSeconds)}</span>
                  </div>
                </div>

                <div className={styles.timerControls}>
                  <button className={styles.timerBtn} onClick={() => addTime(15)}>
                    +15s
                  </button>
                  {isTimerRunning ? (
                    <button className={styles.timerBtn} onClick={() => setIsTimerRunning(false)}>
                      ⏸ Duraklat
                    </button>
                  ) : (
                    <button className={`${styles.timerBtn} ${styles.timerBtnPlay}`} onClick={() => setIsTimerRunning(true)}>
                      ▶ Başlat
                    </button>
                  )}
                  {timerSeconds > 0 && isTimerRunning && (
                    <button className={styles.timerBtn} onClick={skipTimer}>
                      Atla ⏭
                    </button>
                  )}
                </div>
              </div>

              {/* Sets Checklist with tactile feedback */}
              <div className={styles.setsSection}>
                <h4 className={styles.setsTitle}>Hedef Setler</h4>
                {currentSets.map((done, setIdx) => (
                  <div
                    key={setIdx}
                    className={`${styles.setRow} ${done ? styles.completed : ''}`}
                    onClick={() => toggleSet(setIdx)}
                  >
                    <div className={styles.setLeft}>
                      <span className={styles.setNumber}>{setIdx + 1}</span>
                      <span className={styles.setTarget}>
                        {currentExercise.durationSec
                          ? `${currentExercise.durationSec} sn çalışma`
                          : `${currentExercise.repsDefault} tekrar`}
                      </span>
                    </div>
                    <div className={styles.setCheckBtn}>✓</div>
                  </div>
                ))}
              </div>

              {/* Why for Caravan and Tips */}
              <div className={styles.tipsCard}>
                <strong>🚐 Karavan İpucu:</strong> {currentExercise.whyForCaravan}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className={styles.footer}>
              <button
                className={styles.navActionBtn}
                onClick={goToPrevExercise}
                disabled={currentIndex === 0}
              >
                ← Önceki
              </button>

              <button className={styles.finishActionBtn} onClick={goToNextExercise}>
                {currentIndex === exercises.length - 1 ? '🎉 Seansı Tamamla' : 'Sıradaki Hareket →'}
              </button>
            </div>
          </>
        ) : (
          /* Celebration View */
          <div className={styles.celebrationBody}>
            <div className={styles.celebrationIcon}>🏆</div>
            <h3 className={styles.celebrationTitle}>Tebrikler, Komşu!</h3>
            <p className={styles.celebrationSub}>
              Doğada karavanının başında harika bir antrenmanı tamamladın. Yol yorgunluğu geride kaldı!
            </p>

            <div className={styles.statsTrophyGrid}>
              <div className={styles.trophyCard}>
                <span className={styles.trophyVal}>{exercises.length}</span>
                <span className={styles.trophyLbl}>Hareket</span>
              </div>
              <div className={styles.trophyCard}>
                <span className={styles.trophyVal}>
                  {Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000))} dk
                </span>
                <span className={styles.trophyLbl}>Süre</span>
              </div>
              <div className={styles.trophyCard}>
                <span className={styles.trophyVal}>
                  ~{exercises.reduce((acc, curr) => acc + (curr.caloriesBurnEstimate || 25), 0)}
                </span>
                <span className={styles.trophyLbl}>Tahmini Kcal</span>
              </div>
            </div>

            <button className={styles.finishActionBtn} onClick={onClose} style={{ width: '100%' }}>
              Harika! Günlüğüme Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
