'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AmbientSound.module.css';

// Procedural campfire crackle + soft wind via Web Audio API.
// No external audio files; respects autoplay rules (must start on user click).
export default function AmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [open, setOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ambient-enabled');
    const storedVol = parseFloat(localStorage.getItem('ambient-volume') || '0.15');
    if (stored === 'true') setEnabled(true);
    if (!isNaN(storedVol)) setVolume(storedVol);
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      return;
    }

    const AudioCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // ─── Wind layer: brown-ish noise through low-pass + slow LFO on gain ───
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 380;
    windFilter.Q.value = 0.8;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.4;

    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.07;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 0.25;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);

    windSrc.connect(windFilter).connect(windGain).connect(master);
    windSrc.start();
    windLfo.start();

    // ─── Fire crackle: short noise bursts at random intervals ───
    let cracklesActive = true;
    const scheduleCrackle = () => {
      if (!cracklesActive) return;
      const burstBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const bd = burstBuffer.getChannelData(0);
      for (let i = 0; i < bd.length; i++) {
        const env = Math.exp(-i / (bd.length * 0.15));
        bd[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = burstBuffer;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 1500 + Math.random() * 2500;
      filt.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.value = 0.06 + Math.random() * 0.08;
      src.connect(filt).connect(g).connect(master);
      src.start();

      const next = 200 + Math.random() * 1800;
      setTimeout(scheduleCrackle, next);
    };
    scheduleCrackle();

    cleanupRef.current = () => {
      cracklesActive = false;
      try { windSrc.stop(); } catch {}
      try { windLfo.stop(); } catch {}
      try { ctx.close(); } catch {}
      audioCtxRef.current = null;
      masterGainRef.current = null;
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.2);
    }
    localStorage.setItem('ambient-volume', String(volume));
  }, [volume]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('ambient-enabled', String(next));
    if (next) setOpen(true);
  };

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel + ' glass-card'}>
          <div className={styles.panelHead}>
            <strong>Ambiyans</strong>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>×</button>
          </div>
          <p className={styles.desc}>
            {enabled ? 'Kamp ateşi çıtırtısı + uzak rüzgar' : 'Kapalı'}
          </p>
          <label className={styles.volRow}>
            <span>Ses</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={!enabled}
            />
          </label>
        </div>
      )}
      <button
        className={`${styles.fab} ${enabled ? styles.fabOn : ''}`}
        onClick={enabled ? () => setOpen(!open) : toggle}
        onContextMenu={(e) => { e.preventDefault(); toggle(); }}
        aria-label={enabled ? 'Ambiyans kontrolü' : 'Ambiyansı aç'}
        title={enabled ? 'Tıkla: kontrol · Sağ tık: kapat' : 'Ambiyansı aç'}
      >
        {enabled ? '🔥' : '🔇'}
      </button>
    </div>
  );
}
