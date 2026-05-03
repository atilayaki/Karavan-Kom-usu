'use client';

import { useState, useEffect } from 'react';
import styles from './WeatherWidget.module.css';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  humidity: number;
  wind: number;
  feelsLike: number;
}

// Free weather API — no key needed
async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`
    );
    const data = await res.json();
    
    const current = data.current;
    const weatherCode = current.weather_code;
    
    // Map WMO weather codes to descriptions and icons
    const weatherMap: Record<number, { desc: string; icon: string }> = {
      0: { desc: 'Açık', icon: '☀️' },
      1: { desc: 'Çoğunlukla Açık', icon: '🌤️' },
      2: { desc: 'Parçalı Bulutlu', icon: '⛅' },
      3: { desc: 'Kapalı', icon: '☁️' },
      45: { desc: 'Sisli', icon: '🌫️' },
      48: { desc: 'Kırağılı Sis', icon: '🌫️' },
      51: { desc: 'Hafif Çisenti', icon: '🌦️' },
      53: { desc: 'Çisenti', icon: '🌧️' },
      55: { desc: 'Yoğun Çisenti', icon: '🌧️' },
      61: { desc: 'Hafif Yağmur', icon: '🌦️' },
      63: { desc: 'Yağmurlu', icon: '🌧️' },
      65: { desc: 'Şiddetli Yağmur', icon: '⛈️' },
      71: { desc: 'Hafif Kar', icon: '🌨️' },
      73: { desc: 'Karlı', icon: '❄️' },
      75: { desc: 'Yoğun Kar', icon: '❄️' },
      80: { desc: 'Sağanak', icon: '🌧️' },
      81: { desc: 'Kuvvetli Sağanak', icon: '⛈️' },
      95: { desc: 'Gök Gürültülü', icon: '⛈️' },
    };
    
    const weather = weatherMap[weatherCode] || { desc: 'Bilinmiyor', icon: '🌡️' };
    
    // Reverse geocode for city name
    let city = 'Konumunuz';
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1&language=tr`);
      // Fallback: use a simpler approach
      city = `${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E`;
    } catch {}
    
    return {
      temp: Math.round(current.temperature_2m),
      description: weather.desc,
      icon: weather.icon,
      city,
      humidity: current.relative_humidity_2m,
      wind: Math.round(current.wind_speed_10m),
      feelsLike: Math.round(current.apparent_temperature),
    };
  } catch (err) {
    console.error('Weather fetch error:', err);
    return null;
  }
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
          setLoading(false);
        },
        () => {
          // Default: Istanbul
          fetchWeather(41.0082, 28.9784).then(data => {
            if (data) data.city = 'İstanbul';
            setWeather(data);
            setLoading(false);
          });
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.skeleton}>
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  // ─── Karavan Mood-Meter ───
  // Score 0-100 based on temp, wind, weather conditions
  const mood = (() => {
    let score = 100;
    if (weather.temp < 5 || weather.temp > 32) score -= 35;
    else if (weather.temp < 12 || weather.temp > 28) score -= 15;
    if (weather.wind > 35) score -= 30;
    else if (weather.wind > 20) score -= 15;
    if (weather.description.includes('Yağmur') || weather.description.includes('Sağanak')) score -= 25;
    if (weather.description.includes('Kar') || weather.description.includes('Şiddetli')) score -= 35;
    if (weather.description.includes('Gök Gürültülü')) score -= 50;
    if (weather.description.includes('Sis')) score -= 10;
    score = Math.max(5, Math.min(100, score));

    if (score >= 80) return { label: 'Mükemmel karavan günü!', emoji: '🚐✨', color: 'var(--forest-green)', score };
    if (score >= 60) return { label: 'İyi, yola çıkılır', emoji: '🚐', color: 'var(--sunset-orange)', score };
    if (score >= 35) return { label: 'İdare eder, dikkatli ol', emoji: '🤔', color: '#D4A017', score };
    return { label: 'Bugün şehirde kal', emoji: '🛋️', color: '#C0392B', score };
  })();

  return (
    <div
      className={`${styles.widget} glass-card`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.main}>
        <span className={styles.icon}>{weather.icon}</span>
        <div className={styles.info}>
          <div className={styles.temp}>{weather.temp}°C</div>
          <div className={styles.desc}>{weather.description}</div>
        </div>
        <div className={styles.city}>{weather.city}</div>
      </div>

      <div className={styles.moodMeter} title={`Skor: ${mood.score}/100`}>
        <div className={styles.moodHead}>
          <span className={styles.moodEmoji}>{mood.emoji}</span>
          <span className={styles.moodLabel} style={{ color: mood.color }}>{mood.label}</span>
        </div>
        <div className={styles.moodBar}>
          <div
            className={styles.moodFill}
            style={{ width: `${mood.score}%`, background: mood.color }}
          />
        </div>
      </div>
      
      {expanded && (
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Hissedilen</span>
            <span className={styles.detailValue}>{weather.feelsLike}°C</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Nem</span>
            <span className={styles.detailValue}>%{weather.humidity}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Rüzgâr</span>
            <span className={styles.detailValue}>{weather.wind} km/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
