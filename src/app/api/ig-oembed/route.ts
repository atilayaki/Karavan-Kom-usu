import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&maxwidth=800`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ error: 'oEmbed failed' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({ thumbnail_url: data.thumbnail_url ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
