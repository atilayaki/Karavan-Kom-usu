import { NextResponse } from 'next/server';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // Bu araç yalnızca yerel ortamda çalışır (Vercel/serverless desteklenmez)
    if (process.env.VERCEL) {
      return NextResponse.json({ success: false, error: 'Bu araç yalnızca yerel ortamda kullanılabilir.' }, { status: 400 });
    }

    const { spawn } = await import('child_process');
    const toolDir = path.join(process.cwd(), 'tools', 'social-commenter');
    const scriptName = 'index.mjs';

    const child = spawn('node', [scriptName, url], {
      detached: true,
      stdio: 'ignore',
      cwd: toolDir,
    });

    child.unref();

    return NextResponse.json({ success: true, message: 'Asistan başlatıldı!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
