'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './etkinlikler.module.css';
import { useToast } from '@/components/Toast';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { IconCalendar, IconMap, IconUser, IconRadio } from '@/components/Icons';

export default function EtkinliklerPage() {
  const { showToast } = useToast();
  const scrollRef = useScrollReveal();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newCat, setNewCat] = useState('Kamp');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(full_name, avatar_url), event_attendees(count)')
      .order('event_date', { ascending: true });
    
    if (data) setEvents(data);
    setLoading(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast('Lütfen giriş yapın.', 'warning');

    const { error } = await supabase.from('events').insert([
      {
        title: newTitle,
        description: newDesc,
        event_date: newDate,
        location_name: newLoc,
        category: newCat,
        created_by: user.id
      }
    ]);

    if (error) {
      showToast('Hata: ' + error.message, 'error');
    } else {
      showToast('Etkinlik oluşturuldu! +50 XP kazandın! 🎉', 'success');
      setShowCreateModal(false);
      fetchEvents();
    }
  };

  const handleJoinEvent = async (eventId: number) => {
    if (!user) return showToast('Lütfen giriş yapın.', 'warning');

    const { error } = await supabase.from('event_attendees').insert([
      { event_id: eventId, user_id: user.id }
    ]);

    if (error) {
      showToast('Zaten katıldın veya bir hata oluştu.', 'info');
    } else {
      showToast('Etkinliğe katıldın! Görüşmek üzere. 👋', 'success');
      fetchEvents();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} ref={scrollRef}>
      <header className={styles.header + " reveal"}>
        <div className={styles.headerInfo}>
          <h1>📅 Buluşmalar & Etkinlikler</h1>
          <p>Yoldaki komşularınla tanış, kamp ateşini birlikte yak.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Etkinlik Oluştur
        </button>
      </header>

      <div className={styles.grid}>
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="shimmer" style={{height: '300px', borderRadius: '24px'}}></div>)
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>Henüz planlanmış bir etkinlik yok. İlkini sen başlat!</div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className={styles.eventCard + " glass-card reveal"}>
              <div className={styles.eventCategory}>{ev.category}</div>
              <h3>{ev.title}</h3>
              <p className={styles.description}>{ev.description}</p>
              
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <IconCalendar size={18} />
                  <span>{formatDate(ev.event_date)}</span>
                </div>
                <div className={styles.detailItem}>
                  <IconMap size={18} />
                  <span>{ev.location_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <IconUser size={18} />
                  <span>{ev.event_attendees?.[0]?.count || 0} Katılımcı</span>
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.creator}>
                  <div className={styles.avatarMini}>
                    {ev.profiles?.avatar_url ? (
                      <img src={ev.profiles.avatar_url} alt="C" />
                    ) : (
                      (ev.profiles?.full_name || 'K').charAt(0)
                    )}
                  </div>
                  <span>{ev.profiles?.full_name || 'Bir Karavancı'}</span>
                </div>
                <button className={styles.joinBtn} onClick={() => handleJoinEvent(ev.id)}>
                  Katıl
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Etkinlik Başlat</h2>
            <form onSubmit={handleCreateEvent} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Başlık</label>
                <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Örn: Bolu Aladağlar Kampı" />
              </div>
              <div className={styles.inputGroup}>
                <label>Açıklama</label>
                <textarea required value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Neler yapacağız?" rows={3} />
              </div>
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Tarih & Saat</label>
                  <input required type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Kategori</label>
                  <select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                    <option value="Kamp">Kamp</option>
                    <option value="Buluşma">Buluşma</option>
                    <option value="Teknik Yardım">Teknik Yardım</option>
                    <option value="Konvoy">Konvoy</option>
                  </select>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Konum (Şehir/Mekan)</label>
                <input required value={newLoc} onChange={(e) => setNewLoc(e.target.value)} placeholder="Örn: Bolu, Aladağlar Göleti" />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn-ghost" onClick={() => setShowCreateModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">Yayınla (+50 XP)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
