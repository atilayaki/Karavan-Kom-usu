'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './FollowButton.module.css';

interface Props {
  targetUserId: string;
  onCountChange?: (delta: number) => void;
}

export default function FollowButton({ targetUserId, onCountChange }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || null;
      setCurrentUserId(uid);
      if (uid && uid !== targetUserId) {
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', uid)
          .eq('following_id', targetUserId)
          .maybeSingle()
          .then(({ data: row }) => {
            setFollowing(!!row);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, [targetUserId]);

  if (!currentUserId || currentUserId === targetUserId) return null;

  async function toggle() {
    if (pending || !currentUserId) return;
    setPending(true);
    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);
      setFollowing(false);
      onCountChange?.(-1);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId });
      setFollowing(true);
      onCountChange?.(1);
    }
    setPending(false);
  }

  if (loading) return <div className={styles.skeleton} />;

  return (
    <button
      className={`${styles.btn} ${following ? styles.following : styles.follow}`}
      onClick={toggle}
      disabled={pending}
    >
      {following ? '✓ Takip Ediliyor' : '+ Takip Et'}
    </button>
  );
}
