'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './kamp-atesi.module.css';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

function isFireOpen(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h === 0;
}

function getCountdown(): string {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);
  if (now.getHours() >= 20 || now.getHours() === 0) return '';
  const diff = target.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function KampAtesiPage() {
  const [open, setOpen] = useState(isFireOpen());
  const [countdown, setCountdown] = useState(getCountdown());
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = setInterval(() => {
      setOpen(isFireOpen());
      setCountdown(getCountdown());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    supabase
      .from('kamp_atesi_messages')
      .select('*, profiles(full_name, username, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(80)
      .then(({ data }) => setMessages((data as Message[]) || []));

    const channel = supabase
      .channel('kamp-atesi-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kamp_atesi_messages' },
        (payload) => {
          const msg = payload.new as Message;
          supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', msg.user_id)
            .single()
            .then(({ data: prof }) => {
              setMessages(prev => [...prev, { ...msg, profiles: prof }]);
            });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim() || !userId || sending) return;
    setSending(true);
    await supabase.from('kamp_atesi_messages').insert({
      user_id: userId,
      content: draft.trim(),
    });
    setDraft('');
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!open) {
    return (
      <div className={styles.closedPage}>
        <div className={styles.closedCard + ' glass-card'}>
          <div className={styles.logoBig}>🔥</div>
          <h1>Kamp Ateşi</h1>
          <p className={styles.closedSub}>Her gece saat 20:00'da alevlenir,<br />gece yarısı söner.</p>
          <div className={styles.countdownWrap}>
            <span className={styles.countdownLabel}>Açılmaya</span>
            <span className={styles.countdownValue}>{countdown}</span>
            <span className={styles.countdownLabel}>kaldı</span>
          </div>
          <p className={styles.closedHint}>Saat 20:00'da buraya geri gel, ateşin başında komşularınla sohbet et.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header + ' glass-card'}>
        <div className={styles.flame}>🔥</div>
        <div>
          <h1 className={styles.title}>Kamp Ateşi</h1>
          <p className={styles.headerSub}>Gece yarısına kadar açık · {messages.length} mesaj</p>
        </div>
        <div className={styles.closingBadge}>00:00'da söner</div>
      </header>

      <div className={styles.emberBar} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={styles.ember} style={{ left: `${8 + i * 8}%`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <span>🔥</span>
            <p>Ateşi sen başlat. İlk mesajı yaz!</p>
          </div>
        )}
        {messages.map(m => {
          const mine = m.user_id === userId;
          const name = m.profiles?.full_name || m.profiles?.username || 'Karavancı';
          const initials = name[0].toUpperCase();
          return (
            <div key={m.id} className={`${styles.msgRow} ${mine ? styles.mine : ''}`}>
              {!mine && (
                <div className={styles.msgAvatar}>
                  {m.profiles?.avatar_url
                    ? <img src={m.profiles.avatar_url} alt={name} />
                    : <span>{initials}</span>
                  }
                </div>
              )}
              <div className={styles.msgBubble}>
                {!mine && <span className={styles.msgName}>{name}</span>}
                <p>{m.content}</p>
                <span className={styles.msgTime}>
                  {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar + ' glass-card'}>
        {!userId ? (
          <p className={styles.loginHint}>Mesaj göndermek için <a href="/gunluk">giriş yap</a></p>
        ) : (
          <>
            <textarea
              className={styles.input}
              placeholder="Ateşin başında bir şeyler söyle..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={300}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
            >
              🔥
            </button>
          </>
        )}
      </div>
    </div>
  );
}
