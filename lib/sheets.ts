import type { ClinicRecord, AcademyRecord } from './types';

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || '';
const CLINIC_ID = process.env.CLINIC_SHEET_ID || '';
const ACADEMY_ID = process.env.ACADEMY_SHEET_ID || '';

const MONTHS_AZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

function monthSheetName(year: number, monthIdx: number): string {
  return `${MONTHS_AZ[monthIdx]} ${year}`;
}

function parseAmount(s: any): number {
  if (s === null || s === undefined || s === '') return 0;
  const cleaned = String(s).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(s: any): string {
  // Accept "DD.MM.YYYY" or "DD/MM/YYYY" or "YYYY-MM-DD"
  if (!s) return '';
  const str = String(s).trim();
  let m = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return str;
}

async function fetchSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
  if (!API_KEY || !spreadsheetId) return [];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.values || [];
  } catch {
    return [];
  }
}

async function listSheetTabs(spreadsheetId: string): Promise<string[]> {
  if (!API_KEY || !spreadsheetId) return [];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${API_KEY}&fields=sheets.properties.title`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sheets || []).map((s: any) => s.properties.title);
  } catch {
    return [];
  }
}

// ========== CLINIC ==========
// Columns: №, Həkim, Tarix, Pasient, Əlaqə, Prosedur, Seans adı, Məbləğ, Mənbə

export async function fetchClinicMonth(year: number, monthIdx: number): Promise<ClinicRecord[]> {
  const sheetName = monthSheetName(year, monthIdx);
  const values = await fetchSheetValues(CLINIC_ID, `'${sheetName}'!A2:I1000`);
  const records: ClinicRecord[] = [];

  for (const row of values) {
    if (!row || row.length === 0) continue;
    const num = parseInt(String(row[0] || '0')) || records.length + 1;
    const doctor = String(row[1] || '').trim();
    const dateStr = parseDate(row[2]);
    const patient = String(row[3] || '').trim();
    const contact = String(row[4] || '').trim();
    const procedure = String(row[5] || '').trim();
    const seans = String(row[6] || '').trim();
    const amount = parseAmount(row[7]);
    const source = String(row[8] || '').trim();

    if (!patient && !doctor && !procedure) continue; // empty row

    records.push({
      num, doctor, date: dateStr, patient, contact, procedure, seans, amount, source,
      month: sheetName,
    });
  }
  return records;
}

export async function fetchClinicRange(from: string, to: string): Promise<ClinicRecord[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const all: ClinicRecord[] = [];

  const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const last = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  while (cur <= last) {
    const records = await fetchClinicMonth(cur.getFullYear(), cur.getMonth());
    for (const r of records) {
      if (r.date >= from && r.date <= to) all.push(r);
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return all;
}

// ========== ACADEMY ==========
// Columns: №, Tələbə, Əlaqə, Qeydiyyatdan keçdi, Tədris başladı, Tədris bitdi, Ödəniş

function computeStatus(start: string, end: string, today: string): 'Aktiv' | 'Bitmiş' | 'Başlamayıb' {
  if (!start && !end) return 'Başlamayıb';
  if (today < start) return 'Başlamayıb';
  if (today > end) return 'Bitmiş';
  return 'Aktiv';
}

export async function fetchAcademyMonth(year: number, monthIdx: number): Promise<AcademyRecord[]> {
  const sheetName = monthSheetName(year, monthIdx);
  const values = await fetchSheetValues(ACADEMY_ID, `'${sheetName}'!A2:G1000`);
  const records: AcademyRecord[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const row of values) {
    if (!row || row.length === 0) continue;
    const num = parseInt(String(row[0] || '0')) || records.length + 1;
    const student = String(row[1] || '').trim();
    const contact = String(row[2] || '').trim();
    const registeredAt = parseDate(row[3]);
    const startsAt = parseDate(row[4]);
    const endsAt = parseDate(row[5]);
    const payment = parseAmount(row[6]);

    if (!student) continue;

    const status = computeStatus(startsAt, endsAt, today);
    records.push({ num, student, contact, registeredAt, startsAt, endsAt, payment, status, month: sheetName });
  }
  return records;
}

export async function fetchAcademyAll(): Promise<AcademyRecord[]> {
  const tabs = await listSheetTabs(ACADEMY_ID);
  const all: AcademyRecord[] = [];
  for (const tab of tabs) {
    const m = tab.match(/^(\S+)\s+(\d{4})$/);
    if (!m) continue;
    const monthIdx = MONTHS_AZ.indexOf(m[1]);
    if (monthIdx < 0) continue;
    const year = parseInt(m[2]);
    const records = await fetchAcademyMonth(year, monthIdx);
    all.push(...records);
  }
  return all;
}

export async function fetchAcademyRange(from: string, to: string): Promise<AcademyRecord[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const all: AcademyRecord[] = [];

  const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const last = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  while (cur <= last) {
    const records = await fetchAcademyMonth(cur.getFullYear(), cur.getMonth());
    for (const r of records) {
      if (r.registeredAt >= from && r.registeredAt <= to) all.push(r);
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return all;
}
