export type Collection = 'officials' | 'bpd' | 'facilities' | 'finance' | 'news' | 'albums';
export interface Photo { id: string; url: string; alt: string; dummy?: boolean }
export interface Entry {
  id: string;
  name: string;
  slug?: string;
  role?: string;
  education?: string;
  order?: number;
  category?: string;
  value?: number | null;
  unit?: string;
  condition?: string;
  note?: string;
  date?: string;
  author?: string;
  summary?: string;
  body?: string;
  photo?: string;
  photos?: Photo[];
  dummy?: boolean;
}
export interface Statistic { id: string; name: string; value: number | null; unit: string; category: string }
export interface DemoData {
  principal: { name: string; greeting: string; photo: string; dummy: boolean };
  settings: { logo: string; hero: string };
  contact: { phone: string; message: string; dummy: boolean };
  statistics: Statistic[];
  officials: Entry[];
  bpd: Entry[];
  facilities: Entry[];
  finance: Entry[];
  news: Entry[];
  albums: Entry[];
}
export type ApiResult<T> = { data: T; error: null } | { data: null; error: { code: string; message: string; fields?: Record<string, string> } };
