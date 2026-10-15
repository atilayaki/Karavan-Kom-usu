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

const CHANNELS_CONFIG = [
  { name: 'Kamp 1',          code: 'CH 09', freq: '27.065 MHz', desc: 'Genel karavan buluşma ve çağrı kanalı' },
  { name: 'Mekanik & Arıza', code: 'CH 19', freq: '27.185 MHz', desc: 'Yol yardımı, tamir ve teknik destek' },
  { name: 'Alım-Satım',      code: 'CH 14', freq: '27.125 MHz', desc: 'İkinci el ekipman ve malzeme takası' },
  { name: 'Geyik',           code: 'CH 22', freq: '27.225 MHz', desc: 'Sohbet, rota anıları ve kahve muhabbeti' },
  { name: 'Acil Durum',      code: 'CH 16', freq: '27.155 MHz', desc: '🚨 Acil SOS ve kaza/kurtarma frekansı', isEmergency: true },
];

const QUICK_RADIO_CALLS = [
  '🚐 Komşular selam, herkese iyi yolculuklar!',
  '☕ Çay demlendi, yakınlardaki komşuları beklerim!',
  '💧 Burada temiz içme suyu çeşmesi faal durumda.',
  '🚧 İleride yol çalışması / dar viraj var, dikkat!',
  '🏕️ Bu koyda rüzgar kesildi, harika bir geceleme noktası.',
];

export default function TelsizPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [activeChannel, setActiveChannel] = useState('Kamp 1');
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateUser, setPrivateUser] = useState<Pick<Profile, 'id' | 'full_name' | 'caravan_type'> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Pick<Profile, 'id' | 'full_name' | 'caravan_type'>[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [pendingReceived, setPendingReceived] = useState<{ id: string; senderId: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<Array<Pick<Profile, 'id' | 'full_name' | 'caravan_type'> & { distance_km: number }>>([]);
  
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [sosReason, setSosReason] = useState('Akü Bitti / Marş Basmıyor');
  const [sosNote, setSosNote] = useState('');
  const [sosCoords, setSosCoords] = useState<{lat: number, lng: number} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Two UUIDs → deterministic, collision-free DM channel id
  const dmChannelId = (a: string, b: string) => {
    const [x, y] = [a, b].sort();
    return `dm_${x}_${y}`;
  };

  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const currentChannelInfo = CHANNELS_CONFIG.find(c => c.name === activeChannel) || CHANNELS_CONFIG[0];

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchAllProfiles();

    // Check URL params for channel
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ch = params.get('channel');
      if (ch && CHANNELS_CONFIG.some(c => c.name === ch)) {
        setActiveChannel(ch);
        setMobileView('chat');
      }
    }
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
      setSosCoords({ lat: latitude, lng: longitude });

      await supabase.from('profiles').update({
        last_location: `POINT(${longitude} ${latitude})`
      }).eq('id', user.id);

      const { data } = await supabase.rpc('get_nearby_neighbors', {
        p_user_id: user.id,
        p_lat: latitude,
        p_lng: longitude,
        p_radius_km: 50
      });

      if (data) setNearbyUsers(data);
    });
  };

  // Presence
  useEffect(() => {
    const presenceId = user?.id || `guest_${Math.random().toString(36).substring(7)}`;
    const roomOne = supabase.channel('online-users', {
      config: { presence: { key: presenceId } },
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

    return () => {
      supabase.removeChannel(roomOne);
    };
  }, [user]);

  // Messages fetch & realtime
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

        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (!error && data) {
          const thirtyMins = 30 * 60 * 1000;
          const now = Date.now();
          const filtered = data.filter(msg => Math.abs(now - new Date(msg.created_at).getTime()) < thirtyMins);
          setMessages(filtered);
        }
      } catch (err) {
        console.error("Messages fetch error:", err);
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

    setIsTransmitting(true);
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

    setIsTransmitting(false);

    if (!error && !overrideText) {
      setNewMessage('');
    } else if (error) {
      showToast("Mesaj iletilemedi: " + error.message, "error");
    }
  };

  const handleSendSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("SOS yayını için giriş yapmalısınız.", "warning");

    const locText = sosCoords ? `📍 Konum: ${sosCoords.lat.toFixed(4)}, ${sosCoords.lng.toFixed(4)}` : '📍 Konum: Paylaşılmadı';
    const text = `🚨 ACİL DURUM SOS: [${sosReason}] - ${sosNote || 'Açıklama girilmedi.'} | ${locText}`;

    setIsPrivate(false);
    setActiveChannel('Acil Durum');
    await sendMessage(undefined, text, 'Acil Durum');
    setIsSOSModalOpen(false);
    showToast("SOS Anonsu Kanal 16 Frekansına İletildi! 🚨", "error");
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return showToast("Giriş yapmalısınız!", "warning");
    const { error } = await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: friendId, status: 'pending' }
    ]);
    if (!error) {
      setPendingSent(prev => [...prev, friendId]);
      showToast("Komşuluk isteği iletildi!", "success");
    }
  };

  const handleAcceptFriend = async (rowId: string, senderId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', rowId);
    if (!error) {
      setAcceptedFriends(prev => [...prev, senderId]);
      setPendingReceived(prev => prev.filter(r => r.id !== rowId));
      showToast("Komşuluk kabul edildi! 🚐", "success");
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={styles.container}
      ref={scrollRef}
      data-mobile-view={mobileView}
    >
      {/* ─── Telsiz İstasyonu Sol Panel (Frekanslar & Komşular) ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.stationHeader}>
          <div className={styles.stationIconWrap}>
            <IconRadio size={24} color="#FF8C42" />
          </div>
          <div>
            <h2 className={styles.stationTitle}>Karavan Telsizi</h2>
            <p className={styles.stationSubtitle}>Halk Bandı (CB) Frekansları</p>
          </div>
        </div>

        <div className={styles.channelList}>
          <span className={styles.sectionHeading}>KANALLAR (FREKANSLAR)</span>
          {CHANNELS_CONFIG.map((ch) => {
            const isSelected = !isPrivate && activeChannel === ch.name;
            return (
              <button
                key={ch.name}
                className={`${styles.channelBtn} ${isSelected ? styles.activeChannel : ''} ${ch.isEmergency ? styles.emergencyChannelBtn : ''}`}
                onClick={() => {
                  setIsPrivate(false);
                  setActiveChannel(ch.name);
                  setMobileView('chat');
                }}
              >
                <div className={styles.channelBtnLeft}>
                  <span className={styles.channelCode}>{ch.code}</span>
                  <div className={styles.channelMeta}>
                    <span className={styles.channelName}>{ch.name}</span>
                    <span className={styles.channelFreq}>{ch.freq}</span>
                  </div>
                </div>
                {ch.isEmergency && <span className={styles.sosTag}>SOS</span>}
              </button>
            );
          })}

          {/* Gelen İstekler */}
          {pendingReceived.length > 0 && (
            <div className={styles.incomingSection}>
              <span className={styles.sectionHeading}>GELEN KOMŞULUK İSTEKLERİ</span>
              {pendingReceived.map(req => {
                const sender = allUsers.find(u => u.id === req.senderId);
                if (!sender) return null;
                return (
                  <div key={req.id} className={styles.friendCard}>
                    <div className={styles.friendInfo}>
                      <div className={styles.avatar}>{(sender.full_name || 'K').charAt(0)}</div>
                      <div className={styles.friendDetails}>
                        <span className={styles.friendName}>{sender.full_name}</span>
                        <span className={styles.friendType}>{sender.caravan_type || 'Gezgin'}</span>
                      </div>
                    </div>
                    <div className={styles.friendActions}>
                      <button className={styles.acceptBtn} onClick={() => handleAcceptFriend(req.id, req.senderId)}>✓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Çevredeki Komşular */}
          <span className={styles.sectionHeading}>ÇEVREDEKİ KOMŞULAR ({onlineUsers.length} CANLI)</span>
          <div className={styles.friendsList}>
            {allUsers
              .filter(u => u.id !== user?.id && onlineUsers.includes(u.id))
              .map(u => {
                const isAccepted = acceptedFriends.includes(u.id);
                const isPending = pendingSent.includes(u.id);

                return (
                  <div key={u.id} className={`${styles.friendCard} ${isPrivate && privateUser?.id === u.id ? styles.activeFriend : ''}`}>
                    <Link href={`/profil/${u.id}`} className={styles.friendInfo}>
                      <div className={styles.avatarWrap}>
                        <div className={styles.avatar}>{(u.full_name || 'K').charAt(0)}</div>
                        <div className={styles.onlineDot}></div>
                      </div>
                      <div className={styles.friendDetails}>
                        <span className={styles.friendName}>{u.full_name || 'Gizli Karavancı'}</span>
                        <span className={styles.friendType}>{u.caravan_type || 'Gezgin'}</span>
                      </div>
                    </Link>

                    {isAccepted ? (
                      <button
                        className={styles.dmActionBtn}
                        title="Telsiz Özel Hat"
                        onClick={() => { setIsPrivate(true); setPrivateUser(u); setMobileView('chat'); }}
                      >
                        <IconChat size={16} />
                      </button>
                    ) : isPending ? (
                      <span className={styles.pendingBadge}>Bekliyor</span>
                    ) : (
                      <button className={styles.addFriendBtn} onClick={() => handleAddFriend(u.id)}>+ Ekle</button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </aside>

      {/* ─── Telsiz İletişim Alanı (CB Radio Cockpit) ─── */}
      <main className={styles.chatArea}>
        {/* CB Radio Display Panel */}
        <div className={styles.cbDisplayPanel}>
          <div className={styles.cbDisplayTop}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setMobileView('list')}
              aria-label="Frekans Listesi"
            >
              ← Kanallar
            </button>

            <div className={styles.lcdScreen}>
              <div className={styles.lcdHeader}>
                <span className={styles.lcdStatusDot}></span>
                <span className={styles.lcdMode}>RX / ÇEVRİMİÇİ</span>
                <span className={styles.lcdSignal}>SIG: ▂▄▆█</span>
              </div>
              <div className={styles.lcdMain}>
                <div className={styles.lcdChannelCode}>
                  {isPrivate ? 'PRIVATE' : currentChannelInfo.code}
                </div>
                <div className={styles.lcdFreq}>
                  {isPrivate && privateUser ? privateUser.full_name : currentChannelInfo.freq}
                </div>
              </div>
              <div className={styles.lcdDesc}>
                {isPrivate ? 'Birebir Güvenli Görüşme' : currentChannelInfo.desc}
              </div>
            </div>

            <button className={styles.sosTriggerBtn} onClick={() => setIsSOSModalOpen(true)}>
              <span className={styles.sosBeacon}></span>
              🚨 SOS
            </button>
          </div>
        </div>

        {/* Hızlı Anons Çipleri */}
        {!isPrivate && (
          <div className={styles.quickCuesBar}>
            <span className={styles.quickCuesLabel}>Hızlı Anons:</span>
            {QUICK_RADIO_CALLS.map((cue, idx) => (
              <button
                key={idx}
                className={styles.quickCueBtn}
                onClick={() => {
                  if (!user) return showToast("Anons geçmek için giriş yapmalısınız.", "warning");
                  sendMessage(undefined, cue);
                }}
              >
                {cue}
              </button>
            ))}
          </div>
        )}

        {/* Mesaj Akışı */}
        <div className={styles.messagesContainer}>
          <div className={styles.ephemeralNotice}>
            ⚡ Telsiz anonsları ephemeral olup 30 dakika sonra otomatik olarak havadan silinir.
          </div>

          {messages.length === 0 ? (
            <div className={styles.emptyMessages}>
              <span style={{ fontSize: '2.5rem' }}>📻</span>
              <p>Frekans şu an sakin. İlk anonsu sen geç komşu!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = user?.id === msg.user_id;
              const senderName = isMe ? 'Sen' : (msg.profiles?.full_name || 'Gizli Karavancı');
              const isSOS = msg.text.includes('🚨 ACİL DURUM');

              return (
                <div
                  key={msg.id}
                  className={`${styles.messageWrapper} ${isMe ? styles.messageMe : styles.messageOther}`}
                >
                  {!isMe && (
                    <div className={styles.avatar}>
                      {senderName.charAt(0)}
                    </div>
                  )}
                  <div className={styles.messageContent}>
                    {!isMe && (
                      <span className={styles.senderName}>
                        {senderName}
                        {msg.profiles?.is_verified && <span className={styles.verifiedTag}>✓</span>}
                      </span>
                    )}
                    <div className={`${styles.messageBubble} ${isSOS ? styles.sosBubble : ''}`}>
                      {msg.text}
                    </div>
                    <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Telsiz PTT Mesaj Gönderme Kutusu */}
        <div className={styles.inputArea}>
          {user ? (
            <form onSubmit={sendMessage} className={styles.chatForm}>
              <input
                type="text"
                placeholder={isPrivate ? "Özel telsiz mesajı yaz..." : `${currentChannelInfo.name} frekansına anons geç...`}
                className={styles.messageInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className={`${styles.pttButton} ${isTransmitting ? styles.pttActive : ''}`}
                disabled={!newMessage.trim()}
              >
                <span className={styles.pttMic}>🎙️</span>
                <span>{isTransmitting ? 'İLETİLİYOR...' : 'ANONS GEÇ'}</span>
              </button>
            </form>
          ) : (
            <div className={styles.loginPrompt}>
              Telsiz mandalına basabilmek için lütfen <Link href="/gunluk">Giriş Yapın</Link>.
            </div>
          )}
        </div>
      </main>

      {/* ─── Acil Durum SOS Modalı ─── */}
      {isSOSModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsSOSModalOpen(false)}>
          <div className={styles.sosModal} onClick={e => e.stopPropagation()}>
            <div className={styles.sosModalHeader}>
              <span className={styles.sosAlertIcon}>🚨</span>
              <div>
                <h3>Acil Durum (SOS) Bildirisi</h3>
                <p>Kanal 16 acil durum frekansına anında anons düşer</p>
              </div>
            </div>

            <form onSubmit={handleSendSOS}>
              <div className={styles.formGroup}>
                <label>Arıza / Acil Durum Tipi</label>
                <select value={sosReason} onChange={e => setSosReason(e.target.value)}>
                  <option value="Akü Bitti / Marş Basmıyor">⚡ Akü Bitti / Marş Basmıyor</option>
                  <option value="Çamura / Kuma Saplandım">🚜 Çamura / Kuma Saplandım (Çekme Lazım)</option>
                  <option value="Lastik Patladı / Stepne Yok">🔵 Lastik Patladı / Stepne Yok</option>
                  <option value="Su / Yakıt Bitti">💧 Yakıt / Temiz Su Tükendi</option>
                  <option value="Medikal / Sağlık Acili">🩺 Medikal / Sağlık Desteği</option>
                  <option value="Diğer Acil Durum">⚠️ Diğer Acil Durum</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Durum Detayı & Konum Notu</label>
                <textarea
                  rows={3}
                  placeholder="Hangi mevkidesiniz? Yol durumu nedir? Örn: Antalya-Kumluca sahil yolu 12. km, beyaz Ducato karavan..."
                  value={sosNote}
                  onChange={e => setSosNote(e.target.value)}
                />
              </div>

              <div className={styles.coordsNotice}>
                {sosCoords ? (
                  <span>📍 GPS Koordinatınız hazır: {sosCoords.lat.toFixed(4)}, {sosCoords.lng.toFixed(4)}</span>
                ) : (
                  <span>📍 GPS tespiti bekleniyor veya tarayıcı izni kapalı</span>
                )}
              </div>

              <div className={styles.modalButtons}>
                <button type="button" className="btn-ghost" onClick={() => setIsSOSModalOpen(false)}>
                  Vazgeç
                </button>
                <button type="submit" className={styles.sosSubmitBtn}>
                  🚨 SOS YAYININI BAŞLAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
