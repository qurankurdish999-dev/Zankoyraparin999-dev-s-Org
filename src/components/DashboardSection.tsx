import { motion } from 'motion/react';
import { 
  TrendingDown, Warehouse, Tag, CalendarClock, AlertTriangle, 
  ChevronRight, CircleDot, Database, Users, Landmark
} from 'lucide-react';
import { StoreInventory, GlobalDB, CardsLogItem } from '../types';

interface DashboardSectionProps {
  store: StoreInventory;
  globalDB: GlobalDB;
  cardsLog: CardsLogItem[];
  activeYear: string;
  onNavigateToTab: (tabName: string) => void;
}

export default function DashboardSection({
  store,
  globalDB,
  cardsLog,
  activeYear,
  onNavigateToTab,
}: DashboardSectionProps) {
  // 1. Warehouse stats
  const warehouseItems = Object.entries(store);
  const totalItemsCount = warehouseItems.length;
  const totalStockSum = warehouseItems.reduce((acc, [, item]) => acc + item.stock, 0);
  const outOfStockItems = warehouseItems.filter(([, item]) => item.stock === 0);

  // 2. Issuing stats for active year
  const yearData = globalDB[activeYear] || {};
  const stationeryCount = (yearData.stationery || []).reduce((acc, curr) => acc + curr.qty_out, 0);
  const cleaningCount = (yearData.cleaning || []).reduce((acc, curr) => acc + curr.qty_out, 0);
  const foodCount = (yearData.food || []).reduce((acc, curr) => acc + curr.qty_out, 0);
  
  const totalOutIssued = stationeryCount + cleaningCount + foodCount;
  const totalOpsRecorded = 
    (yearData.stationery || []).length + 
    (yearData.cleaning || []).length + 
    (yearData.food || []).length;

  const totalCardsOut = cardsLog.reduce((acc, curr) => acc + curr.qty_out, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="relative bg-linear-to-r from-indigo-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-md">
        {/* Subtle Decorative Circle shapes */}
        <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-xl"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-blue-500/15 blur-2xl"></div>

        <div className="relative space-y-2 max-w-2xl text-right">
          <span className="text-4xs font-bold bg-white/15 rounded-full px-3 py-1 tracking-wide uppercase">
            داشبۆردی سەرەکی سیستەم
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-2 leading-snug">
            بەخێربێیت بۆ سەکۆی بەڕێوەبردنی کەلوپەلەکەت
          </h2>
          <p className="text-xs md:text-sm text-indigo-200 font-semibold leading-relaxed">
            لێرەوە دەتوانیت بەخێرایی بڕی گشتی کاڵاکانی ناو عەمبار، منھافی سەرفکراوی ساڵانە لە گشت فەرمانگە و بەشەکان، و ڕێژەی کارتەکانت بە ڕاپۆرتی بەراوردکاری مۆدێرن ببینی.
          </p>
        </div>
      </div>

      {/* Grid Quick Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Warehouse Count */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs border-r-4 border-r-green-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-4xs font-bold tracking-wider">عەمباری گشتی</span>
              <Warehouse className="h-5 w-5 text-green-500 stroke-[1.5]" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">{totalStockSum}</p>
          </div>
          <p className="text-3xs text-slate-400 font-bold mt-2">کۆی بڕی کاڵاکانی کۆگا</p>
        </div>

        {/* Total Year Checkouts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs border-r-4 border-r-indigo-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-4xs font-bold tracking-wider">کۆی دەرچووە گشتگیرەکان</span>
              <TrendingDown className="h-5 w-5 text-indigo-500 stroke-[1.5]" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">{totalOutIssued}</p>
          </div>
          <p className="text-3xs text-slate-400 font-bold mt-2">جگە لە بڕی کارتە سەرفکراوەکان</p>
        </div>

        {/* Total Vouchers / Cards checkouts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs border-r-4 border-r-violet-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-4xs font-bold tracking-wider">سەرفی کارتەکان</span>
              <CircleDot className="h-5 w-5 text-violet-500 stroke-[1.5]" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">{totalCardsOut}</p>
          </div>
          <p className="text-3xs text-slate-400 font-bold mt-2">ساڵی چالاک: {activeYear}</p>
        </div>

        {/* Empty Inventory items */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs border-r-4 border-r-red-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-4xs font-bold tracking-wider">کاڵا تەواوبووەکان</span>
              <AlertTriangle className="h-5 w-5 text-red-500 stroke-[1.5]" />
            </div>
            <p className="text-2xl font-black text-red-600 font-mono">{outOfStockItems.length}</p>
          </div>
          <p className="text-3xs text-red-500 font-bold mt-2">پێویستی بە کڕینەوە هەیە</p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              مەنھافی دەرچوونی کۆگا بەپێی بەشەکان (فەرمی)
            </h3>

            <div className="space-y-4">
              {/* Stationery */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-indigo-600">✏️ بەشی قڕتاسیە</span>
                  <span className="font-mono text-slate-600">{stationeryCount} دانە دەرچووە</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalOutIssued > 0 ? (stationeryCount / totalOutIssued) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Cleaning */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-cyan-600">🧹 بەشی خاوێن کردنەوە</span>
                  <span className="font-mono text-slate-600">{cleaningCount} دانە دەرچووە</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalOutIssued > 0 ? (cleaningCount / totalOutIssued) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Food */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-amber-600">🍽️ بەشی خواردن</span>
                  <span className="font-mono text-slate-600">{foodCount} دانە دەرچووە</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalOutIssued > 0 ? (foodCount / totalOutIssued) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-150 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>کۆی تۆمارە بەدواداچووەکان: {totalOpsRecorded} ڕووداو</span>
            <span>ساڵی دارایی: {activeYear}</span>
          </div>
        </div>

        {/* Warning Alerts / Red flags on hand */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              کاڵا بەتاڵبووەکانی کۆگا
            </h3>

            {outOfStockItems.length === 0 ? (
              <div className="text-slate-400 text-xs py-10 text-center font-semibold">
                🎉 سەرجەم کاڵاکان لە کۆگا شیاون!
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5">
                {outOfStockItems.map(([name, item]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl border border-red-100"
                  >
                    <span className="text-xs font-extrabold text-slate-700 line-clamp-1">{name}</span>
                    <span className="text-3xs font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      تەواوبوو
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('store')}
            className="w-full mt-4 flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-all cursor-pointer border-none bg-indigo-50 py-2.5 rounded-xl"
          >
            ڕێکخستنەوەی عەمبار
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
