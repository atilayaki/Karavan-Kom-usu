'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageCropper.module.css';

interface Props {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Serbest', value: undefined },
];

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
    width,
    height
  );
}

export default function ImageCropper({ src, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [loading, setLoading] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect ?? 1));
  }, [aspect]);

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current && newAspect !== undefined) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, newAspect));
    }
  };

  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas boş')), 'image/jpeg', 0.92);
    });
  }, [completedCrop, rotate, scale]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const blob = await getCroppedBlob();
      if (blob) onConfirm(blob);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Fotoğrafı Düzenle</h3>
          <button className={styles.cancelBtn} onClick={onCancel}>✕</button>
        </div>

        {/* Aspect ratio tabs */}
        <div className={styles.aspectTabs}>
          {ASPECT_OPTIONS.map(opt => (
            <button
              key={opt.label}
              className={`${styles.aspectBtn} ${aspect === opt.value ? styles.aspectBtnActive : ''}`}
              onClick={() => handleAspectChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Crop area */}
        <div className={styles.cropWrapper}>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Kırpılacak görsel"
              className={styles.cropImg}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>🔍 Yakınlaştır</span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.controlValue}>{Math.round(scale * 100)}%</span>
          </div>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>↻ Döndür</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotate}
              onChange={e => setRotate(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.controlValue}>{rotate}°</span>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelFooterBtn} onClick={onCancel}>İptal</button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Hazırlanıyor...' : '✓ Uygula'}
          </button>
        </div>
      </div>
    </div>
  );
}
