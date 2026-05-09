'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './mesajlar.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { IconChat, IconUser, IconSOS, IconMap } from '@/components/Icons';
import { useToast } from '@/components/Toast';

type PresenceStatus = 'online' | 'busy';

function getStatus(presenceMap: Record<string, PresenceStatus>, userId: string) {
  const s = presenceMap[userId];
  if (s === 'online') return { label: 'Çevrimiçi', color: '#44b700' };
  if (s === 'busy') return { label: 'Meşgul', color: '#f59e0b' };
  return { label: 'Çevrimdışı', color: '#6b7280' };
}

export default function MesajlarPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchConversations(user.id);
        setupPresence(user.id);
      }
    });
    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, []);

  const setupPresence = (userId: string) => {
    const channel = supabase.channel('online-users');

    const trackStatus = (status: PresenceStatus) => {
      channel.track({ user_id: userId, status, online_at: new Date().toISOString() });
    };

    const syncPresence = () => {
      const state = channel.presenceState<{ user_id: string; status: PresenceStatus }>();
      const map: Record<string, PresenceStatus> = {};
      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((p) => {
          if (p.user_id) map[p.user_id] = p.status;
        });
      });
      setPresenceMap(map);
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          trackStatus(document.hidden ? 'busy' : 'online');
        }
      });

    const handleVisibility = () => trackStatus(document.hidden ? 'busy' : 'online');
    document.addEventListener('visibilitychange', handleVisibility);

    presenceChannelRef.current = channel;

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  };

  const fetchConversations = async (userId: string) => {
    setLoading(true);
    // Arkadaşları çek (Onaylanmış olanlar)
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('*, sender:user_id(id, full_name, avatar_url, caravan_type), receiver:friend_id(id, full_name, avatar_url, caravan_type)')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendsData) {
      const chatList = friendsData.map(f => f.user_id === userId ? f.receiver : f.sender);
      setConversations(chatList);
    }
    setLoading(false);
  };

  const fetchMessages = async (friendId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    if (activeChat && user) {
      fetchMessages(activeChat.id);

      const subscription = supabase
        .channel(`dm_${user.id}_${activeChat.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id}))`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(subscription); };
    }
  }, [activeChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeChat) return;

    const text = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('direct_messages').insert([
      {
        sender_id: user.id,
        receiver_id: activeChat.id,
        content: text
      }
    ]);

    if (error) {
      showToast("Mesaj gönderilemedi.", "error");
    }
  };

  if (!user) return <div className={styles.loginPrompt}>Mesajlarınızı görmek için lütfen giriş yapın.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      
      <div
        className={styles.dmWrapper + " glass-card"}
        data-mobile-view={activeChat ? 'chat' : 'list'}
      >
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Mesajlar</h3>
          </div>
          <div className={styles.conversations}>
            {loading ? (
              <div className={styles.loading}>Yükleniyor...</div>
            ) : conversations.length === 0 ? (
              <div className={styles.empty}>Henüz arkadaşın yok.</div>
            ) : (
              conversations.map(conv => {
                const status = getStatus(presenceMap, conv.id);
                return (
                  <div
                    key={conv.id}
                    className={`${styles.convItem} ${activeChat?.id === conv.id ? styles.activeConv : ''}`}
                    onClick={() => setActiveChat(conv)}
                  >
                    <div className={styles.avatarWrapper}>
                      <div className={styles.avatar}>
                        {conv.avatar_url ? (
                          <Image src={conv.avatar_url} fill alt={conv.full_name} style={{objectFit: 'cover', borderRadius: '50%'}} />
                        ) : (
                          conv.full_name?.charAt(0)
                        )}
                      </div>
                      <span className={styles.statusDot} style={{background: status.color}} />
                    </div>
                    <div className={styles.convInfo}>
                      <span className={styles.name}>{conv.full_name}</span>
                      <span className={styles.type} style={{color: status.color}}>{status.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className={styles.chatArea}>
          {activeChat ? (
            <>
              <header className={styles.chatHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setActiveChat(null)}
                  aria-label="Mesaj listesine dön"
                >
                  ←
                </button>
                <div className={styles.activeUser}>
                  <div className={styles.smallAvatar}>
                    {activeChat.avatar_url ? (
                      <Image src={activeChat.avatar_url} fill alt={activeChat.full_name} style={{objectFit: 'cover', borderRadius: '50%'}} />
                    ) : (
                      activeChat.full_name?.charAt(0)
                    )}
                  </div>
                  <div className={styles.headerInfo}>
                    <h4>{activeChat.full_name}</h4>
                    <span style={{color: getStatus(presenceMap, activeChat.id).color}}>
                      {getStatus(presenceMap, activeChat.id).label}
                    </span>
                  </div>
                </div>
                <Link href={`/profil/${activeChat.id}`} className={styles.viewProfile}>Profili Gör</Link>
              </header>

              <div className={styles.messages}>
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`${styles.msgWrapper} ${msg.sender_id === user.id ? styles.msgMe : styles.msgOther}`}>
                    <div className={styles.msgBubble}>
                      {msg.content}
                    </div>
                    <span className={styles.time}>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className={styles.inputArea} onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Mesaj yaz..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-primary">Gönder</button>
              </form>
            </>
          ) : (
            <div className={styles.noChat}>
              <IconChat size={64} />
              <h3>Sohbete Başla</h3>
              <p>Bir arkadaşını seçerek mesajlaşmaya başlayabilirsin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
