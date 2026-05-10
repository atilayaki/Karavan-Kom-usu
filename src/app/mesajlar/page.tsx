'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './mesajlar.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { IconChat } from '@/components/Icons';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { DirectMessage } from '@/lib/database.types';

type PresenceStatus = 'online' | 'busy';

function getStatus(presenceMap: Record<string, PresenceStatus>, userId: string) {
  const s = presenceMap[userId];
  if (s === 'online') return { label: 'Çevrimiçi', color: '#44b700' };
  if (s === 'busy') return { label: 'Meşgul', color: '#f59e0b' };
  return { label: 'Çevrimdışı', color: '#6b7280' };
}

export default function MesajlarPage() {
  const { showToast } = useToast();
  useAuth({ requireAuth: true });
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);
  const inboxChannelRef = useRef<any>(null);
  const activeChatRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const dmWrapperRef = useRef<HTMLDivElement>(null);
  activeChatRef.current = activeChat;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      userRef.current = user;
      setUser(user);
      if (user) {
        fetchConversations(user.id);
        setupPresence(user.id);
        setupInbox(user.id);
      }
    });

    const handleVisibility = () => {
      if (!document.hidden && activeChatRef.current && userRef.current) {
        fetchMessages(activeChatRef.current.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
      if (inboxChannelRef.current) supabase.removeChannel(inboxChannelRef.current);
    };
  }, []);

  // Mobile chat fullscreen: lock the page and size the chat to the visible viewport
  // so the input always sits right above the keyboard (Instagram DM behaviour).
  useEffect(() => {
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    const update = () => {
      const el = dmWrapperRef.current;
      if (!el) return;
      const fullscreen = isMobile() && !!activeChatRef.current;
      if (fullscreen) {
        const vv = window.visualViewport;
        const h = vv?.height ?? window.innerHeight;
        const top = vv?.offsetTop ?? 0;
        el.style.height = `${h}px`;
        el.style.transform = top ? `translateY(${top}px)` : '';
        document.body.classList.add('mesajlar-fullscreen');
      } else {
        el.style.height = '';
        el.style.transform = '';
        document.body.classList.remove('mesajlar-fullscreen');
      }
    };

    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.body.classList.remove('mesajlar-fullscreen');
      if (dmWrapperRef.current) {
        dmWrapperRef.current.style.height = '';
        dmWrapperRef.current.style.transform = '';
      }
    };
  }, [activeChat]);

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

  const setupInbox = (userId: string) => {
    const channel = supabase
      .channel(`inbox_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${userId}`,
      }, (payload) => {
        const msg = payload.new as DirectMessage;
        if (activeChatRef.current && msg.sender_id === activeChatRef.current.id) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id);
            return exists ? prev : [...prev, msg];
          });
        }
      })
      .subscribe();

    inboxChannelRef.current = channel;
  };

  const fetchConversations = async (userId: string) => {
    setLoading(true);

    // 1) Onaylanmış arkadaşlar
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('*, sender:user_id(id, full_name, avatar_url, caravan_type), receiver:friend_id(id, full_name, avatar_url, caravan_type)')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    const fromFriends = (friendsData || []).map((f: any) => f.user_id === userId ? f.receiver : f.sender).filter(Boolean);

    // 2) DM partnerleri — pazaryerinden gelen mesajlar gibi arkadaş olmayan kişiler de listede görünsün
    const { data: dmRows } = await supabase
      .from('direct_messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    const partnerIds = new Set<string>();
    (dmRows || []).forEach((m: any) => {
      const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (other && other !== userId) partnerIds.add(other);
    });

    // Arkadaş listesinde olmayan partnerlerin profillerini getir
    const knownIds = new Set(fromFriends.map((p: any) => p.id));
    const missing = [...partnerIds].filter(pid => !knownIds.has(pid));
    let extraProfiles: any[] = [];
    if (missing.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, caravan_type')
        .in('id', missing);
      extraProfiles = profs || [];
    }

    // Birleştir, dedupe (id'ye göre)
    const merged = [...fromFriends, ...extraProfiles];
    const seen = new Set<string>();
    const deduped = merged.filter((p: any) => {
      if (!p?.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    setConversations(deduped);
    setLoading(false);
  };

  const fetchMessages = async (friendId: string) => {
    const uid = userRef.current?.id || user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${uid})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  useEffect(() => {
    if (activeChat && user) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeChat) return;

    const text = newMessage.trim();
    setNewMessage('');

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChat.id,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: user.id, receiver_id: activeChat.id, content: text })
      .select()
      .single();

    if (error) {
      showToast("Mesaj gönderilemedi.", "error");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      // Push notification to receiver (best-effort)
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeChat.id,
          title: `${user.user_metadata?.full_name || 'Komşun'} mesaj gönderdi`,
          body: text.length > 80 ? text.slice(0, 80) + '…' : text,
          url: `/mesajlar`,
        }),
      }).catch(() => {});
    }
  };

  if (!user) return <div className={styles.loginPrompt}>Mesajlarınızı görmek için lütfen giriş yapın.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      
      <div
        ref={dmWrapperRef}
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
