import { NextResponse } from 'next/server';
import { fetchSourcesList } from '@/lib/odoo';

export async function GET() {
  const sources = await fetchSourcesList();
  return NextResponse.json({ sources });
}
