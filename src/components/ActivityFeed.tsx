'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './ActivityFeed.module.css';
import type { Activity } from '@/lib/database.types';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to new activities
    const channel = supabase
      .channel('public:activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setActivities(data);
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return '📌';
      case 'route': return '🗺️';
      case 'post': return '📸';
      case 'item': return '🛒';
      default: return '🚐';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.feedContainer + " glass-card"}>
      <h3>📡 Canlı Yol Durumu</h3>
      <div className={styles.feedList}>
        {loading ? (
          <div className="shimmer" style={{height: '100px', borderRadius: '12px'}}></div>
        ) : activities.length === 0 ? (
          <p style={{fontSize: '0.9rem', opacity: 0.6}}>Henüz bir hareket yok. Yola çıkmaya ne dersin?</p>
        ) : (
          activities.map((act) => (
            <div key={act.id} className={styles.activityItem}>
              <span className={styles.icon}>{getActivityIcon(act.activity_type)}</span>
              <div className={styles.details}>
                <p>
                  <strong>{act.profiles?.full_name || 'Bir Karavancı'}</strong> {act.description}
                </p>
                <span className={styles.time}>{formatTime(act.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
