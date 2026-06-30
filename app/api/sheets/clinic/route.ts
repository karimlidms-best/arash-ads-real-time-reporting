import { NextResponse } from 'next/server';
import { fetchClinicRange } from '@/lib/sheets';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  if (!from || !to) return NextResponse.json({ records: [] });
  const records = await fetchClinicRange(from, to);
  return NextResponse.json({ records });
}
