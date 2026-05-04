'use client';

import styles from './telsiz.module.css';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { Message, Profile } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';
import { IconRadio, IconSOS, IconUser, IconChat, IconHeart } from '@/components/Icons';

export default function TelsizPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [activeChannel, setActiveChannel] = useState('Kamp 1');
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateUser, setPrivateUser] = useState<Pick<Profile, 'id' | 'full_name' | 'caravan_type'> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Pick<Profile, 'id' | 'full_name' | 'caravan_type'>[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [pendingReceived, setPendingReceived] = useState<{ id: string; senderId: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<Array<Pick<Profile, 'id' | 'full_name' | 'caravan_type'> & { distance_km: number }>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [nudgeAlert, setNudgeAlert] = useState<string | null>(null);

  const channels = ['Kamp 1', 'Mekanik & Arıza', 'Alım-Satım', 'Geyik', 'Acil Durum'];

  // Two UUIDs → deterministic, collision-free DM channel id (lexicographic order)
  const dmChannelId = (a: string, b: string) => {
    const [x, y] = [a, b].sort();
    return `dm_${x}_${y}`;
  };

  // Initialize Auth & Data
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, caravan_type');
    if (data) setAllUsers(data);
  };

  const fetchFriendships = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (data) {
      setAcceptedFriends(data.filter(f => f.status === 'accepted').map(f => f.user_id === user.id ? f.friend_id : f.user_id));
      setPendingSent(data.filter(f => f.status === 'pending' && f.user_id === user.id).map(f => f.friend_id));
      setPendingReceived(data.filter(f => f.status === 'pending' && f.friend_id === user.id).map(f => ({ id: f.id, senderId: f.user_id })));
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriendships();
      updateUserLocation();
    }
  }, [user]);

  const updateUserLocation = async () => {
    if (!navigator.geolocation || !user) return;
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      // Update last_location in DB
      await supabase.from('profiles').update({
        last_location: `POINT(${longitude} ${latitude})`
      }).eq('id', user.id);

      // Fetch nearby neighbors
      const { data, error } = await supabase.rpc('get_nearby_neighbors', {
        p_user_id: user.id,
        p_lat: latitude,
        p_lng: longitude,
        p_radius_km: 50
      });

      if (data) setNearbyUsers(data);
    });
  };

  // Presence & Nudge Channel
  useEffect(() => {
    const presenceId = user?.id || `guest_${Math.random().toString(36).substring(7)}`;
    const roomOne = supabase.channel('online-users', {
      config: {
        presence: { key: presenceId },
      },
    });

    roomOne
      .on('presence', { event: 'sync' }, () => {
        const newState = roomOne.presenceState();
        const onlineIds = Object.keys(newState);
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomOne.track({ online_at: new Date().toISOString(), is_guest: !user });
        }
      });

    let nudgeChannel: any = null;
    if (user) {
      nudgeChannel = supabase.channel(`nudge_${user.id}`);
      nudgeChannel
        .on('broadcast', { event: 'nudge' }, (payload: any) => {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          showToast(`${payload.payload.fromName} seni dürttü! 👉`, "info");
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(roomOne);
      if (nudgeChannel) supabase.removeChannel(nudgeChannel);
    };
  }, [user]);

  // Fetch Messages based on channel
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        let query = supabase
          .from('messages')
          .select(`*, profiles (full_name, current_status, is_verified)`)
          .gt('created_at', thirtyMinutesAgo);
        
        if (isPrivate && privateUser && user) {
          query = query.eq('channel', dmChannelId(user.id, privateUser.id));
        } else {
          query = query.eq('channel', activeChannel);
        }

        await supabase.from('messages').delete().lt('created_at', thirtyMinutesAgo);

        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (error) {
          console.error("Messages fetch error details:", error);
          setMessages([]);
        } else if (data) {
          const thirtyMins = 30 * 60 * 1000;
          const now = Date.now();
          const filtered = data.filter(msg => Math.abs(now - new Date(msg.created_at).getTime()) < thirtyMins);
          setMessages(filtered);
        }
      } catch (err) {
        console.error("Unexpected error in fetchMessages:", err);
      }
    };

    fetchMessages();

    let currentChannelName = activeChannel;
    if (isPrivate && privateUser && user) {
      currentChannelName = dmChannelId(user.id, privateUser.id);
    }

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel=eq.${currentChannelName}`
      }, async (payload) => {
        const now = Date.now();
        const thirtyMins = 30 * 60 * 1000;
        if ((now - new Date(payload.new.created_at).getTime()) > thirtyMins) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single();
          
        const newMsg = { ...payload.new, profiles: profileData } as Message;
        setMessages((prev) => {
          const updated = [...prev, newMsg].filter(m => (now - new Date(m.created_at).getTime()) < thirtyMins);
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChannel, isPrivate, privateUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent, overrideText?: string, overrideChannel?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || newMessage.trim();
    
    if (!textToSend || !user) return;

    let targetChannel = overrideChannel || activeChannel;
    
    if (!overrideChannel && isPrivate && privateUser) {
      targetChannel = dmChannelId(user.id, privateUser.id);
    }

    const { error } = await supabase.from('messages').insert([
      {
        user_id: user.id,
        channel: targetChannel,
        text: textToSend,
      }
    ]);

    if (!error && !overrideText) {
      setNewMessage('');
    } else if (error) {
      showToast("Mesaj gönderilemedi.", "error");
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return showToast("Giriş yapmalısınız!", "warning");
    const { error } = await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: friendId, status: 'pending' }
    ]);
    if (!error) {
      setPendingSent(prev => [...prev, friendId]);
      showToast("Arkadaşlık isteği gönderildi!", "success");
    } else if (error.code === '23505') {
      showToast("İstek zaten gönderilmiş.", "info");
    } else {
      showToast("Gönderilemedi: " + error.message, "error");
    }
  };

  const handleAcceptFriend = async (rowId: string, senderId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', rowId);
    if (!error) {
      setAcceptedFriends(prev => [...prev, senderId]);
      setPendingReceived(prev => prev.filter(r => r.id !== rowId));
      showToast("Arkadaşlık kabul edildi!", "success");
    }
  };

  const handleRejectFriend = async (rowId: string) => {
    await supabase.from('friendships').delete().eq('id', rowId);
    setPendingReceived(prev => prev.filter(r => r.id !== rowId));
    showToast("İstek reddedildi.", "info");
  };

  const handleNudge = async () => {
    if (!user || !privateUser) return;
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    const myName = allUsers.find(u => u.id === user.id)?.full_name || 'Bir komşun';
    const channel = supabase.channel(`nudge_${privateUser.id}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'nudge',
      payload: { fromName: myName },
    });
    
    sendMessage(undefined, "👉 DÜRTÜYOR...");
    showToast(`${privateUser.full_name} dürtüldü!`, "success");
  };

  const handleSOS = () => {
    if (!user) return showToast("Lütfen giriş yapın.", "warning");
    
    const issue = prompt("Acil durumunuzu kısaca açıklayın (Örn: Çamura saplandım, Çekici lazım):");
    if (!issue) return; 
    
    setIsPrivate(false);
    setActiveChannel('Acil Durum');
    sendMessage(undefined, `🚨 ACİL DURUM: ${issue} | Konum: Yaklaşık konum tespit edildi.`, 'Acil Durum');
    showToast("SOS Bildirimi Gönderildi!", "error");
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} ref={scrollRef}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <IconRadio size={32} color="var(--forest-green)" />
          <h2>Telsiz</h2>
        </div>
        
        <div className={styles.channelList}>
          <h3>Frekanslar</h3>
          {channels.map((ch) => (
            <button 
              key={ch}
              className={`${styles.channelBtn} ${!isPrivate && activeChannel === ch ? styles.activeChannel : ''}`}
              onClick={() => { setIsPrivate(false); setActiveChannel(ch); }}
            >
              <span style={{opacity: 0.5}}>#</span> {ch}
            </button>
          ))}
          
          {/* Gelen arkadaşlık istekleri */}
          {pendingReceived.length > 0 && (
            <>
              <h3 className={styles.mt20}>📨 Gelen İstekler</h3>
              <div className={styles.friendsList}>
                {pendingReceived.map(req => {
                  const sender = allUsers.find(u => u.id === req.senderId);
                  if (!sender) return null;
                  return (
                    <div key={req.id} className={styles.friendCard}>
                      <div className={styles.friendInfo}>
                        <div className={styles.avatarWrap}>
                          <div className={styles.avatar}>{(sender.full_name || 'K').charAt(0)}</div>
                        </div>
                        <div className={styles.friendDetails}>
                          <span className={styles.friendName}>{sender.full_name || 'Gizli Karavancı'}</span>
                          <span className={styles.friendType}>{sender.caravan_type || 'Bilinmiyor'}</span>
                        </div>
                      </div>
                      <div className={styles.friendActions}>
                        <button className={styles.acceptBtn} onClick={() => handleAcceptFriend(req.id, req.senderId)} title="Kabul et">✓</button>
                        <button className={styles.rejectBtn} onClick={() => handleRejectFriend(req.id)} title="Reddet">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <h3 className={styles.mt20}>Karavancılar</h3>
          <div className={styles.friendsList}>
            {allUsers
              .filter(u => u.id !== user?.id)
              .map(u => {
                const isOnline = onlineUsers.includes(u.id);
                const isAccepted = acceptedFriends.includes(u.id);
                const isPending = pendingSent.includes(u.id);
                const isIncoming = pendingReceived.some(r => r.senderId === u.id);

              return (
                <div key={u.id} className={`${styles.friendCard} ${isPrivate && privateUser?.id === u.id ? styles.activeFriend : ''}`}>
                  <div className={styles.friendInfo} onClick={() => { if (isAccepted) { setIsPrivate(true); setPrivateUser(u); } }}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatar}>{(u.full_name || 'K').charAt(0)}</div>
                      <div className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}></div>
                    </div>
                    <div className={styles.friendDetails}>
                      <span className={styles.friendName}>{u.full_name || 'Gizli Karavancı'}</span>
                      <span className={styles.friendType}>{u.caravan_type || 'Bilinmiyor'}</span>
                    </div>
                  </div>

                  {isAccepted ? (
                    <div className={styles.friendActions}>
                      <button title="Telsizde Mesajlaş" onClick={() => { setIsPrivate(true); setPrivateUser(u); }}>
                        <IconChat size={16} />
                      </button>
                      <Link href={`/mesajlar/${u.id}`} title="Kalıcı DM" className={styles.dmLink}>💬</Link>
                    </div>
                  ) : isPending || isIncoming ? (
                    <span className={styles.pendingBadge}>{isIncoming ? '📨 Geldi' : '⏳ Bekliyor'}</span>
                  ) : (
                    <button className={styles.addFriendBtn} onClick={() => handleAddFriend(u.id)}>+ Ekle</button>
                  )}
                </div>
              );
            })}
          </div>

          {nearbyUsers.length > 0 && (
            <>
              <h3 className={styles.mt20}>📍 Yakındaki Komşular</h3>
              <div className={styles.friendsList}>
                {nearbyUsers.map(u => (
                  <div key={`nearby-${u.id}`} className={styles.friendCard}>
                    <div className={styles.friendInfo}>
                      <div className={styles.avatarWrap}>
                        <div className={styles.avatar}>{(u.full_name || 'K').charAt(0)}</div>
                        <div className={styles.distanceBadge}>{u.distance_km.toFixed(1)} km</div>
                      </div>
                      <div className={styles.friendDetails}>
                        <span className={styles.friendName}>{u.full_name || 'Gizli Karavancı'}</span>
                        <span className={styles.friendType}>{u.caravan_type || 'Bilinmiyor'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      <main className={styles.chatArea}>
        <div className={styles.chatHeader}>
          {isPrivate && privateUser ? (
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <h3>🔒 {privateUser.full_name}</h3>
              <button className={styles.nudgeButton} onClick={handleNudge}>👉 Dürt</button>
            </div>
          ) : (
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <span className="pulse-dot"></span>
              <h3># {activeChannel}</h3>
            </div>
          )}
          
          {!isPrivate && (
            <button className={styles.sosButton} onClick={handleSOS}>
              <IconSOS size={18} color="white" /> SOS Bildir
            </button>
          )}
        </div>

        <div className={styles.messagesContainer}>
          <div className={styles.dateSeparator}>{isPrivate ? 'Özel Yazışma' : 'Canlı Yayın Aktif'}</div>
          
          {messages
            .filter(msg => {
              const text = msg.text.toLowerCase();
              if (text === 'aaa' || text === 'aaaaaaaaa') return false;
              const now = Date.now();
              const thirtyMins = 30 * 60 * 1000;
              return Math.abs(now - new Date(msg.created_at).getTime()) < thirtyMins;
            })
            .map((msg) => {
            const isMe = user?.id === msg.user_id;
            const senderName = isMe ? 'Sen' : (msg.profiles?.full_name || 'Gizli Karavancı');
            const isSOS = msg.text.includes('🚨 ACİL DURUM');
            const isNudge = msg.text === "👉 DÜRTÜYOR...";
            
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.messageMe : styles.messageOther}`}>
                {!isMe && (
                  <div className={styles.avatar} style={{width: '32px', height: '32px', fontSize: '0.8rem'}}>
                    {senderName.charAt(0)}
                  </div>
                )}
                <div className={styles.messageContent}>
                  {!isMe && (
                    <span className={styles.senderName}>
                      {senderName}
                      {msg.profiles?.is_verified && <span className="badge badge-verified" style={{padding: '1px 6px', fontSize: '0.6rem'}}>✓</span>}
                    </span>
                  )}
                  <div 
                    className={`${styles.messageBubble} ${isSOS ? styles.sosBubble : ''} ${isNudge ? styles.nudgeBubble : ''} glass-card`}
                  >
                    {msg.text}
                  </div>
                  <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          {user ? (
            <form onSubmit={sendMessage} className={styles.chatForm}>
              <input 
                type="text" 
                placeholder={isPrivate ? "Özel mesaj yaz..." : "Telsize anons geç..."}
                className={styles.messageInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Gönder
              </button>
            </form>
          ) : (
            <div className={styles.loginPrompt}>
              Mesaj yazabilmek için lütfen <Link href="/gunluk">Giriş Yapın</Link>.
            </div>
          )}
        </div>
        
        <div className={styles.diagnostic}>
          <span className="pulse-dot" style={{width: '6px', height: '6px'}}></span>
          STRICT EPHEMERAL v2.1 • ONLINE: {onlineUsers.length}
        </div>
      </main>
    </div>
  );
}
