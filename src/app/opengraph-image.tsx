import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Karavan Komşusu — Yolun Tadını Birlikte Çıkaralım';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0c1a0c 0%, #1a2e1a 50%, #0d1a0d 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,140,66,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,90,39,0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://karavankomsusu.com/logo.png"
          width={120}
          height={120}
          style={{ borderRadius: '16px', marginBottom: '24px' }}
          alt="logo"
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#ff8c42',
            letterSpacing: '-1px',
            marginBottom: '12px',
            display: 'flex',
          }}
        >
          Karavan Komşusu
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '26px',
            color: 'rgba(232,245,232,0.75)',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          Yolun Tadını Birlikte Çıkaralım 🚐
        </div>

        {/* URL pill */}
        <div
          style={{
            marginTop: '32px',
            padding: '8px 24px',
            borderRadius: '999px',
            border: '1px solid rgba(255,140,66,0.4)',
            color: 'rgba(255,140,66,0.8)',
            fontSize: '18px',
            display: 'flex',
          }}
        >
          karavankomsusu.com
        </div>
      </div>
    ),
    { ...size }
  );
}
