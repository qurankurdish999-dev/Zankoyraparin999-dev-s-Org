import { useState } from 'react';
import { motion } from 'motion/react';
import { FileDown, ChevronDown, ChevronUp, CalendarRange } from 'lucide-react';
import { GlobalDB } from '../types';
import { printHTML } from '../utils/printHelper';

interface HistorySectionProps {
  globalDB: GlobalDB;
  activeYear: string;
}

export default function HistorySection({ globalDB, activeYear }: HistorySectionProps) {
  const [expandedYear, setExpandedYear] = useState<string | null>(activeYear);

  const yearsList = Object.keys(globalDB).sort((a, b) => b.localeCompare(a));

  const toggleYear = (yr: string) => {
    setExpandedYear(expandedYear === yr ? null : yr);
  };

  const handlePrintAllHistory = () => {
    if (!yearsList.length) {
      alert('هیچ داتایەک لە مێژوودا نیە.');
      return;
    }

    const categories = [
      { id: 'stationery', label: '✏️ قڕتاسیە', color: '#6366f1' },
      { id: 'cleaning', label: '🧹 خاوێنکردنەوە', color: '#0891b2' },
      { id: 'food', label: '🍽️ خواردن', color: '#d97706' },
    ] as const;

    let fullHTMLContent = '';

    yearsList.forEach((yr) => {
      const yrData = globalDB[yr] || {};

      categories.forEach((cat) => {
        const list = yrData[cat.id] || [];
        if (!list.length) return;

        const rows = list.map((x, i) => {
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
              <td class="num">${x.unit || 'دانە'}</td>
              <td class="num ${remainClass}">${x.remain}</td>
              <td>${x.req || '-'}</td>
            </tr>
          `;
        }).join('');

        fullHTMLContent += `
          <div class="page" style="page-break-after: always; margin-bottom: 30px;">
            <div class="hdr" style="background: ${cat.color};">
              <h1>📊 بەشی ${cat.label} — ساڵی ${yr}</h1>
            </div>
            <div class="meta">
              <span>ساڵ: ${yr}</span>
              <span>کۆی تۆمارەکان: ${list.length}</span>
              <span>کۆی مەنھاف: ${list.reduce((acc, curr) => acc + curr.qty_out, 0)}</span>
            </div>
            <table>
              <thead>
                <tr style="background: ${cat.color};">
                  <th class="num">#</th>
                  <th>ناوی بابەت</th>
                  <th class="num">بەروار</th>
                  <th>وەرگر / پێدراو بە</th>
                  <th class="num">بڕی دەرچوو</th>
                  <th>یەکە</th>
                  <th class="num">ماوە لە کۆگا</th>
                  <th>داواکاری / پڕۆژە</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="ftr">مێژووی خوولەکانی بەڕێوەبردنی کەلوپەلەکان — ساڵی ${yr}</div>
          </div>
        `;
      });
    });

    if (!fullHTMLContent) {
      alert('هیچ دەرچوونێک لە هیچ بەشێک تۆمار نەکراوە.');
      return;
    }

    printHTML(fullHTMLContent, 'Inventory-Full-History-Report');
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="text-lg">🕐</span>
            مێژووی تۆمارەکانی ساڵان
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">بڕوانە و بەدواداچوون بکە بۆ گشت دەرچوونەکانی ساڵانی پێشتر</p>
        </div>
        <button
          onClick={handlePrintAllHistory}
          className="rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4.5 text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border-none"
        >
          <FileDown className="h-4.5 w-4.5" />
          داونلۆدی سەرجەم مێژووەکان
        </button>
      </div>

      {/* Accordion List for Years */}
      {yearsList.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 font-semibold text-sm shadow-2xs">
          هیچ مێژوویەک بۆ ساڵان تۆمار نەکراوە...
        </div>
      ) : (
        <div className="space-y-4">
          {yearsList.map((yr) => {
            const isExpanded = expandedYear === yr;
            const yrData = globalDB[yr] || {};
            const stationeryList = yrData.stationery || [];
            const cleaningList = yrData.cleaning || [];
            const foodList = yrData.food || [];

            const totalYrCheckouts = stationeryList.length + cleaningList.length + foodList.length;

            return (
              <div
                key={yr}
                className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden"
              >
                {/* Year Header Accordion Trigger */}
                <button
                  onClick={() => toggleYear(yr)}
                  className="w-full flex items-center justify-between p-4.5 hover:bg-slate-50/50 transition-all text-right font-extrabold text-slate-800 cursor-pointer border-none"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarRange className="h-5 w-5 text-indigo-500" />
                    <span>مێژووی ساڵی {yr}</span>
                    {yr === activeYear && (
                      <span className="text-4xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 select-none">
                        چالاک
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-2xs font-bold text-slate-400">
                      کۆی گشتی تۆمار: {totalYrCheckouts} دانە
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Sub Lists */}
                {isExpanded && (
                  <div className="p-4.5 border-t border-slate-50 bg-slate-50/20 space-y-6">
                    {totalYrCheckouts === 0 ? (
                      <div className="text-center text-slate-400 text-xs py-4 font-semibold">
                        هیچ مەنھافێک بۆ ئەم ساڵە تۆمار نەکراوە.
                      </div>
                    ) : (
                      <>
                        {/* Stationery Table */}
                        {stationeryList.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                              ✏️ قڕتاسیە — {stationeryList.length} تۆمار
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                                  <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">ناوی کەلوپەل</th>
                                    <th className="p-3">بەروار</th>
                                    <th className="p-3">پێدراو بە</th>
                                    <th className="p-3">بڕی دەرچوو</th>
                                    <th className="p-3">یەکە</th>
                                    <th className="p-3">ماوە لە کۆگا</th>
                                    <th className="p-3 font-medium">داواکار بەش</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                                  {stationeryList.map((x, i) => (
                                    <tr key={x.ts} className="hover:bg-slate-50/40">
                                      <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                      <td className="p-3 font-bold text-slate-800">{x.name}</td>
                                      <td className="p-3 font-mono">{x.date}</td>
                                      <td className="p-3">{x.to}</td>
                                      <td className="p-3 text-slate-900 font-mono font-black">{x.qty_out}</td>
                                      <td className="p-3">{x.unit}</td>
                                      <td className={`p-3 font-mono font-bold ${x.remain === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{x.remain}</td>
                                      <td className="p-3 text-slate-400 font-medium">{x.req || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Cleaning Table */}
                        {cleaningList.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg inline-block">
                              🧹 خاوێنکردنەوە — {cleaningList.length} تۆمار
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                                  <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">ناوی کەلوپەل</th>
                                    <th className="p-3">بەروار</th>
                                    <th className="p-3">پێدراو بە</th>
                                    <th className="p-3">بڕی دەرچوو</th>
                                    <th className="p-3">یەکە</th>
                                    <th className="p-3">ماوە لە کۆگا</th>
                                    <th className="p-3 font-medium">داواکار بەش</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                                  {cleaningList.map((x, i) => (
                                    <tr key={x.ts} className="hover:bg-slate-50/40">
                                      <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                      <td className="p-3 font-bold text-slate-800">{x.name}</td>
                                      <td className="p-3 font-mono">{x.date}</td>
                                      <td className="p-3">{x.to}</td>
                                      <td className="p-3 text-slate-900 font-mono font-black">{x.qty_out}</td>
                                      <td className="p-3">{x.unit}</td>
                                      <td className={`p-3 font-mono font-bold ${x.remain === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{x.remain}</td>
                                      <td className="p-3 text-slate-400 font-medium">{x.req || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Food Table */}
                        {foodList.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg inline-block">
                              🍽️ خواردن — {foodList.length} تۆمار
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                                  <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">ناوی کەلوپەل</th>
                                    <th className="p-3">بەروار</th>
                                    <th className="p-3">پێدراو بە</th>
                                    <th className="p-3">بڕی دەرچوو</th>
                                    <th className="p-3">یەکە</th>
                                    <th className="p-3">ماوە لە کۆگا</th>
                                    <th className="p-3 font-medium">داواکار بەش</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                                  {foodList.map((x, i) => (
                                    <tr key={x.ts} className="hover:bg-slate-50/40">
                                      <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                      <td className="p-3 font-bold text-slate-800">{x.name}</td>
                                      <td className="p-3 font-mono">{x.date}</td>
                                      <td className="p-3">{x.to}</td>
                                      <td className="p-3 text-slate-900 font-mono font-black">{x.qty_out}</td>
                                      <td className="p-3">{x.unit}</td>
                                      <td className={`p-3 font-mono font-bold ${x.remain === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{x.remain}</td>
                                      <td className="p-3 text-slate-400 font-medium">{x.req || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
