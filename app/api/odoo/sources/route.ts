import { NextResponse } from 'next/server';
import { fetchSourcesList } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await fetchSourcesList();
  return NextResponse.json({ sources });
}
