'use client';

import { useState } from 'react';
import styles from './ExerciseVisual.module.css';

interface ExerciseVisualProps {
  animationType: 'squat' | 'chair-dips' | 'stepup' | 'pushup' | 'cobra' | 'plank' | 'hamstring' | 'sun-salute';
  exerciseName: string;
  targetMuscles?: string[];
  interactive?: boolean;
}

export default function ExerciseVisual({
  animationType,
  exerciseName,
  targetMuscles = [],
  interactive = true,
}: ExerciseVisualProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!interactive) return;
    setIsPlaying(prev => !prev);
  };

  const primaryMuscle = targetMuscles[0] || 'Tüm Vücut';

  return (
    <div
      className={`${styles.visualContainer} ${!isPlaying ? styles.isPaused : ''}`}
      onClick={togglePlay}
      title={`${exerciseName} - ${isPlaying ? 'Durdurmak için dokun' : 'Oynatmak için dokun'}`}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          togglePlay();
        }
      }}
    >
      <div className={styles.canvasGrid} />
      <div className={styles.ambientGlow} />

      {/* Target Muscle Tag */}
      <div className={styles.activeBadge}>
        <span className={styles.livePulseDot} />
        <span>{primaryMuscle}</span>
      </div>

      {/* OpenGym Style Tap to Pause Hint */}
      {interactive && (
        <div className={styles.playHint}>
          <span className={styles.playHintIcon}>{isPlaying ? '⏸' : '▶'}</span>
          <span>{isPlaying ? 'Durdur' : 'Oynat'}</span>
        </div>
      )}

      {/* RENDER SPECIFIC ANIMATION BASED ON TYPE */}
      {renderAnimationSVG(animationType)}
    </div>
  );
}

function renderAnimationSVG(type: ExerciseVisualProps['animationType']) {
  switch (type) {
    case 'squat':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground */}
          <line x1="40" y1="190" x2="260" y2="190" className={styles.groundLine} />
          
          {/* Lower Body & Torso with keyframe classes */}
          <g className={styles.animSquat}>
            {/* Head */}
            <circle cx="150" cy="55" r="14" fill="#f8fafc" />
            
            {/* Torso */}
            <line x1="150" y1="70" x2="150" y2="125" className={styles.boneStroke} />

            {/* Glowing Quad Muscles (openGym style) */}
            <path
              d="M 148 125 Q 128 150 134 185 Q 150 170 148 125 Z"
              className={styles.musclePrimary}
              opacity="0.8"
            />
            <path
              d="M 152 125 Q 172 150 166 185 Q 150 170 152 125 Z"
              className={styles.musclePrimary}
              opacity="0.8"
            />

            {/* Legs */}
            <line x1="150" y1="125" x2="135" y2="155" className={styles.boneStrokeAccent} />
            <line x1="135" y1="155" x2="135" y2="190" className={styles.boneStroke} />

            <line x1="150" y1="125" x2="165" y2="155" className={styles.boneStrokeAccent} />
            <line x1="165" y1="155" x2="165" y2="190" className={styles.boneStroke} />

            {/* Joints */}
            <circle cx="150" cy="125" r="5" className={styles.jointNode} />
            <circle cx="135" cy="155" r="4" className={styles.jointNode} />
            <circle cx="165" cy="155" r="4" className={styles.jointNode} />
          </g>

          {/* Arms reaching forward in squat balance */}
          <g className={styles.animSquatArms}>
            <line x1="150" y1="80" x2="185" y2="92" className={styles.boneStroke} />
            <circle cx="185" cy="92" r="3.5" className={styles.jointNode} />
          </g>
        </svg>
      );

    case 'chair-dips':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />
          
          {/* Camping Chair Outline */}
          <path d="M 190 190 L 195 130 L 235 130 L 245 190 M 235 130 L 235 80" className={styles.propOutline} />

          {/* Torso & Triceps Motion */}
          <g className={styles.animDipsTorso}>
            {/* Head */}
            <circle cx="140" cy="85" r="13" fill="#f8fafc" />
            {/* Torso */}
            <line x1="140" y1="98" x2="140" y2="150" className={styles.boneStroke} />

            {/* Triceps Muscle Accent */}
            <line x1="140" y1="108" x2="190" y2="115" className={styles.boneStrokeAccent} />
            <circle cx="165" cy="111" r="7" className={styles.musclePrimary} />

            {/* Forearm on chair */}
            <line x1="190" y1="115" x2="195" y2="130" className={styles.boneStroke} />

            {/* Legs extended forward */}
            <line x1="140" y1="150" x2="95" y2="188" className={styles.boneStroke} />
            <circle cx="140" cy="150" r="5" className={styles.jointNode} />
            <circle cx="95" cy="188" r="4" className={styles.jointNode} />
          </g>
        </svg>
      );

    case 'stepup':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground & Caravan Step Box */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />
          <rect x="160" y="150" width="70" height="40" rx="4" className={styles.propOutline} />
          <text x="195" y="174" fill="#94a3b8" fontSize="10" textAnchor="middle">Basamak</text>

          {/* Figure Stepping Up */}
          <g className={styles.animStepUp}>
            <circle cx="135" cy="70" r="13" fill="#f8fafc" />
            <line x1="135" y1="83" x2="135" y2="135" className={styles.boneStroke} />
            
            {/* Stepping Leg onto Box */}
            <line x1="135" y1="135" x2="175" y2="140" className={styles.boneStrokeAccent} />
            <line x1="175" y1="140" x2="175" y2="150" className={styles.boneStrokeAccent} />

            {/* Glute / Quad Muscle Glow */}
            <circle cx="155" cy="137" r="7" className={styles.musclePrimary} />

            {/* Trailing Leg */}
            <line x1="135" y1="135" x2="120" y2="190" className={styles.boneStroke} />

            {/* Arms swinging in rhythm */}
            <line x1="135" y1="95" x2="155" y2="120" className={styles.boneStroke} />
          </g>
        </svg>
      );

    case 'pushup':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Incline Caravan Bumper / Ground */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />
          
          {/* Moving Figure in Pushup */}
          <g className={styles.animPushup}>
            {/* Head */}
            <circle cx="215" cy="115" r="12" fill="#f8fafc" />
            
            {/* Torso line */}
            <line x1="80" y1="185" x2="205" y2="125" className={styles.boneStroke} />

            {/* Pectoral Chest & Triceps Glow */}
            <ellipse cx="180" cy="130" rx="12" ry="8" className={styles.musclePrimary} />

            {/* Arms pushing */}
            <line x1="190" y1="130" x2="190" y2="185" className={styles.boneStrokeAccent} />
            <circle cx="190" cy="130" r="5" className={styles.jointNode} />
            <circle cx="190" cy="185" r="4" className={styles.jointNode} />

            {/* Feet anchor */}
            <circle cx="80" cy="185" r="4" className={styles.jointNode} />
          </g>
        </svg>
      );

    case 'cobra':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />

          {/* Lower legs flat on ground */}
          <line x1="60" y1="190" x2="130" y2="190" className={styles.boneStroke} />
          
          {/* Upper Body Arching in Cobra */}
          <g className={styles.animCobraSpine}>
            {/* Glowing Spine / Erector Spinae */}
            <path
              d="M 130 190 Q 155 175 165 130 Q 170 100 180 85"
              fill="none"
              className={styles.boneStrokeAccent}
              strokeWidth="7"
            />
            {/* Head looking gently upward */}
            <circle cx="188" cy="75" r="13" fill="#f8fafc" />

            {/* Supporting Arms */}
            <line x1="165" y1="130" x2="165" y2="190" className={styles.boneStroke} />
            <circle cx="165" cy="190" r="4" className={styles.jointNode} />

            {/* Lumbar Spine Accentuation */}
            <circle cx="145" cy="175" r="8" className={styles.musclePrimary} />
          </g>
        </svg>
      );

    case 'plank':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />

          <g className={styles.animPlankBreathe}>
            {/* Head */}
            <circle cx="220" cy="142" r="12" fill="#f8fafc" />

            {/* Full Body Plank Line */}
            <line x1="75" y1="185" x2="210" y2="150" className={styles.boneStroke} strokeWidth="6" />

            {/* Core Abs Area Glowing with Energy */}
            <ellipse cx="140" cy="165" rx="24" ry="10" className={`${styles.musclePrimary} ${styles.animPlankCoreGlow}`} />

            {/* Forearms supporting body */}
            <line x1="195" y1="152" x2="195" y2="190" className={styles.boneStrokeAccent} />
            <line x1="195" y1="190" x2="215" y2="190" className={styles.boneStrokeAccent} />

            {/* Joints */}
            <circle cx="75" cy="185" r="4" className={styles.jointNode} />
            <circle cx="195" cy="152" r="5" className={styles.jointNode} />
          </g>
        </svg>
      );

    case 'hamstring':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground & Step */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />
          <rect x="180" y="160" width="50" height="30" rx="3" className={styles.propOutline} />

          {/* Extended Leg on Step with Hamstring Stretch */}
          <line x1="120" y1="140" x2="190" y2="160" className={styles.boneStrokeAccent} />
          {/* Glowing Hamstring Muscle */}
          <path
            d="M 125 142 Q 155 147 185 160"
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            opacity="0.8"
          />

          {/* Standing Leg */}
          <line x1="120" y1="140" x2="110" y2="190" className={styles.boneStroke} />

          {/* Bending Torso over Extended Leg */}
          <g className={styles.animHamstring}>
            <circle cx="155" cy="85" r="12" fill="#f8fafc" />
            <line x1="120" y1="140" x2="150" y2="95" className={styles.boneStroke} />
            <line x1="145" y1="105" x2="175" y2="145" className={styles.boneStroke} />
          </g>
        </svg>
      );

    case 'sun-salute':
      return (
        <svg viewBox="0 0 300 220" className={styles.svgStage}>
          {/* Ground */}
          <line x1="30" y1="190" x2="270" y2="190" className={styles.groundLine} />

          {/* Sun Rays Background */}
          <g opacity="0.3">
            <circle cx="150" cy="190" r="45" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="150" y1="135" x2="150" y2="120" stroke="#f59e0b" strokeWidth="2" />
            <line x1="110" y1="150" x2="100" y2="140" stroke="#f59e0b" strokeWidth="2" />
            <line x1="190" y1="150" x2="200" y2="140" stroke="#f59e0b" strokeWidth="2" />
          </g>

          {/* Breathing Body */}
          <g className={styles.animSunSaluteBody}>
            {/* Legs & Torso */}
            <line x1="146" y1="130" x2="146" y2="190" className={styles.boneStroke} />
            <line x1="154" y1="130" x2="154" y2="190" className={styles.boneStroke} />
            <line x1="150" y1="75" x2="150" y2="130" className={styles.boneStrokeAccent} />

            {/* Glowing Heart / Chest Area */}
            <circle cx="150" cy="90" r="12" className={styles.musclePrimary} opacity="0.8" />

            {/* Head */}
            <circle cx="150" cy="60" r="13" fill="#f8fafc" />
          </g>

          {/* Arms Opening to the Sky */}
          <g className={styles.animSunSaluteArms}>
            <line x1="150" y1="80" x2="185" y2="40" className={styles.boneStrokeAccent} />
            <circle cx="185" cy="40" r="4" className={styles.jointNode} />
          </g>
          <g className={styles.animSunSaluteArms} style={{ transformOrigin: '150px 80px', transform: 'scaleX(-1)' }}>
            <line x1="150" y1="80" x2="185" y2="40" className={styles.boneStrokeAccent} />
            <circle cx="185" cy="40" r="4" className={styles.jointNode} />
          </g>
        </svg>
      );

    default:
      return null;
  }
}
