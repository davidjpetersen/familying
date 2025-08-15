import { NextResponse } from 'next/server';
import { healthcheck } from '@/lib/supabase/healthcheck';

export async function GET() {
  try {
    await healthcheck();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
