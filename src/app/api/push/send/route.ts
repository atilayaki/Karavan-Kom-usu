import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { receiverId, title, body, url } = await req.json();
    if (!receiverId) return NextResponse.json({ error: 'Missing receiverId' }, { status: 400 });

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', receiverId)
      .single();

    if (error || !data) return NextResponse.json({ ok: false, reason: 'no subscription' });

    const subscription = JSON.parse(data.subscription);
    const payload = JSON.stringify({
      title: title || 'Yeni Mesaj',
      body: body || 'Bir komşundan mesaj geldi.',
      url: url || '/mesajlar',
      icon: '/icon-192x192.png',
    });

    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.statusCode === 410) {
      // Subscription expired — clean up
      const body = await req.json().catch(() => ({}));
      if (body?.receiverId) {
        await supabase.from('push_subscriptions').delete().eq('user_id', body.receiverId);
      }
    }
    return NextResponse.json({ ok: false, reason: err.message });
  }
}
