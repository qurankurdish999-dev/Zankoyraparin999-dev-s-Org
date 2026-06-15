import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, FileDown, Trash2 } from 'lucide-react';
import { StoreInventory, StoreLog, CardsLogItem } from '../types';
import { printHTML } from '../utils/printHelper';

interface CardsSectionProps {
  store: StoreInventory;
  setStore: React.Dispatch<React.SetStateAction<StoreInventory>>;
  cardsLog: CardsLogItem[];
  setCardsLog: React.Dispatch<React.SetStateAction<CardsLogItem[]>>;
  setStoreLog: React.Dispatch<React.SetStateAction<StoreLog[]>>;
  activeYear: string;
}

export default function CardsSection({
  store,
  setStore,
  cardsLog,
  setCardsLog,
  setStoreLog,
  activeYear,
}: CardsSectionProps) {
  // Form input states
  const [name, setName] = useState('');
  const [cardtype, setCardtype] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('دانە');
  const [req, setReq] = useState('');

  // Autocomplete UI
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats calculation
  const totalCardsOut = cardsLog.reduce((acc, curr) => acc + curr.qty_out, 0);
  const countByType: { [key: string]: number } = {
    ئاسیا: 0,
    کۆڕەک: 0,
    ئینتەرنێت: 0,
    تر: 0,
  };
  cardsLog.forEach((item) => {
    if (countByType[item.cardtype] !== undefined) {
      countByType[item.cardtype] += item.qty_out;
    } else if (item.cardtype) {
      countByType['تر'] += item.qty_out;
    }
  });

  // Query warehouse stock of card
  const activeStock = name.trim() ? store[name.trim()]?.stock ?? 0 : null;
  const activeUnit = name.trim() ? store[name.trim()]?.unit ?? 'دانە' : 'دانە';

  const handleCardOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cardtype || !to.trim() || !qty || Number(qty) <= 0) {
      alert('تکایە خانە داواکراوەکان بە تەواوی پڕ بکەرەوە.');
      return;
    }

    const outQty = Math.floor(Number(qty));
    const finalName = name.trim();
    const currentStock = store[finalName]?.stock ?? 0;

    if (currentStock < outQty) {
      const confirmProceed = confirm(
        `⚠️ بڕی کۆگا لەم کارتە بریتیە لە (${currentStock}) کە کەمترە لە بڕی داواکراو (${outQty}).\nدەتەوێت هەر بەردەوام بیت؟`
      );
      if (!confirmProceed) return;
    }

    // Deduct stock from warehouse
    const newStockRemaining = Math.max(0, currentStock - outQty);
    setStore((prev) => ({
      ...prev,
      [finalName]: {
        ...(prev[finalName] || { supplier: '', unit: 'دانە', cat: '', cardtype }),
        stock: newStockRemaining,
      },
    }));

    // Save to historical store logs list
    const timestamp = Date.now();
    const newStoreLogEntry: StoreLog = {
      name: finalName,
      qty_in: 0,
      qty_out: outQty,
      unit,
      cardtype,
      type: 'دەرچوونی کارت',
      to: to.trim(),
      req: req.trim(),
      date,
      stock_after: newStockRemaining,
      ts: timestamp,
    };
    setStoreLog((prev) => [newStoreLogEntry, ...prev]);

    // Save to specific card logs database
    const newCardLogItem: CardsLogItem = {
      name: finalName,
      cardtype,
      date,
      to: to.trim(),
      qty_out: outQty,
      unit,
      req: req.trim(),
      stock_after: newStockRemaining,
      ts: timestamp,
    };
    setCardsLog((prev) => [newCardLogItem, ...prev]);

    // Reset fields
    setName('');
    setCardtype('');
    setTo('');
    setQty('');
    setReq('');
    setShowSuggestions(false);
  };

  const handleDeleteCardLogIndex = (index: number) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم تۆماری کارتە؟')) {
      setCardsLog((prev) => {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });
    }
  };

  const getSuggestions = () => {
    return Object.entries(store)
      .filter(([itemName, details]) => {
        const matchesCategory = details.cardtype || details.cat === '';
        const matchesSearch = itemName.toLowerCase().includes(name.toLowerCase());
        const isSelf = itemName.toLowerCase() === name.toLowerCase();
        return matchesCategory && matchesSearch && !isSelf;
      })
      .map(([itemName]) => itemName)
      .slice(0, 5);
  };

  // Custom pill coloring class
  const getCardStyleClass = (type: string) => {
    switch (type) {
      case 'ئاسیا':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'کۆڕەک':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ئینتەرنێت':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // HTML Print Report
  const handleExportCardsPDF = () => {
    if (!cardsLog.length) {
      alert('هیچ تۆمارێک نیە بۆ پرینتکردن.');
      return;
    }

    const rows = cardsLog.map((x, i) => {
      const remainsVal = x.stock_after ?? '-';
      const isZero = remainsVal === 0;
      const isLow = typeof remainsVal === 'number' && remainsVal > 0 && remainsVal <= 5;
      const remainsClass = remainsVal === '-' ? '' : isZero ? 'zero' : isLow ? 'low' : 'ok';

      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td><strong>${x.name}</strong></td>
          <td class="num">${x.date || '-'}</td>
          <td>${x.cardtype || '-'}</td>
          <td>${x.to || '-'}</td>
          <td class="num font-bold">${x.qty_out}</td>
          <td><span class="badge" style="background:#e2e8f0;color:#334155;">${x.unit || 'دانە'}</span></td>
          <td>${x.req || '-'}</td>
          <td class="num ${remainsClass}">${remainsVal}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div class="page">
        <div class="hdr" style="background: #7c3aed;">
          <h1>🪪 ڕاپۆرتی دەرچوونی کارتەکان (مۆبایل و ئینتەرنێت)</h1>
        </div>
        <div class="meta">
          <span>بەرواری پرینت: ${new Date().toLocaleDateString('en-GB')}</span>
          <span>کۆیی کارتە دەرچووەکان: ${totalCardsOut} دانە</span>
          <span>ساڵی چالاکی دەرچوون: ${activeYear}</span>
        </div>
        <table>
          <thead>
            <tr style="background: #7c3aed;">
              <th class="num">#</th>
              <th>ناوی کارت</th>
              <th class="num">بەروار</th>
              <th>جۆری کارت</th>
              <th>پێدراو بە</th>
              <th class="num">بڕی دەرچوو</th>
              <th>یەکە</th>
              <th>داواکاری</th>
              <th class="num">ماوە لە کۆگا</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="ftr">سیستەمی بەڕێوەبردنی کەلوپەل — ڕاپۆرتی کارتەکانی گواستنەوە و ئینتەرنێت</div>
      </div>
    `;

    printHTML(htmlContent, `Cards-Out-Report-${activeYear}`);
  };

  const filteredLogs = cardsLog.filter((x) => {
    const q = searchQuery.toLowerCase();
    return (
      x.name.toLowerCase().includes(q) ||
      x.to.toLowerCase().includes(q) ||
      x.cardtype.toLowerCase().includes(q) ||
      (x.req && x.req.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="text-lg">🪪</span>
            بەشی کارتە گشتییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">تۆمارکردن، چاودێریکردن و دەرچوونی کارتەکانی هێڵ و ئینتەرنێت</p>
        </div>
        <button
          onClick={handleExportCardsPDF}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-4.5 text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border-none"
        >
          <FileDown className="h-4.5 w-4.5" />
          داونلۆدی PDF کارتەکان
        </button>
      </div>

      {/* Grid of counters by card type */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-violet-500">
          <p className="text-3xs text-slate-400 font-extrabold mb-1">کۆی گشتی دەرچوون</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalCardsOut}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-amber-400">
          <p className="text-3xs text-amber-500 font-extrabold mb-1">ئاسیا وەرگیراو</p>
          <p className="text-2xl font-black text-amber-600 font-mono">{countByType['ئاسیا']}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-emerald-500">
          <p className="text-3xs text-emerald-500 font-extrabold mb-1">کۆڕەک وەرگیراو</p>
          <p className="text-2xl font-black text-emerald-600 font-mono">{countByType['کۆڕەک']}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-blue-400">
          <p className="text-3xs text-blue-500 font-extrabold mb-1">ئینتەرنێت وەرگیراو</p>
          <p className="text-2xl font-black text-blue-600 font-mono">{countByType['ئینتەرنێت']}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs border-r-4 border-r-slate-400">
          <p className="text-3xs text-slate-500 font-extrabold mb-1">کارتەکانی تر</p>
          <p className="text-2xl font-black text-slate-600 font-mono">{countByType['تر']}</p>
        </div>
      </div>

      {/* Form checkout cards */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block"></span>
          تۆمارکردنی دەرچوونی کارتێکی نوێ
        </h3>

        <form onSubmit={handleCardOutSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Auto-suggest search for Card Names */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                ناوی کارت یان فۆڕمەت <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ناوی کارت بنووسە..."
                required
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
              />

              {/* suggestions */}
              {showSuggestions && name.trim() && getSuggestions().length > 0 && (
                <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg py-1 divide-y divide-slate-50">
                  {getSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => {
                        setName(suggestion);
                        setShowSuggestions(false);
                        const matchType = store[suggestion]?.cardtype || '';
                        if (matchType) setCardtype(matchType);
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

            {/* Selector card type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                جۆری لایەنی کارت <span className="text-red-500">*</span>
              </label>
              <select
                value={cardtype}
                onChange={(e) => setCardtype(e.target.value)}
                required
                className="w-full rounded-xl border-1.5 border-slate-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-700 outline-hidden transition-all focus:border-violet-500"
              >
                <option value="">— هەڵبژێرە —</option>
                <option value="ئاسیا">ئاسیا</option>
                <option value="کۆڕەک">کۆڕەک</option>
                <option value="ئینتەرنێت">ئینتەرنێت</option>
                <option value="تر">تر</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                بەروار <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
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
                placeholder="دراوە بە کێ..."
                required
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Qty Out */}
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
                  className="w-2/3 rounded-xl border-1.5 border-slate-200 py-2.5 px-3 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 text-center font-mono"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-1/3 rounded-xl border-1.5 border-slate-200 bg-white py-2.5 px-2 text-xs font-bold text-slate-700 outline-hidden transition-all focus:border-violet-500"
                >
                  <option value="دانە">دانە</option>
                  <option value="کارتۆن">کارتۆن</option>
                </select>
              </div>
            </div>

            {/* Requesting officer */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">داواکاری / سەندکار</label>
              <input
                type="text"
                value={req}
                onChange={(e) => setReq(e.target.value)}
                placeholder="ناوی فەرمانبەری داواکار..."
                className="w-full rounded-xl border-1.5 border-slate-200 py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
              />
            </div>

            {/* Stock Level Preview (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">بڕی ماوەی ئەم کارتە لە کۆگا</label>
              <div className="w-full rounded-xl bg-slate-50 p-2 text-sm font-bold text-slate-700 border border-slate-100 flex items-center justify-between h-[45px]">
                <span className="text-slate-400 text-xs">ڕێژەی گشتی</span>
                <span className="text-violet-700 font-mono font-black">
                  {activeStock !== null ? `${activeStock} ${activeUnit}` : '— نوێیە —'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-2 border-none"
          >
            <Plus className="h-4.5 w-4.5" />
            تۆمارکردنی دەرچوونی کارت
          </button>
        </form>
      </div>

      {/* Cards checkout log table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block"></span>
            لیستی دەرچوونی کارتەکان لە کۆگا
          </h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی کارت یان وەرگر..."
              className="w-full rounded-xl border-1.5 border-slate-200 py-2 pr-9.5 pl-3.5 text-xs font-semibold text-slate-800 outline-hidden transition-all focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                <th className="p-4">#</th>
                <th className="p-4">ناوی کارت</th>
                <th className="p-4 text-center">بەروار</th>
                <th className="p-4">جۆری کارت</th>
                <th className="p-4">پێدراو بە</th>
                <th className="p-4">بڕی دەرچوو</th>
                <th className="p-4">یەکە</th>
                <th className="p-4">داواکاری / تێبینی</th>
                <th className="p-4 text-center">بڕی نوێی کۆگا</th>
                <th className="p-4">کردار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">هیچ دەرچوونێک بۆ کارتەکان تۆمار نەکراوە...</td>
                </tr>
              ) : (
                filteredLogs.map((x, i) => (
                  <tr key={x.ts} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{x.name}</td>
                    <td className="p-4 text-center font-mono text-slate-500">{x.date}</td>
                    <td className="p-4">
                      <span className={`inline-block font-black text-2xs px-2.5 py-0.5 rounded-full border ${getCardStyleClass(x.cardtype)}`}>
                        🪪 {x.cardtype}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{x.to}</td>
                    <td className="p-4 text-slate-900 font-bold font-mono">{x.qty_out}</td>
                    <td className="p-4">
                      <span className="inline-block text-3xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                        {x.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{x.req || '-'}</td>
                    <td className="p-4 text-center font-mono font-black">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          x.stock_after === 0
                            ? 'bg-red-50 text-red-600'
                            : x.stock_after <= 5
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {x.stock_after}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteCardLogIndex(i)}
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
