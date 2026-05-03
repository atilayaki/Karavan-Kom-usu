'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './mesajlar.module.css';

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export default function MesajlarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) loadConversations(uid);
      else setLoading(false);
    });
  }, []);

  async function loadConversations(uid: string) {
    const { data } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at, profiles!direct_messages_sender_id_fkey(full_name, avatar_url), receiver:profiles!direct_messages_receiver_id_fkey(full_name, avatar_url)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const map = new Map<string, Conversation>();
    for (const msg of data) {
      const isSender = msg.sender_id === uid;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;
      if (map.has(partnerId)) continue;
      const prof: { full_name: string | null; avatar_url: string | null } | null = isSender
        ? (msg as any).receiver
        : (msg as any).profiles;
      map.set(partnerId, {
        partnerId,
        partnerName: prof?.full_name || 'Karavancı',
        partnerAvatar: prof?.avatar_url || null,
        lastMessage: msg.content,
        lastAt: msg.created_at,
        unread: !isSender && !msg.read_at ? 1 : 0,
      });
    }
    setConvs(Array.from(map.values()));
    setLoading(false);
  }

  if (!userId && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <p>Mesajlarını görmek için <Link href="/gunluk">giriş yap</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>💬 Mesajlar</h1>

        {loading && <div className={styles.center}><p>Yükleniyor...</p></div>}

        {!loading && convs.length === 0 && (
          <div className={styles.empty + ' glass-card'}>
            <span>💬</span>
            <p>Henüz mesajın yok. Bir komşuya mesaj at!</p>
            <Link href="/kesfet" className="btn-primary">Komşuları Keşfet</Link>
          </div>
        )}

        <div className={styles.list}>
          {convs.map(c => (
            <Link key={c.partnerId} href={`/mesajlar/${c.partnerId}`} className={styles.convRow + ' glass-card'}>
              <div className={styles.avatar}>
                {c.partnerAvatar
                  ? <img src={c.partnerAvatar} alt={c.partnerName} />
                  : <span>{c.partnerName[0].toUpperCase()}</span>
                }
                {c.unread > 0 && <div className={styles.unreadDot} />}
              </div>
              <div className={styles.convInfo}>
                <div className={styles.convName}>{c.partnerName}</div>
                <div className={styles.convPreview}>{c.lastMessage}</div>
              </div>
              <div className={styles.convTime}>
                {new Date(c.lastAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
