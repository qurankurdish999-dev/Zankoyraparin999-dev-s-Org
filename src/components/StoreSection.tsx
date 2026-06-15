import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, FileDown, Upload, Trash2, ArrowUpDown, 
  Warehouse, Layers, AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StoreInventory, StoreLog } from '../types';
import { printHTML } from '../utils/printHelper';

interface StoreSectionProps {
  store: StoreInventory;
  setStore: React.Dispatch<React.SetStateAction<StoreInventory>>;
  storeLog: StoreLog[];
  setStoreLog: React.Dispatch<React.SetStateAction<StoreLog[]>>;
  onOpenCatChoice: (item: { name: string; supplier: string; qty: number; unit: string; cardtype: string }) => void;
  onDeleteLog: (idx: number) => void;
}

export default function StoreSection({
  store,
  setStore,
  storeLog,
  setStoreLog,
  onOpenCatChoice,
  onDeleteLog,
}: StoreSectionProps) {
  // Add item form states
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('دانە');
  const [cardtype, setCardtype] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Autocomplete dropdown states
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // File input ref for Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Stats
  const itemsList = Object.entries(store);
  const totalItems = itemsList.length;
  const totalStock = itemsList.reduce((acc, [, item]) => acc + item.stock, 0);
  const lowStockCount = itemsList.filter(([, item]) => item.stock > 0 && item.stock <= 5).length;
  const outOfStockCount = itemsList.filter(([, item]) => item.stock === 0).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !supplier.trim() || !qty || Number(qty) <= 0) {
      alert('تکایە هەموو خانە پێویستەکان بە دروستی پڕ بکەرەوە.');
      return;
    }
    
    // Trigger parent category selector
    onOpenCatChoice({
      name: name.trim(),
      supplier: supplier.trim(),
      qty: Math.floor(Number(qty)),
      unit,
      cardtype,
    });

    // Reset inputs
    setName('');
    setSupplier('');
    setQty('');
    setUnit('دانە');
    setCardtype('');
    setShowNameSuggestions(false);
    setShowSupplierSuggestions(false);
  };

  // Excel Import Handler
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (!rows.length) {
          alert('فایلەکە بەتاڵە یان داتا لەخۆ ناگرێت.');
          return;
        }

        let addedCount = 0;
        const updatedStore = { ...store };
        const newLogs: StoreLog[] = [];

        rows.forEach((row) => {
          const rawName = (row['ناوی کەلوپەل'] || row['name'] || row['Name'] || '').toString().trim();
          const rawSupplier = (row['دابینکەر'] || row['supplier'] || row['Supplier'] || '').toString().trim();
          const rawQty = parseInt(row['بڕ'] || row['qty'] || row['quantity'] || row['Qty'] || row['Quantity'] || 0);
          const rawUnit = (row['یەکە'] || row['unit'] || row['Unit'] || 'دانە').toString().trim();
          const rawCardtype = (row['جۆری کارت'] || row['cardtype'] || row['card_type'] || row['CardType'] || '').toString().trim();
          const rawCat = (row['بەش'] || row['category'] || row['cat'] || row['Category'] || '').toString().trim().toLowerCase();

          if (!rawName || rawQty <= 0) return;

          // Map categories
          let category = '';
          if (rawCat.includes('قڕتاسیە') || rawCat.includes('stationery')) category = 'stationery';
          else if (rawCat.includes('خواردن') || rawCat.includes('food')) category = 'food';
          else if (rawCat.includes('خاوێن') || rawCat.includes('clean')) category = 'cleaning';

          if (!updatedStore[rawName]) {
            updatedStore[rawName] = { stock: 0, supplier: '', unit: 'دانە', cat: '', cardtype: '' };
          }

          updatedStore[rawName].stock += rawQty;
          if (rawSupplier) updatedStore[rawName].supplier = rawSupplier;
          if (rawUnit) updatedStore[rawName].unit = rawUnit;
          if (category) updatedStore[rawName].cat = category;
          if (rawCardtype) updatedStore[rawName].cardtype = rawCardtype;

          newLogs.push({
            name: rawName,
            supplier: rawSupplier,
            qty_in: rawQty,
            qty_out: 0,
            unit: rawUnit,
            cardtype: rawCardtype,
            type: 'ئیمپۆرتی ئێگزڵ',
            cat: category ? (category === 'stationery' ? 'قڕتاسیە' : category === 'cleaning' ? 'خاوێنکردنەوە' : 'خواردن') : 'گشتی',
            date: new Date().toISOString().slice(0, 10),
            stock_after: updatedStore[rawName].stock,
            ts: Date.now() + addedCount, // stagger a tiny bit
          });

          addedCount++;
        });

        if (addedCount > 0) {
          setStore(updatedStore);
          setStoreLog((prev) => [...newLogs, ...prev]);
          alert(`✅ ${addedCount} کەلوپەل بە سەرکەوتوویی بارکرا بۆ کۆگا`);
        } else {
          alert('هیچ کەلوپەلێکی دروست لە فایلەکەدا نەدۆزرایەوە.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert('کێشەیەک لە خوێندنەوەی ئێگزڵ هەیە.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // PDF / HTML Print Report
  const exportStoreReport = () => {
    if (!itemsList.length) {
      alert('هیچ داتایەک نیە بۆ پرینت.');
      return;
    }

    const categoryLabels: { [key: string]: string } = {
      stationery: 'قڕتاسیە',
      cleaning: 'خاوێن کردنەوە',
      food: 'خواردن',
    };

    const rows = itemsList.map(([, item], i) => {
      const isZero = item.stock === 0;
      const isLow = item.stock > 0 && item.stock <= 5;
      const stockClass = isZero ? 'zero' : isLow ? 'low' : 'ok';
      const badgeClass = isZero ? 'badge-zero' : isLow ? 'badge-low' : 'badge-ok';
      const statusLabel = isZero ? 'بەتاڵ' : isLow ? 'کەم' : 'باش';

      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td><strong>${item.supplier || '-'}</strong></td>
          <td>${item.cardtype || '-'}</td>
          <td>${item.cat ? categoryLabels[item.cat] || '-' : '-'}</td>
          <td class="num">${item.unit || 'دانە'}</td>
          <td class="num ${stockClass}">${item.stock}</td>
          <td class="num"><span class="badge ${badgeClass}">${statusLabel}</span></td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div class="page">
        <div class="hdr" style="background: #16a34a;">
          <h1>📦 ڕاپۆرتی کۆی کۆگای کەلوپەلەکان</h1>
        </div>
        <div class="meta">
          <span>بەروار: ${new Date().toLocaleDateString('en-GB')}</span>
          <span>ژمارەی جۆری کەلوپەل: ${totalItems}</span>
        </div>
        <table>
          <thead>
            <tr style="background: #16a34a;">
              <th class="num">#</th>
              <th>دابینکەر</th>
              <th>جۆری کارت</th>
              <th>بەش</th>
              <th class="num">یەکە</th>
              <th class="num">ئەندازەی کۆگا</th>
              <th class="num">دۆخی ڕێژە</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="ftr">سیستەمی بەڕێوەبردنی کەلوپەل — ڕاپۆرتی کۆگای گشتی</div>
      </div>
    `;

    printHTML(htmlContent, 'Store-Inventory-Report');
  };

  // Autocomplete Suggestions helper
  const getNameSuggestions = () => {
    return Object.keys(store)
      .filter((n) => n.toLowerCase().includes(name.toLowerCase()) && n.toLowerCase() !== name.toLowerCase())
      .slice(0, 5);
  };

  const getSupplierSuggestions = () => {
    const suppliers = new Set<string>();
    Object.values(store).forEach((item) => {
      if (item.supplier) suppliers.add(item.supplier);
    });
    return Array.from(suppliers)
      .filter((s) => s.toLowerCase().includes(supplier.toLowerCase()) && s.toLowerCase() !== supplier.toLowerCase())
      .slice(0, 5);
  };

  const handleDeleteItem = (itemName: string) => {
    if (confirm(`دڵنیایت لە سڕینەوەی "[${itemName}]" بە تەواوی لە کۆگا؟`)) {
      setStore((prev) => {
        const copy = { ...prev };
        delete copy[itemName];
        return copy;
      });
    }
  };

  const filteredItems = itemsList.filter(([n]) =>
    n.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">🏪</span>
            بەڕێوەبردنی گشتی کۆگا
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">بڕ، دابینکەر، یەکە، و جۆرەکانی کەلوپەل ڕێکبخە</p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            onClick={exportStoreReport}
            className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border-none"
          >
            <FileDown className="h-4.5 w-4.5" />
            داونلۆدی PDF کۆگا
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border-none"
          >
            <Upload className="h-4.5 w-4.5" />
            ئیمپۆرتی ئێگزڵ
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls"
            className="hidden"
          />
        </div>
      </div>

      {/* Stock Cards Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-emerald-500">
          <p className="text-xs text-slate-500 font-semibold mb-1">کۆی جۆری کەلوپەل</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalItems}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-indigo-500">
          <p className="text-xs text-slate-500 font-semibold mb-1">کۆی بڕی کاڵاكان</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalStock}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-amber-500">
          <p className="text-xs text-slate-500 font-semibold mb-1">بڕی کەمبوو (≤٥)</p>
          <p className="text-2xl font-black text-amber-600 font-mono">{lowStockCount}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-red-500">
          <p className="text-xs text-slate-500 font-semibold mb-1">بەتاڵبوو (٠)</p>
          <p className="text-2xl font-black text-red-600 font-mono">{outOfStockCount}</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          داخڵکردنی کەلوپەلی نوێ بۆ کۆگا
        </h3>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Item Name Input with AutoComplete */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                ناوی کەلوپەل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowNameSuggestions(true);
                }}
                onFocus={() => setShowNameSuggestions(true)}
                placeholder="ناوی کەلوپەل بنووسە..."
                required
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
              />
              {/* Autocomplete List */}
              {showNameSuggestions && name.trim() && getNameSuggestions().length > 0 && (
                <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg py-1 divide-y divide-slate-50">
                  {getNameSuggestions().map((suggestion, idx) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => {
                        setName(suggestion);
                        setShowNameSuggestions(false);
                      }}
                      className="w-full text-right py-2 px-3.5 text-xs font-semibold text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Supplier Input with AutoComplete */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                دابینکەر / کۆمپانیا <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  setShowSupplierSuggestions(true);
                }}
                onFocus={() => setShowSupplierSuggestions(true)}
                placeholder="دابینکەر..."
                required
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
              />
              {/* Autocomplete List */}
              {showSupplierSuggestions && supplier.trim() && getSupplierSuggestions().length > 0 && (
                <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg py-1 divide-y divide-slate-50">
                  {getSupplierSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => {
                        setSupplier(suggestion);
                        setShowSupplierSuggestions(false);
                      }}
                      className="w-full text-right py-2 px-3.5 text-xs font-semibold text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Qty & Unit fields */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                بڕی هاتوو و یەکەکەی <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  required
                  className="w-2/3 rounded-xl border-1.5 border-slate-200 py-2.5 px-3 text-sm font-semibold text-slate-800 outline-hidden focus:border-emerald-500 font-mono text-center"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-1/3 rounded-xl border-1.5 border-slate-200 bg-white py-2.5 px-2 text-xs font-bold text-slate-700 outline-hidden transition-all focus:border-emerald-500"
                >
                  <option value="دانە">دانە</option>
                  <option value="مەتر">مەتر</option>
                  <option value="کارتۆن">کارتۆن</option>
                </select>
              </div>
            </div>

            {/* Card type if applicable */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">جۆری کارت (لەکاتی پێویست)</label>
              <select
                value={cardtype}
                onChange={(e) => setCardtype(e.target.value)}
                className="w-full rounded-xl border-1.5 border-slate-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-700 outline-hidden transition-all focus:border-emerald-500"
              >
                <option value="">— کرت نیە —</option>
                <option value="ئاسیا">ئاسیا</option>
                <option value="کۆڕەک">کۆڕەک</option>
                <option value="ئینتەرنێت">ئینتەرنێت</option>
                <option value="تر">تر</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-2 border-none"
          >
            <Plus className="h-4.5 w-4.5" />
            زیاد بکە بۆ کۆگا
          </button>
        </form>
      </div>

      {/* Grid of Items */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6">
        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            لیستی کەلوپەلەکانی ناو کۆگا
          </h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕانی کەلوپەل..."
              className="w-full rounded-xl border-1.5 border-slate-200 py-2 pr-9.5 pl-3.5 text-xs font-semibold text-slate-800 outline-hidden transition-all focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Store Grid Cards */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-sm">هیچ کەلوپەلێک نەدۆزرایەوە...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(([n, d]) => {
              const remains = d.stock;
              const isZero = remains === 0;
              const isLow = remains > 0 && remains <= 5;
              const cardBorderColor = isZero
                ? 'border-red-200 bg-red-50/20'
                : isLow
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-slate-100 bg-white';

              const categoryLabels: { [key: string]: string } = {
                stationery: '✏️ قڕتاسیە',
                cleaning: '🧹 خاوێن کردنەوە',
                food: '🍽️ خواردن',
              };

              return (
                <motion.div
                  layout
                  key={n}
                  className={`rounded-2xl border p-4.5 flex flex-col justify-between shadow-3xs transition-all hover:shadow-xs relative overflow-hidden ${cardBorderColor}`}
                >
                  <div className="space-y-1.5">
                    <p className="font-extrabold text-sm text-slate-800 line-clamp-2 leading-relaxed">{n}</p>
                    <p className="text-xs font-bold text-slate-400">داینکەر: {d.supplier}</p>
                    {d.cat && (
                      <p className="text-2xs font-extrabold text-slate-500 inline-block bg-slate-100 rounded-lg px-2 py-0.5 mt-1">
                        {categoryLabels[d.cat] || d.cat}
                      </p>
                    )}
                    {d.cardtype && (
                      <div className="mt-1">
                        <span className="inline-block text-2xs font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">
                          🪪 {d.cardtype}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black font-mono text-slate-800">{d.stock}</span>
                      <span className="text-3xs font-extrabold text-slate-400 mr-1">{d.unit}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-2xs font-bold rounded-full px-2 py-0.5 ${
                          isZero ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isZero ? 'بەتاڵ' : isLow ? 'کەم' : 'باش'}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(n)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 transition-all cursor-pointer border-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            مێژووی کردارەکانی هاتن و چوون لە کۆگا
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                <th className="p-4">#</th>
                <th className="p-4">کەلوپەل</th>
                <th className="p-4">بەروار</th>
                <th className="p-4">کۆمپانیا (ناو)</th>
                <th className="p-4">کت کارت</th>
                <th className="p-4">هاتوو</th>
                <th className="p-4">ڕۆشتوو</th>
                <th className="p-4">بۆ/جۆری دەرپەر</th>
                <th className="p-4 text-center">ماوە لە کۆگا</th>
                <th className="p-4">کردار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {storeLog.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">هیچ تۆمارێک نیە...</td>
                </tr>
              ) : (
                storeLog.slice(0, 100).map((r, i) => (
                  <tr key={r.ts} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{r.name}</td>
                    <td className="p-4 font-mono text-slate-500">{r.date}</td>
                    <td className="p-4 text-slate-500">{r.supplier || '-'}</td>
                    <td className="p-4">
                      {r.cardtype ? (
                        <span className="inline-block text-3xs font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                          {r.cardtype}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 font-bold font-mono text-emerald-600">{r.qty_in > 0 ? `+${r.qty_in}` : '-'}</td>
                    <td className="p-4 font-bold font-mono text-amber-600">{r.qty_out > 0 ? `-${r.qty_out}` : '-'}</td>
                    <td className="p-4 text-slate-500">{r.to || r.cat || r.type || '-'}</td>
                    <td className="p-4 text-center font-mono font-black">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          r.stock_after === 0
                            ? 'bg-red-50 text-red-600'
                            : r.stock_after <= 5
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {r.stock_after}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onDeleteLog(i)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-all cursor-pointer border-none"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
