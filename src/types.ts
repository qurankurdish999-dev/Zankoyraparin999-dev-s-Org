export interface StoreItem {
  stock: number;
  supplier: string;
  unit: string;
  cat: string; // 'stationery' | 'cleaning' | 'food' | ''
  cardtype: string; // 'ئاسیا' | 'کۆڕەک' | 'ئینتەرنێت' | 'تر' | ''
}

export interface StoreInventory {
  [name: string]: StoreItem;
}

export interface StoreLog {
  name: string;
  supplier?: string;
  qty_in: number;
  qty_out: number;
  unit: string;
  cardtype?: string;
  type: string; // 'زیادکردن' | 'دەرچوونی کارت' | 'ئیمپۆرتی ئێگزڵ' | string (type of cat)
  cat?: string; // category or 'گشتی'
  to?: string;
  req?: string;
  date: string;
  stock_after: number;
  ts: number;
}

export interface CategoryLogItem {
  name: string;
  date: string;
  to: string;
  qty_out: number;
  unit: string;
  remain: number;
  req: string;
  ts: number;
}

export interface CardsLogItem {
  name: string;
  cardtype: string;
  date: string;
  to: string;
  qty_out: number;
  unit: string;
  req: string;
  stock_after: number;
  ts: number;
}

export interface YearDBData {
  stationery?: CategoryLogItem[];
  cleaning?: CategoryLogItem[];
  food?: CategoryLogItem[];
}

export interface GlobalDB {
  [year: string]: YearDBData;
}
