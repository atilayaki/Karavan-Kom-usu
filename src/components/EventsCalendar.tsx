'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@/lib/database.types';
import styles from './EventsCalendar.module.css';

interface Props {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function EventsCalendar({ events, onSelectEvent }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(ev => {
      const d = new Date(ev.event_date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Mon-first offset (0=Sun → 6, 1=Mon → 0)
    const offset = (firstDay.getDay() + 6) % 7;
    const days: Array<{ day: number; key: string; isCurrent: boolean } | null> = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ day: d, key: `${year}-${month}-${d}`, isCurrent: true });
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : [];
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Önceki ay">‹</button>
        <h3>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Sonraki ay">›</button>
      </div>

      <div className={styles.weekHeader}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className={styles.grid}>
        {grid.map((cell, i) => {
          if (!cell) return <div key={i} className={styles.empty}></div>;
          const dayEvents = eventsByDay.get(cell.key) || [];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDay;
          return (
            <button
              key={i}
              className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${dayEvents.length ? styles.hasEvents : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : cell.key)}
            >
              <span className={styles.dayNum}>{cell.day}</span>
              {dayEvents.length > 0 && (
                <span className={styles.eventDot}>{dayEvents.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && selectedEvents.length > 0 && (
        <div className={styles.dayList}>
          <h4>O günün etkinlikleri</h4>
          {selectedEvents.map(ev => (
            <button key={ev.id} className={styles.dayItem + ' glass-card'} onClick={() => onSelectEvent?.(ev)}>
              <div className={styles.dayItemTime}>
                {new Date(ev.event_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className={styles.dayItemBody}>
                <strong>{ev.title}</strong>
                <small>{ev.location_name}</small>
              </div>
              <span className={styles.dayItemCat}>{ev.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
