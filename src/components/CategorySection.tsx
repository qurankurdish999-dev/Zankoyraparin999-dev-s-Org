import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, FileDown, Trash2, Calendar, User, ShoppingBag } from 'lucide-react';
import { StoreInventory, StoreLog, GlobalDB, CategoryLogItem } from '../types';
import { printHTML } from '../utils/printHelper';

interface CategorySectionProps {
  cat: 'stationery' | 'cleaning' | 'food';
  label: string;
  themeColor: 'indigo' | 'cyan' | 'amber';
  activeYear: string;
  store: StoreInventory;
  setStore: React.Dispatch<React.SetStateAction<StoreInventory>>;
  globalDB: GlobalDB;
  setGlobalDB: React.Dispatch<React.SetStateAction<GlobalDB>>;
  setStoreLog: React.Dispatch<React.SetStateAction<StoreLog[]>>;
}

export default function CategorySection({
  cat,
  label,
  themeColor,
  activeYear,
  store,
  setStore,
  globalDB,
  setGlobalDB,
  setStoreLog,
}: CategorySectionProps) {
  // Input fields state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('دانە');
  const [req, setReq] = useState('');

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Styling maps based on themeColor
  const styles = {
    indigo: {
      accent: 'border-r-indigo-500',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      btn: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-100',
      text: 'text-indigo-700',
      fill: 'bg-indigo-500',
      gradient: 'from-indigo-600 to-blue-500',
      borderFocus: 'focus:border-indigo-500',
    },
    cyan: {
      accent: 'border-r-cyan-500',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      btn: 'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-100',
      text: 'text-cyan-700',
      fill: 'bg-cyan-500',
      gradient: 'from-cyan-600 to-teal-500',
      borderFocus: 'focus:border-cyan-500',
    },
    amber: {
      accent: 'border-r-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-100',
      btn: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-100',
      text: 'text-amber-700',
      fill: 'bg-amber-500',
      gradient: 'from-amber-600 to-orange-500',
      borderFocus: 'focus:border-amber-500',
    },
  }[themeColor];

  // Load items belonging to active year and category
  const yearData = globalDB[activeYear] || {};
  const items: CategoryLogItem[] = yearData[cat] || [];

  // Computed values
  const totalOut = items.reduce((acc, curr) => acc + curr.qty_out, 0);
  const totalOps = items.length;

  // Active warehouse inventory stock lookup
  const currentWarehouseStock = name.trim() ? store[name.trim()]?.stock ?? 0 : null;
  const currentUnit = name.trim() ? store[name.trim()]?.unit ?? 'دانە' : 'دانە';

  // Autocomplete suggestions based on store inventory items in this category or untagged
  const getSuggestions = () => {
    return Object.entries(store)
      .filter(([itemName, details]) => {
        const matchesCategory = details.cat === cat || !details.cat;
        const matchesSearch = itemName.toLowerCase().includes(name.toLowerCase());
        const isSelf = itemName.toLowerCase() === name.toLowerCase();
        return matchesCategory && matchesSearch && !isSelf;
      })
      .map(([itemName]) => itemName)
      .slice(0, 5);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !to.trim() || !qty || Number(qty) <= 0) {
      alert('تکایە خانە بەتاڵەکان بە دروستی پڕ بکەرەوە.');
      return;
    }

    const outQty = Math.floor(Number(qty));
    const finalName = name.trim();

    // Verify stock levels or ask user
    const currentStock = store[finalName]?.stock ?? 0;
    if (currentStock < outQty) {
      const confirmProceed = confirm(
        `⚠️ بڕی کۆگا لەم بابەتە بریتیە لە (${currentStock}) کە کەمترە لە بڕی داواکراو (${outQty}).\nدەتەوێت هەر بەردەوام بیت؟`
      );
      if (!confirmProceed) return;
    }

    // Deduct stock from store
    const newStockRemaining = Math.max(0, currentStock - outQty);
    setStore((prev) => ({
      ...prev,
      [finalName]: {
        ...(prev[finalName] || { supplier: '-', unit: 'دانە', cat, cardtype: '' }),
        stock: newStockRemaining,
      },
    }));

    // Record Store Log
    const newStoreLog: StoreLog = {
      name: finalName,
      qty_in: 0,
      qty_out: outQty,
      unit: unit,
      type: label,
      date: date,
      stock_after: newStockRemaining,
      ts: Date.now(),
    };
    setStoreLog((prev) => [newStoreLog, ...prev]);

    // Record Category Log
    const newCategoryItem: CategoryLogItem = {
      name: finalName,
      date,
      to: to.trim(),
      qty_out: outQty,
      unit: unit,
      remain: newStockRemaining,
      req: req.trim(),
      ts: Date.now(),
    };

    setGlobalDB((prev) => {
      const yearCopy = prev[activeYear] || {};
      const catCopy = yearCopy[cat] || [];
      return {
        ...prev,
        [activeYear]: {
          ...yearCopy,
          [cat]: [...catCopy, newCategoryItem],
        },
      };
    });

    // Reset fields
    setName('');
    setTo('');
    setQty('');
    setReq('');
    setShowSuggestions(false);
  };

  const handleDeleteItemIndex = (index: number) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم تۆمارە؟')) {
      setGlobalDB((prev) => {
        const yearCopy = prev[activeYear] || {};
        const catCopy = [...(yearCopy[cat] || [])];
        catCopy.splice(index, 1);
        return {
          ...prev,
          [activeYear]: {
            ...yearCopy,
            [cat]: catCopy,
          },
        };
      });
    }
  };

  // HTML Print / PDF Report
  const handleExportCategoryPDF = () => {
    if (!items.length) {
      alert('هیچ تۆمارێک نیە بۆ دروستکردنی ڕاپۆرت.');
      return;
    }

    const colMap = {
      stationery: '#6366f1',
      cleaning: '#0891b2',
      food: '#d97706',
    };
    const headerColor = colMap[cat] || '#1a56db';

    const rows = items.map((x, i) => {
      const isZero = x.remain === 0;
      const isLow = x.remain > 0 && x.remain <= 5;
      const remainClass = isZero ? 'zero' : isLow ? 'low' : 'ok';

      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td><strong>${x.name}</strong></td>
          <td class="num">${x.date || '-'}</td>
          <td>${x.to || '-'}</td>
          <td class="num font-bold">${x.qty_out}</td>
          <td><span class="badge" style="background:#e2e8f0;color:#475569;">${x.unit || 'دانە'}</span></td>
          <td class="num ${remainClass}">${x.remain}</td>
          <td>${x.req || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div class="page">
        <div class="hdr" style="background: ${headerColor};">
          <h1>📊 ڕاپۆرتی بەشی ${label} — ساڵی ${activeYear}</h1>
        </div>
        <div class="meta">
          <span>ڕاپۆرت بۆ ساڵی: ${activeYear}</span>
          <span>کۆی دەرچوو: ${totalOut}</span>
          <span>ژمارەی تۆمارەکان: ${totalOps}</span>
        </div>
        <table>
          <thead>
            <tr style="background: ${headerColor};">
              <th class="num">#</th>
              <th>ناوی کەلوپەل</th>
              <th class="num">بەروار</th>
              <th>پێدراو بە</th>
              <th class="num">دەرچوون</th>
              <th>یەکە</th>
              <th class="num">ماوە لە کۆگا</th>
              <th>داواکاری / تێبینی</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="ftr">سیستەمی بەڕێوەبردنی کەلوپەل — بەشی ${label} — ساڵی ${activeYear}</div>
      </div>
    `;

    printHTML(htmlContent, `${label}-Report-${activeYear}`);
  };

  const filteredItems = items.filter((x) => {
    const q = searchQuery.toLowerCase();
    return (
      x.name.toLowerCase().includes(q) ||
      x.to.toLowerCase().includes(q) ||
      (x.req && x.req.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="text-lg">💼</span>
            بەشی {label}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">تۆمارکردن و بەدواداچوونی دەرچوونی کاڵاکان لەم بەشە</p>
        </div>
        <button
          onClick={handleExportCategoryPDF}
          className={`rounded-xl text-white font-bold py-2.5 px-4.5 text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border-none ${styles.btn}`}
        >
          <FileDown className="h-4.5 w-4.5" />
          داونلۆدی PDF بەشی {label}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white border border-slate-100 rounded-2xl p-4.5 shadow-2xs border-r-4 ${styles.accent}`}>
          <p className="text-xs text-slate-500 font-semibold mb-1">کۆی دەرچوو بۆ ساڵی {activeYear}</p>
          <p className={`text-2xl font-black font-mono ${styles.text}`}>{totalOut}</p>
        </div>
        <div className={`bg-white border border-slate-100 rounded-2xl p-4.5 shadow-2xs border-r-4 ${styles.accent}`}>
          <p className="text-xs text-slate-500 font-semibold mb-1">ژمارەی تۆمارەکان (ساڵی چالاک)</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalOps}</p>
        </div>
        <div className={`bg-white border border-slate-100 rounded-2xl p-4.5 shadow-2xs border-r-4 ${styles.accent}`}>
          <p className="text-xs text-slate-500 font-semibold mb-1">جۆری بەکارھاتوو</p>
          <p className="text-2xl font-black text-slate-800 font-mono">
            {new Set(items.map((x) => x.name)).size} دەنە
          </p>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${styles.fill}`}></span>
          تۆمارکردنی دەرچوونی کاڵا (سەرفکردن)
        </h3>

        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Item selector autocomplete */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                ناوی کەلوپەل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ناوی کەلوپەل..."
                required
                className={`w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:ring-3 ${styles.borderFocus}`}
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && name.trim() && getSuggestions().length > 0 && (
                <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg py-1 divide-y divide-slate-50">
                  {getSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => {
                        setName(suggestion);
                        setShowSuggestions(false);
                        const matchUnit = store[suggestion]?.unit || 'دانە';
                        setUnit(matchUnit);
                      }}
                      className="w-full text-right py-2.5 px-4 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                بەروار <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:ring-3 ${styles.borderFocus}`}
              />
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                پێدراو بە <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="ناوی وەرگر یان لایەن..."
                required
                className={`w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:ring-3 ${styles.borderFocus}`}
              />
            </div>

            {/* Qty & Unit combo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                بڕی دەرچوون و یەکە <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  required
                  className={`w-2/3 rounded-xl border-1.5 border-slate-200 py-2.5 px-3 text-sm font-semibold text-slate-800 outline-hidden transition-all text-center font-mono ${styles.borderFocus}`}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`w-1/3 rounded-xl border-1.5 border-slate-200 bg-white py-2.5 px-2 text-xs font-bold text-slate-700 outline-hidden transition-all ${styles.borderFocus}`}
                >
                  <option value="دانە">دانە</option>
                  <option value="مەتر">مەتر</option>
                  <option value="کارتۆن">کارتۆن</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Req / Request details */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">داواکاری / بەش یان جۆری پڕۆژە</label>
              <input
                type="text"
                value={req}
                onChange={(e) => setReq(e.target.value)}
                placeholder="بۆ نموونە: دیوانی بەڕێوبەرایەتی یان تێبینی..."
                className={`w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:ring-3 ${styles.borderFocus}`}
              />
            </div>

            {/* Read-Only current item storage preview */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">بڕی ماوە لە کۆگا بۆ ئەم مەتریاڵە</label>
              <div className="w-full rounded-xl bg-slate-50 p-2 text-sm font-bold text-slate-700 border border-slate-100 flex items-center justify-between h-[45px]">
                <span className="text-slate-400 text-xs">ڕێژەی کۆگا</span>
                <span className="text-emerald-700">
                  {currentWarehouseStock !== null
                    ? `${currentWarehouseStock} ${currentUnit}`
                    : '— دیاری نیە —'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`rounded-xl text-white font-bold py-2.5 px-5 text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-2 border-none ${styles.btn}`}
          >
            <Plus className="h-4.5 w-4.5" />
            تۆمار بکە
          </button>
        </form>
      </div>

      {/* Operational Logs List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${styles.fill}`}></span>
            تۆمارەکانی بەشی {label} بۆ ساڵی {activeYear}
          </h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی وەرگر یان کاڵا..."
              className={`w-full rounded-xl border-1.5 border-slate-200 py-2 pr-9.5 pl-3.5 text-xs font-semibold text-slate-800 outline-hidden transition-all focus:ring-3 ${styles.borderFocus}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                <th className="p-4">#</th>
                <th className="p-4">ناوی کەلوپەل</th>
                <th className="p-4 text-center">بەروار</th>
                <th className="p-4">پێدراو بە</th>
                <th className="p-4">دەرچوون (منھاف)</th>
                <th className="p-4">یەکە</th>
                <th className="p-4 text-center">ماوە لە کۆگا</th>
                <th className="p-4">داواکاری / بەش</th>
                <th className="p-4">کردار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 font-medium">هیچ تۆمارێک نەدۆزرایەوە...</td>
                </tr>
              ) : (
                filteredItems.map((x, i) => (
                  <tr key={x.ts} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{x.name}</td>
                    <td className="p-4 text-center font-mono text-slate-500">{x.date}</td>
                    <td className="p-4 text-slate-600">{x.to}</td>
                    <td className="p-4 text-slate-900 font-bold font-mono">{x.qty_out}</td>
                    <td className="p-4">
                      <span className="inline-block text-2xs font-extrabold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                        {x.unit}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-black">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          x.remain === 0
                            ? 'bg-red-50 text-red-600'
                            : x.remain <= 5
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {x.remain}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{x.req || '-'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteItemIndex(i)}
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
