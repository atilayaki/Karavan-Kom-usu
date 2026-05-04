'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconBell } from './Icons';
import styles from './NotificationBell.module.css';

interface Notification {
  id: number;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user) return;
      setUserId(user.id);

      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (!mounted || !data) return;
          setItems(data);
          setUnread(data.filter(n => !n.is_read).length);
        });

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const n = payload.new as Notification;
            setItems(prev => [n, ...prev].slice(0, 20));
            setUnread(c => c + 1);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const markAllRead = async () => {
    if (!userId || unread === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    const days = Math.floor(hours / 24);
    return `${days}g önce`;
  };

  if (!userId) return null;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.bellBtn}
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        aria-label="Bildirimler"
      >
        <IconBell size={20} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={`${styles.panel} ${align === 'left' ? styles.alignLeft : styles.alignRight} glass-card`}>
          <div className={styles.panelHeader}>
            <strong>Bildirimler</strong>
            {items.length > 0 && (
              <button className={styles.clearBtn} onClick={async () => {
                if (!userId) return;
                await supabase.from('notifications').delete().eq('user_id', userId);
                setItems([]); setUnread(0);
              }}>Temizle</button>
            )}
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>Henüz bildirim yok.</div>
          ) : (
            <div className={styles.list}>
              {items.map(n => {
                const content = (
                  <div className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}>
                    <div className={styles.dot}></div>
                    <div className={styles.body}>
                      <p>{n.message}</p>
                      <small>{formatTime(n.created_at)}</small>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link href={n.link} key={n.id} onClick={() => setOpen(false)} className={styles.itemLink}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
