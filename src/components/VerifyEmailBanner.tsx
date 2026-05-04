'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const BANNER_HEIGHT = 40;

export default function VerifyEmailBanner() {
  const [user, setUser] = useState<{ email_confirmed_at?: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Push <main> down by the banner height so it doesn't get covered.
  useEffect(() => {
    const visible = !!user && !user.email_confirmed_at;
    const main = document.querySelector('main');
    if (!main) return;
    const prev = main.style.marginTop;
    if (visible) {
      main.style.marginTop = `calc(var(--nav-height) + env(safe-area-inset-top) + ${BANNER_HEIGHT}px)`;
    }
    return () => {
      main.style.marginTop = prev;
    };
  }, [user]);

  if (!user || user.email_confirmed_at) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #FF8C42, #ffb38a)',
      color: 'white',
      padding: '10px 16px',
      textAlign: 'center',
      fontSize: '0.85rem',
      fontWeight: 600,
      position: 'fixed',
      top: 'calc(var(--nav-height) + env(safe-area-inset-top))',
      left: 0,
      right: 0,
      height: `${BANNER_HEIGHT}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      ✉️ E-posta adresinizi doğrulayın
    </div>
  );
}
