'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './ChallengesWidget.module.css';
import { IconTrophy, IconCheck } from '@/components/Icons';
import { useToast } from '@/components/Toast';
import type { Challenge, UserChallenge } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';

export default function ChallengesWidget() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      fetchChallenges(user?.id);
    });
  }, []);

  const fetchChallenges = async (userId?: string) => {
    const { data: globalChallenges } = await supabase
      .from('challenges')
      .select('*')
      .order('ends_at', { ascending: true });
    
    if (globalChallenges) setChallenges(globalChallenges);

    if (userId) {
      const { data: userProgress } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId);
      
      if (userProgress) setUserChallenges(userProgress);
    }
  };

  const handleComplete = async (challengeId: number) => {
    if (!user) return showToast('Puan kazanmak için giriş yapmalısın!', 'warning');

    // Bu örnekte manuel tamamlama butonu koyuyoruz (test için)
    // Gerçekte bu bir RPC çağrısı veya aktivite takibiyle olur.
    const { error } = await supabase.rpc('complete_challenge', { 
      p_user_id: user.id, 
      p_challenge_id: challengeId 
    });

    if (error) {
      showToast('Görevi henüz tamamlamadın veya bir hata oluştu.', 'info');
    } else {
      showToast('Tebrikler! Görev tamamlandı. +100 XP kazandın! 🎉', 'success');
      fetchChallenges(user.id);
    }
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <IconTrophy size={24} color="var(--sunset-orange)" />
          <h3>Haftalık Görevler</h3>
        </div>
        <span className={styles.timer}>Süre Doluyor: 4 Gün</span>
      </div>

      <div className={styles.grid}>
        {challenges.map((ch) => {
          const progress = userChallenges.find(uc => uc.challenge_id === ch.id);
          const isCompleted = progress?.status === 'completed';

          return (
            <div key={ch.id} className={`${styles.challengeCard} ${isCompleted ? styles.completed : ''} glass-card`}>
              <div className={styles.icon}>{ch.icon}</div>
              <div className={styles.info}>
                <h4>{ch.title}</h4>
                <p>{ch.description}</p>
                <div className={styles.footer}>
                  <span className={styles.xp}>+{ch.xp_reward} XP</span>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => handleComplete(ch.id)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? <IconCheck size={16} /> : 'Tamamla'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
