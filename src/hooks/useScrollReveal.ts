'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook that adds scroll-reveal animations to elements.
 * Uses IntersectionObserver to detect when elements enter the viewport.
 */
export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    const el = ref.current;
    if (el) {
      // Observe the element itself
      if (el.classList.contains('reveal') || 
          el.classList.contains('reveal-left') || 
          el.classList.contains('reveal-scale') ||
          el.classList.contains('stagger-children')) {
        observer.observe(el);
      }

      // Also observe child elements with reveal classes
      const children = el.querySelectorAll('.reveal, .reveal-left, .reveal-scale, .stagger-children');
      children.forEach(child => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
