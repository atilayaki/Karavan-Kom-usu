'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './bakim.module.css';

const CATEGORIES = ['Yağ & Filtre', 'Lastik', 'Fren', 'Akü', 'Solar Panel', 'Su Tankı', 'Isıtma', 'Elektrik', 'Motor', 'Genel'];
const CATEGORY_ICONS: Record<string, string> = {
  'Yağ & Filtre': '🛢️', 'Lastik': '🔵', 'Fren': '🔴', 'Akü': '⚡',
  'Solar Panel': '☀️', 'Su Tankı': '💧', 'Isıtma': '🔥', 'Elektrik': '🔌',
  'Motor': '⚙️', 'Genel': '🔧',
};

interface Log {
  id: number;
  category: string;
  title: string;
  date: string;
  cost: number | null;
  odometer_km: number | null;
  notes: string | null;
  next_due_date: string | null;
}

const EMPTY: Omit<Log, 'id'> = {
  category: 'Genel', title: '', date: new Date().toISOString().slice(0, 10),
  cost: null, odometer_km: null, notes: null, next_due_date: null,
};

export default function BakimPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Hepsi');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) fetchLogs(uid);
      else setLoading(false);
    });
  }, []);

  async function fetchLogs(uid: string) {
    const { data } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    setLogs((data as Log[]) || []);
    setLoading(false);
  }

  async function save() {
    if (!userId || !form.title.trim()) return;
    setSaving(true);
    await supabase.from('maintenance_logs').insert({
      user_id: userId,
      ...form,
      cost: form.cost || null,
      odometer_km: form.odometer_km || null,
      notes: form.notes?.trim() || null,
      next_due_date: form.next_due_date || null,
    });
    await fetchLogs(userId);
    setForm({ ...EMPTY });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteLog(id: number) {
    await supabase.from('maintenance_logs').delete().eq('id', id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = logs.filter(l => l.next_due_date && l.next_due_date >= today);
  const filtered = activeCategory === 'Hepsi' ? logs : logs.filter(l => l.category === activeCategory);

  if (!userId && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <p>Bakım takviminizi görmek için <Link href="/gunluk">giriş yapın</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>🔧 Bakım Takvimi</h1>
            <p className={styles.sub}>Karavanının servis ve bakım geçmişi</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Bakım Ekle</button>
        </div>

        {/* Summary cards */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard + ' glass-card'}>
            <span className={styles.summaryVal}>{logs.length}</span>
            <span className={styles.summaryLabel}>Toplam Kayıt</span>
          </div>
          <div className={styles.summaryCard + ' glass-card'}>
            <span className={styles.summaryVal}>{totalCost.toLocaleString('tr-TR')} ₺</span>
            <span className={styles.summaryLabel}>Toplam Masraf</span>
          </div>
          <div className={styles.summaryCard + ' glass-card'} style={{ borderColor: upcoming.length ? 'var(--sunset-orange)' : undefined }}>
            <span className={styles.summaryVal} style={{ color: upcoming.length ? 'var(--sunset-orange)' : undefined }}>{upcoming.length}</span>
            <span className={styles.summaryLabel}>Yaklaşan Bakım</span>
          </div>
        </div>

        {/* Upcoming reminders */}
        {upcoming.length > 0 && (
          <div className={styles.reminders + ' glass-card'}>
            <h3>⏰ Yaklaşan Bakımlar</h3>
            {upcoming.map(l => (
              <div key={l.id} className={styles.reminderRow}>
                <span>{CATEGORY_ICONS[l.category] || '🔧'} {l.title}</span>
                <span className={styles.reminderDate}>{new Date(l.next_due_date!).toLocaleDateString('tr-TR')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div className={styles.catFilter}>
          {['Hepsi', ...CATEGORIES].map(c => (
            <button
              key={c}
              className={`${styles.catBtn} ${activeCategory === c ? styles.catActive : ''}`}
              onClick={() => setActiveCategory(c)}
            >
              {CATEGORY_ICONS[c] || ''} {c}
            </button>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <div className={styles.form + ' glass-card'}>
            <h3>Yeni Bakım Kaydı</h3>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>Kategori</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label>Başlık *</label>
                <input
                  placeholder="Örn: Yağ değişimi"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className={styles.formField}>
                <label>Tarih *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className={styles.formField}>
                <label>Maliyet (₺)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.cost ?? ''}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className={styles.formField}>
                <label>Kilometre</label>
                <input
                  type="number"
                  placeholder="—"
                  value={form.odometer_km ?? ''}
                  onChange={e => setForm(f => ({ ...f, odometer_km: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className={styles.formField}>
                <label>Sonraki Bakım Tarihi</label>
                <input type="date" value={form.next_due_date ?? ''} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value || null }))} />
              </div>
              <div className={styles.formField + ' ' + styles.fullWidth}>
                <label>Notlar</label>
                <textarea
                  placeholder="Kullanılan parçalar, işçilik, uyarılar..."
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
              <button className="btn-primary" onClick={save} disabled={!form.title.trim() || saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* Log list */}
        {loading && <p className={styles.center}>Yükleniyor...</p>}
        {!loading && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span>🔧</span>
            <p>{activeCategory === 'Hepsi' ? 'Henüz bakım kaydı yok.' : `${activeCategory} kategorisinde kayıt yok.`}</p>
          </div>
        )}

        <div className={styles.logList}>
          {filtered.map(l => (
            <div key={l.id} className={styles.logCard + ' glass-card'} onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
              <div className={styles.logTop}>
                <span className={styles.logCat}>{CATEGORY_ICONS[l.category] || '🔧'}</span>
                <div className={styles.logMain}>
                  <span className={styles.logTitle}>{l.title}</span>
                  <span className={styles.logDate}>{new Date(l.date).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className={styles.logRight}>
                  {l.cost != null && <span className={styles.logCost}>{l.cost.toLocaleString('tr-TR')} ₺</span>}
                  <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteLog(l.id); }}>✕</button>
                </div>
              </div>
              {expandedId === l.id && (
                <div className={styles.logDetail}>
                  {l.odometer_km != null && <p>📍 {l.odometer_km.toLocaleString('tr-TR')} km</p>}
                  {l.notes && <p>📝 {l.notes}</p>}
                  {l.next_due_date && <p>⏰ Sonraki bakım: {new Date(l.next_due_date).toLocaleDateString('tr-TR')}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
