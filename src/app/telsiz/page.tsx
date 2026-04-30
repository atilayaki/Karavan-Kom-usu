'use client';

import styles from './telsiz.module.css';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TelsizPage() {
  const [activeChannel, setActiveChannel] = useState('Kamp 1');
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateUser, setPrivateUser] = useState<any>(null); // For DMs
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [user, setUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [nudgeAlert, setNudgeAlert] = useState<string | null>(null);

  const channels = ['Kamp 1', 'Mekanik & Arıza', 'Alım-Satım', 'Geyik', 'Acil Durum'];

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
      // Map friendships to get a clean list of friend IDs
      const friends = data.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      setFriendships(friends);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriendships();
    }
  }, [user]);

  // Presence & Nudge Channel
  useEffect(() => {
    if (!user) return;

    // Presence Channel
    const roomOne = supabase.channel('online-users', {
      config: {
        presence: { key: user.id },
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
          await roomOne.track({ online_at: new Date().toISOString() });
        }
      });

    // Nudge (Broadcast) Channel
    const nudgeChannel = supabase.channel(`nudge_${user.id}`);
    nudgeChannel
      .on('broadcast', { event: 'nudge' }, (payload) => {
        // Trigger vibration
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        setNudgeAlert(`${payload.payload.fromName} seni dürttü! 👉`);
        setTimeout(() => setNudgeAlert(null), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomOne);
      supabase.removeChannel(nudgeChannel);
    };
  }, [user]);

  // Fetch Messages based on channel
  useEffect(() => {
    const fetchMessages = async () => {
      let query = supabase.from('messages').select(`*, profiles (full_name)`);
      
      if (isPrivate && privateUser && user) {
        // Build private channel ID consistently
        const p1 = Math.min(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        const p2 = Math.max(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        const dmChannel = `dm_${p1}_${p2}`;
        query = query.eq('channel', dmChannel);
      } else {
        query = query.eq('channel', activeChannel);
      }

      const { data } = await query.order('created_at', { ascending: true }).limit(50);
      if (data) setMessages(data);
    };

    fetchMessages();

    // Determine current channel name for subscription
    let currentChannelName = activeChannel;
    if (isPrivate && privateUser && user) {
        const p1 = Math.min(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        const p2 = Math.max(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        currentChannelName = `dm_${p1}_${p2}`;
    }

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel=eq.${currentChannelName}`
      }, async (payload) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single();
          
        const newMsg = { ...payload.new, profiles: profileData };
        setMessages((prev) => [...prev, newMsg]);
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
        const p1 = Math.min(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        const p2 = Math.max(parseInt(user.id.replace(/-/g,'').substring(0,8), 16), parseInt(privateUser.id.replace(/-/g,'').substring(0,8), 16));
        targetChannel = `dm_${p1}_${p2}`;
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
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return alert("Giriş yapmalısınız!");
    const { error } = await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: friendId }
    ]);
    if (!error) {
      setFriendships([...friendships, friendId]);
    }
  };

  const handleNudge = async () => {
    if (!user || !privateUser) return;
    if (navigator.vibrate) {
      navigator.vibrate(100); // tactile feedback for the sender
    }
    
    const myName = allUsers.find(u => u.id === user.id)?.full_name || 'Bir komşun';
    const channel = supabase.channel(`nudge_${privateUser.id}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'nudge',
      payload: { fromName: myName },
    });
    
    // Also send a special message in the chat
    sendMessage(undefined, "👉 DÜRTÜYOR...");
  };

  const handleSOS = () => {
    if (!user) {
      alert("Acil durum bildirimi yapabilmek için lütfen giriş yapın.");
      return;
    }
    const issue = prompt("Acil durumunuzu kısaca açıklayın (Örn: Çamura saplandım, Çekici lazım):");
    if (!issue) return; 
    
    setIsPrivate(false);
    setActiveChannel('Acil Durum');
    sendMessage(undefined, `🚨 ACİL DURUM: ${issue} | Konum: Yaklaşık konum tespit edildi.`, 'Acil Durum');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      {nudgeAlert && (
        <div className={styles.nudgeAlert}>
          {nudgeAlert}
        </div>
      )}

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>📻 Telsiz</h2>
        </div>
        
        <div className={styles.channelList}>
          <h3>Frekanslar</h3>
          {channels.map((ch) => (
            <button 
              key={ch}
              className={`${styles.channelBtn} ${!isPrivate && activeChannel === ch ? styles.activeChannel : ''}`}
              onClick={() => { setIsPrivate(false); setActiveChannel(ch); }}
            >
              # {ch}
            </button>
          ))}
          
          <h3 className={styles.mt20}>Karavancılar</h3>
          <div className={styles.friendsList}>
            {allUsers.filter(u => u.id !== user?.id).map(u => {
              const isOnline = onlineUsers.includes(u.id);
              const isFriend = friendships.includes(u.id);

              return (
                <div key={u.id} className={`${styles.friendCard} ${isPrivate && privateUser?.id === u.id ? styles.activeFriend : ''}`}>
                  <div className={styles.friendInfo} onClick={() => { if(isFriend) { setIsPrivate(true); setPrivateUser(u); } }}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatar}>{(u.full_name || 'K').charAt(0)}</div>
                      <div className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}></div>
                    </div>
                    <div className={styles.friendDetails}>
                      <span className={styles.friendName}>{u.full_name || 'Gizli Karavancı'}</span>
                      <span className={styles.friendType}>{u.caravan_type || 'Bilinmiyor'}</span>
                    </div>
                  </div>
                  
                  {!isFriend ? (
                    <button className={styles.addFriendBtn} onClick={() => handleAddFriend(u.id)}>+ Ekle</button>
                  ) : (
                    <div className={styles.friendActions}>
                      <button title="Mesaj Gönder" onClick={() => { setIsPrivate(true); setPrivateUser(u); }}>💬</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            <h3># {activeChannel}</h3>
          )}
          
          {!isPrivate && <button className={styles.sosButton} onClick={handleSOS}>🚨 Acil Durum Bildir</button>}
        </div>

        <div className={styles.messagesContainer}>
          <div className={styles.dateSeparator}>{isPrivate ? 'Özel Yazışma' : 'Canlı Yayın Aktif'}</div>
          
          {messages.map((msg) => {
            const isMe = user?.id === msg.user_id;
            const senderName = isMe ? 'Sen' : (msg.profiles?.full_name || 'Gizli Karavancı');
            const isSOS = msg.text.includes('🚨 ACİL DURUM');
            const isNudge = msg.text === "👉 DÜRTÜYOR...";
            
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.messageMe : styles.messageOther}`}>
                {!isMe && <div className={styles.avatar}>{senderName.charAt(0)}</div>}
                <div className={styles.messageContent}>
                  {!isMe && <span className={styles.senderName}>{senderName}</span>}
                  <div 
                    className={`${styles.messageBubble} ${isNudge ? styles.nudgeBubble : ''}`} 
                    style={isSOS ? { border: '2px solid red', background: 'rgba(255,0,0,0.1)' } : {}}
                  >
                    {isSOS || isNudge ? <strong>{msg.text}</strong> : msg.text}
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
            <form onSubmit={sendMessage} style={{ display: 'flex', width: '100%', gap: '12px' }}>
              <input 
                type="text" 
                placeholder={isPrivate ? "Özel mesaj yaz..." : "Telsize anons geç..."}
                className={styles.messageInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className={styles.sendButton + " btn-primary"}>
                Gönder
              </button>
            </form>
          ) : (
            <div style={{width: '100%', textAlign: 'center', padding: '10px'}}>
              Mesaj yazabilmek için lütfen <Link href="/gunluk" style={{color: 'var(--sunset-orange)', fontWeight: 'bold'}}>Giriş Yapın</Link>.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
