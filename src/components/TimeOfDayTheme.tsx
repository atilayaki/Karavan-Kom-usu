'use client';

import { useEffect } from 'react';

// Sets data-tod attribute on <html> based on local hour, updates every 5 minutes.
// CSS in globals.css picks up these attributes to shift accent overlays.
export default function TimeOfDayTheme() {
  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours();
      let tod: 'dawn' | 'morning' | 'afternoon' | 'sunset' | 'night';
      if (h >= 5 && h < 8) tod = 'dawn';
      else if (h >= 8 && h < 16) tod = 'morning';
      else if (h >= 16 && h < 19) tod = 'afternoon';
      else if (h >= 19 && h < 22) tod = 'sunset';
      else tod = 'night';
      document.documentElement.setAttribute('data-tod', tod);
    };
    apply();
    const id = setInterval(apply, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
