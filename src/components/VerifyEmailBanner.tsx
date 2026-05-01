'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailBanner() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user || user.email_confirmed_at) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #FF8C42, #ffb38a)',
      color: 'white',
      padding: '10px 20px',
      textAlign: 'center',
      fontSize: '0.85rem',
      fontWeight: '600',
      position: 'fixed',
      top: 'var(--nav-height)',
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      ✉️ Lütfen e-posta adresinizi doğrulayın. Bazı özellikler kısıtlanmış olabilir.
    </div>
  );
}
