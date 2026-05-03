'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './chat.module.css';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Partner {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: partnerId } = use(params);
  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || null));
    supabase.from('profiles').select('id, full_name, avatar_url, username').eq('id', partnerId).single()
      .then(({ data }) => setPartner(data));
  }, [partnerId]);

  useEffect(() => {
    if (!myId) return;

    supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`
      )
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));

    // Mark received messages as read
    supabase.from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', partnerId)
      .eq('receiver_id', myId)
      .is('read_at', null)
      .then(() => {});

    const channel = supabase
      .channel(`dm-${[myId, partnerId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new as Message;
          const relevant =
            (msg.sender_id === myId && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === myId);
          if (relevant) setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !myId || sending) return;
    setSending(true);
    await supabase.from('direct_messages').insert({
      sender_id: myId,
      receiver_id: partnerId,
      content: draft.trim(),
    });
    setDraft('');
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const partnerName = partner?.full_name || partner?.username || 'Karavancı';
  const initials = partnerName[0]?.toUpperCase() || '?';

  return (
    <div className={styles.page}>
      <header className={styles.header + ' glass-card'}>
        <Link href="/mesajlar" className={styles.backBtn}>←</Link>
        <div className={styles.headerAvatar}>
          {partner?.avatar_url
            ? <img src={partner.avatar_url} alt={partnerName} />
            : <span>{initials}</span>
          }
        </div>
        <div>
          <div className={styles.headerName}>{partnerName}</div>
          {partner?.username && <div className={styles.headerHandle}>@{partner.username}</div>}
        </div>
        <Link href={`/profil/${partnerId}`} className={styles.profileLink}>Profil →</Link>
      </header>

      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p>Henüz mesaj yok. Merhaba de! 👋</p>
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className={`${styles.msgRow} ${mine ? styles.mine : ''}`}>
              <div className={styles.bubble}>
                <p>{m.content}</p>
                <span className={styles.time}>
                  {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  {mine && <span className={styles.readTick}>{m.read_at ? ' ✓✓' : ' ✓'}</span>}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar + ' glass-card'}>
        {!myId ? (
          <p className={styles.loginHint}>Mesaj göndermek için <Link href="/gunluk">giriş yap</Link></p>
        ) : (
          <>
            <textarea
              className={styles.input}
              placeholder={`${partnerName}'e mesaj yaz...`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={1000}
            />
            <button className={styles.sendBtn} onClick={send} disabled={!draft.trim() || sending}>
              ➤
            </button>
          </>
        )}
      </div>
    </div>
  );
}
