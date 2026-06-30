export type Dept =
  | 'hamisi-arash' | 'hamisi-ekspert'
  | 'arash-dental' | 'arash-service' | 'arash-company' | 'arash-anti-age'
  | 'podcast' | 'conference' | 'training'
  | 'ekspert-lazer' | 'ekspert-akademiya';

export type Layout = 'default' | 'podcast' | 'ekspert';
export type SatisLayout = 'odoo' | 'lazer' | 'akademiya' | 'hamisi-ekspert';

export interface DeptConfig {
  name: string;
  layout: Layout;
  satisLayout: SatisLayout;
  metaKeyword: string;
  isAggArash?: boolean;
  isAggEkspert?: boolean;
}

export const DEPTS: Record<Dept, DeptConfig> = {
  'hamisi-arash':       { name: 'Hamısı (Arash Company)', layout: 'default', satisLayout: 'odoo', metaKeyword: '', isAggArash: true },
  'hamisi-ekspert':     { name: 'Hamısı (Ekspert)', layout: 'ekspert', satisLayout: 'hamisi-ekspert', metaKeyword: 'Ekspert', isAggEkspert: true },
  'arash-dental':       { name: 'Arash Dental', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Dental' },
  'arash-service':      { name: 'Arash Service', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Service' },
  'arash-company':      { name: 'Arash Company', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Company' },
  'arash-anti-age':     { name: 'Arash Anti-age', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Anti-age' },
  'podcast':            { name: 'Podcast', layout: 'podcast', satisLayout: 'odoo', metaKeyword: 'Podcast' },
  'conference':         { name: 'Conference', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Conference' },
  'training':           { name: 'Training', layout: 'default', satisLayout: 'odoo', metaKeyword: 'Training' },
  'ekspert-lazer':      { name: 'Ekspert Lazer Mərkəzi', layout: 'ekspert', satisLayout: 'lazer', metaKeyword: 'Lazer' },
  'ekspert-akademiya':  { name: 'Ekspert Akademiya', layout: 'ekspert', satisLayout: 'akademiya', metaKeyword: 'Akademiya' },
};

export const ARASH_DEPTS: Dept[] = ['arash-dental', 'arash-service', 'arash-company', 'arash-anti-age', 'podcast', 'conference', 'training'];
export const EKSPERT_DEPTS: Dept[] = ['ekspert-lazer', 'ekspert-akademiya'];

export interface HesabatMetrics {
  spend: number;
  reach: number;
  impressions: number;
  messages: number;
  leads: number;
  cpm: number;
  frequency: number;
  costPerMessage: number;
  costPerLead: number;
  msgToLead: number;
  clicks?: number;
  profileVisits?: number;
}

export interface DailyPoint {
  date: string;
  spend: number;
  reach: number;
  impressions: number;
  messages: number;
  leads: number;
}

export interface DeptBreakdown {
  dept: Dept;
  leads: number;
}

export interface ClinicRecord {
  num: number;
  doctor: string;
  date: string;
  patient: string;
  contact: string;
  procedure: string;
  seans: string;
  amount: number;
  source: string;
  month: string;
}

export interface AcademyRecord {
  num: number;
  student: string;
  contact: string;
  registeredAt: string;
  startsAt: string;
  endsAt: string;
  payment: number;
  status: 'Aktiv' | 'Bitmiş' | 'Başlamayıb';
  month: string;
}

export interface OdooLead {
  id: number;
  type: 'lead' | 'opportunity';
  stage: string;
  isWon: boolean;
  isLost: boolean;
  source: string;
  campaign: string;
  tag: string;
  dept: Dept | null;
  amount: number;
  createDate: string;
}
