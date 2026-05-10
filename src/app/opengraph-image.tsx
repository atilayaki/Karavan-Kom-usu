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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c1a0c',
          position: 'relative',
          overflow: 'hidden',
          gap: '64px',
          padding: '0 80px',
        }}
      >
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,66,0.2) 0%, transparent 65%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,90,39,0.35) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://karavankomsusu.com/logo.png"
          width={220}
          height={220}
          style={{
            borderRadius: '32px',
            flexShrink: 0,
            boxShadow: '0 0 60px rgba(255,140,66,0.25)',
          }}
          alt="logo"
        />

        {/* Text block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            fontSize: '68px',
            fontWeight: 800,
            color: '#ff8c42',
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            display: 'flex',
          }}>
            Karavan Komşusu
          </div>

          <div style={{
            fontSize: '28px',
            color: 'rgba(232,245,232,0.8)',
            fontWeight: 500,
            display: 'flex',
          }}>
            Yolun Tadını Birlikte Çıkaralım 🚐
          </div>

          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              padding: '6px 20px',
              borderRadius: '999px',
              border: '1.5px solid rgba(255,140,66,0.5)',
              color: 'rgba(255,140,66,0.9)',
              fontSize: '20px',
              display: 'flex',
            }}>
              karavankomsusu.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
