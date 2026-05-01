'use client';

import { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has a preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <button 
      className={styles.toggleBtn} 
      onClick={toggleTheme}
      aria-label="Tema Değiştir"
    >
      {isDarkMode ? (
        <span className={styles.icon}>☀️</span>
      ) : (
        <span className={styles.icon}>🌙</span>
      )}
    </button>
  );
}
