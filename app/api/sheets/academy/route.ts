import { NextResponse } from 'next/server';
import { fetchAcademyAll, fetchAcademyRange } from '@/lib/sheets';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  // Always return all for KPI computation (total students, active), plus filtered range
  const [all, filtered] = await Promise.all([
    fetchAcademyAll(),
    from && to ? fetchAcademyRange(from, to) : Promise.resolve([]),
  ]);
  return NextResponse.json({ all, filtered });
}
