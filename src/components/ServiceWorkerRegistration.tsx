'use client';

import { useEffect } from 'react';

// One-shot cache & service-worker purge.
// On first load after this component ships:
//   1. Unregister any service worker the previous build left behind.
//   2. Clear every CacheStorage entry that older versions populated.
//   3. If we actually killed something, reload the tab once so the page
//      renders against the freshly fetched assets.
// A sessionStorage sentinel prevents reload loops.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('kk_cache_purged_v1') === '1') return;

    (async () => {
      let killedSomething = false;
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) killedSomething = true;
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          if (keys.length > 0) killedSomething = true;
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // best-effort
      }

      sessionStorage.setItem('kk_cache_purged_v1', '1');

      if (killedSomething) {
        // Cache-busting full reload — fetch every chunk fresh.
        window.location.reload();
      }
    })();
  }, []);

  return null;
}
