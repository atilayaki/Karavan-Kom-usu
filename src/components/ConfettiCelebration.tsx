'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfettiCelebration.module.css';

interface AchievementInfo {
  icon: string;
  title: string;
  description?: string | null;
}

interface Props {
  achievement: AchievementInfo;
  onClose: () => void;
}

const COLORS = [
  '#f97316', '#f59e0b', '#22c55e', '#3b82f6',
  '#ec4899', '#8b5cf6', '#10b981', '#fbbf24',
  '#ef4444', '#06b6d4',
];

interface Particle {
  left: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
}

export default function ConfettiCelebration({ achievement, onClose }: Props) {
  const particles = useRef<Particle[]>(
    Array.from({ length: 65 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.2 + Math.random() * 2,
      color: COLORS[i % COLORS.length],
      width: 6 + Math.random() * 8,
      height: 10 + Math.random() * 7,
      rotation: Math.random() * 360,
    }))
  ).current;

  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.confettiContainer} aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className={styles.confetti}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              background: p.color,
              width: `${p.width}px`,
              height: `${p.height}px`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>

      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.shine} />
        <div className={styles.iconRing}>
          <span className={styles.icon}>{achievement.icon}</span>
        </div>
        <p className={styles.label}>Başarım Kazanıldı!</p>
        <h2 className={styles.title}>{achievement.title}</h2>
        {achievement.description && (
          <p className={styles.desc}>{achievement.description}</p>
        )}
        <button className={styles.closeBtn} onClick={onClose}>
          Harika! 🎉
        </button>
      </div>
    </div>,
    document.body,
  );
}
