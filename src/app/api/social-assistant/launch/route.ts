import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { url, message } = await req.json();

    // Playwright scriptinin yolunu belirle
    const scriptPath = path.resolve(process.cwd(), 'tools/social-commenter/index.mjs');

    // Bağımsız bir süreç olarak başlat
    // Not: Bu süreç sunucudan bağımsız çalışacak şekilde spawn edilir
    const child = spawn('node', [scriptPath, url], {
      detached: true,
      stdio: 'ignore',
      cwd: path.resolve(process.cwd(), 'tools/social-commenter')
    });

    child.unref();

    return NextResponse.json({ success: true, message: 'Asistan başlatıldı!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
