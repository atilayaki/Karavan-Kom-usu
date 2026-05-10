'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

async function subscribeToPush(registration: ServiceWorkerRegistration, userId: string) {
  try {
    const existing = await registration.pushManager.getSubscription();
    const sub = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: sub.toJSON() }),
    });
  } catch {
    // Push not supported or denied — silently ignore
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        if (Notification.permission === 'granted') {
          subscribeToPush(registration, session.user.id);
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            subscribeToPush(registration, session.user.id);
          }
        }
      } catch {
        // Service worker registration failed — silently ignore
      }
    })();
  }, []);

  return null;
}
