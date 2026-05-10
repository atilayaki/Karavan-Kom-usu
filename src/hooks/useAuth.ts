'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UseAuthOptions {
  /** Redirect to /gunluk if user is not authenticated. */
  requireAuth?: boolean;
  /** Redirect path when requireAuth fails. Defaults to /gunluk. */
  redirectTo?: string;
}

export interface UseAuthState {
  user: User | null;
  /** True once initial session check has completed. Use to gate UI. */
  ready: boolean;
}

/**
 * Reads session from localStorage (instant, no network) and listens for changes.
 * Optionally redirects unauthenticated users.
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthState {
  const { requireAuth = false, redirectTo = '/gunluk' } = options;
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (requireAuth && ready && !user) {
      router.replace(redirectTo);
    }
  }, [requireAuth, ready, user, redirectTo, router]);

  return { user, ready };
}
