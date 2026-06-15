import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import YearModal from './components/YearModal';
import CatChoiceModal from './components/CatChoiceModal';
import DashboardSection from './components/DashboardSection';
import StoreSection from './components/StoreSection';
import CategorySection from './components/CategorySection';
import CardsSection from './components/CardsSection';
import HistorySection from './components/HistorySection';
import { StoreInventory, StoreLog, CardsLogItem, GlobalDB } from './types';

export default function App() {
  // ─── LOCAL STORAGE PERSISTENCE LAZY INITIALIZERS ───
  const [activeYear, setActiveYear] = useState<string>(() => {
    return localStorage.getItem('activeYear') || String(new Date().getFullYear());
  });

  const [years, setYears] = useState<string[]>(() => {
    const raw = localStorage.getItem('invYears');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return ['2025', '2026'];
  });

  const [store, setStore] = useState<StoreInventory>(() => {
    const raw = localStorage.getItem('invStore');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return {};
  });

  const [storeLog, setStoreLog] = useState<StoreLog[]>(() => {
    const raw = localStorage.getItem('invStoreLog');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  const [cardsLog, setCardsLog] = useState<CardsLogItem[]>(() => {
    const raw = localStorage.getItem('invCardsLog');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  const [globalDB, setGlobalDB] = useState<GlobalDB>(() => {
    const raw = localStorage.getItem('invDB3');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return {};
  });

  // ─── NAVIGATION STATE ───
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals visibility
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isCatChoiceOpen, setIsCatChoiceOpen] = useState(false);
  const [pendingStoreItem, setPendingStoreItem] = useState<{
    name: string;
    supplier: string;
    qty: number;
    unit: string;
    cardtype: string;
  } | null>(null);

  // ─── STATE SYNCERS TO LOCALSTORAGE ───
  useEffect(() => {
    document.title = 'بەڕێوەبردنی کۆگا - Inventory Management System';
  }, []);

  useEffect(() => {
    localStorage.setItem('activeYear', activeYear);
  }, [activeYear]);

  useEffect(() => {
    localStorage.setItem('invYears', JSON.stringify(years));
  }, [years]);

  useEffect(() => {
    localStorage.setItem('invStore', JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    localStorage.setItem('invStoreLog', JSON.stringify(storeLog));
  }, [storeLog]);

  useEffect(() => {
    localStorage.setItem('invCardsLog', JSON.stringify(cardsLog));
  }, [cardsLog]);

  useEffect(() => {
    localStorage.setItem('invDB3', JSON.stringify(globalDB));
  }, [globalDB]);

  // Ensure active year is recognized in years list
  useEffect(() => {
    if (!years.includes(activeYear)) {
      setYears((prev) => {
        const next = [...prev, activeYear].sort((a, b) => b.localeCompare(a));
        return next;
      });
    }
  }, [activeYear, years]);

  // ─── YEAR MANAGEMENT ACTION HANDLERS ───
  const handleSelectYear = (yr: string) => {
    setActiveYear(yr);
  };

  const handleAddYear = (yr: string) => {
    if (!years.includes(yr)) {
      setYears((prev) => [yr, ...prev].sort((a, b) => b.localeCompare(a)));
      setActiveYear(yr);
    }
  };

  // ─── WAREHOUSE STORE INBOUND CAT OPTIONS RESOLVER ───
  const handleOpenCatChoice = (item: {
    name: string;
    supplier: string;
    qty: number;
    unit: string;
    cardtype: string;
  }) => {
    setPendingStoreItem(item);
    setIsCatChoiceOpen(true);
  };

  const handleChoiceConfirm = (category: string) => {
    if (!pendingStoreItem) return;

    const { name, supplier, qty, unit, cardtype } = pendingStoreItem;

    // Check existing item details
    const existing = store[name];
    const originalStock = existing?.stock ?? 0;
    const finalStockSum = originalStock + qty;

    const updatedItem = {
      stock: finalStockSum,
      supplier: supplier || existing?.supplier || '-',
      unit: unit || existing?.unit || 'دانە',
      cat: category || existing?.cat || '',
      cardtype: cardtype || existing?.cardtype || '',
    };

    setStore((prev) => ({
      ...prev,
      [name]: updatedItem,
    }));

    // Record action log
    const categoryLabels: { [key: string]: string } = {
      stationery: 'قڕتاسیە',
      cleaning: 'خاوێن کردنەوە',
      food: 'خواردن',
    };

    const newLog: StoreLog = {
      name,
      supplier,
      qty_in: qty,
      qty_out: 0,
      unit,
      cardtype,
      type: 'زیادکردن',
      cat: category ? categoryLabels[category] : 'گشتی',
      date: new Date().toISOString().slice(0, 10),
      stock_after: finalStockSum,
      ts: Date.now(),
    };

    setStoreLog((prev) => [newLog, ...prev]);

    setIsCatChoiceOpen(false);
    setPendingStoreItem(null);
  };

  const handleDeleteStoreLog = (idx: number) => {
    if (confirm('تکایە دڵنیایت لە سڕینەوەی ئەم تۆماری مێژووییەی کۆگا؟')) {
      setStoreLog((prev) => {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      });
    }
  };

  // Switch tabs navigations
  const TABS = [
    { id: 'dashboard', label: '📊 داشبۆرد', borderClass: 'border-b-indigo-600 border-b-2 text-indigo-700' },
    { id: 'store', label: '🏪 کۆگای عەمبار', borderClass: 'border-b-emerald-600 border-b-2 text-emerald-700' },
    { id: 'stationery', label: '✏️ قڕتاسیە', borderClass: 'border-b-indigo-700 border-b-2 text-indigo-800' },
    { id: 'cleaning', label: '🧹 خاوێنکردنەوە', borderClass: 'border-b-cyan-600 border-b-2 text-cyan-700' },
    { id: 'food', label: '🍽️ خواردن', borderClass: 'border-b-amber-600 border-b-2 text-amber-700' },
    { id: 'cards', label: '🪪 کارتەکان', borderClass: 'border-b-violet-600 border-b-2 text-violet-700' },
    { id: 'history', label: '🕐 مێژوو', borderClass: 'border-b-slate-600 border-b-2 text-slate-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12 select-none">
      {/* Navigation Top Header */}
      <Navbar
        activeTabLabel={TABS.find((t) => t.id === activeTab)?.label || 'کۆنترۆڵ'}
        activeYear={activeYear}
        onOpenYearModal={() => setIsYearModalOpen(true)}
      />

      {/* Tabs Menu Selection (RTL responsive horizontal slider) */}
      <div className="bg-white border-b border-slate-100 flex items-center justify-start overflow-x-auto no-print">
        <div className="mx-auto max-w-7xl w-full px-4 md:px-6 flex scrollbar-none whitespace-nowrap">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-5 font-bold text-xs md:text-sm transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? tab.borderClass
                    : 'border-b-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sections render router */}
      <main className="mx-auto max-w-7xl w-full px-4 md:px-6 mt-6 flex-1">
        {activeTab === 'dashboard' && (
          <DashboardSection
            store={store}
            globalDB={globalDB}
            cardsLog={cardsLog}
            activeYear={activeYear}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'store' && (
          <StoreSection
            store={store}
            setStore={setStore}
            storeLog={storeLog}
            setStoreLog={setStoreLog}
            onOpenCatChoice={handleOpenCatChoice}
            onDeleteLog={handleDeleteStoreLog}
          />
        )}

        {activeTab === 'stationery' && (
          <CategorySection
            cat="stationery"
            label="قڕتاسیە"
            themeColor="indigo"
            activeYear={activeYear}
            store={store}
            setStore={setStore}
            globalDB={globalDB}
            setGlobalDB={setGlobalDB}
            setStoreLog={setStoreLog}
          />
        )}

        {activeTab === 'cleaning' && (
          <CategorySection
            cat="cleaning"
            label="خاوێن کردنەوە"
            themeColor="cyan"
            activeYear={activeYear}
            store={store}
            setStore={setStore}
            globalDB={globalDB}
            setGlobalDB={setGlobalDB}
            setStoreLog={setStoreLog}
          />
        )}

        {activeTab === 'food' && (
          <CategorySection
            cat="food"
            label="خواردن"
            themeColor="amber"
            activeYear={activeYear}
            store={store}
            setStore={setStore}
            globalDB={globalDB}
            setGlobalDB={setGlobalDB}
            setStoreLog={setStoreLog}
          />
        )}

        {activeTab === 'cards' && (
          <CardsSection
            store={store}
            setStore={setStore}
            cardsLog={cardsLog}
            setCardsLog={setCardsLog}
            setStoreLog={setStoreLog}
            activeYear={activeYear}
          />
        )}

        {activeTab === 'history' && (
          <HistorySection
            globalDB={globalDB}
            activeYear={activeYear}
          />
        )}
      </main>

      {/* Modal Dialog Boxes */}
      <YearModal
        isOpen={isYearModalOpen}
        years={years}
        activeYear={activeYear}
        onSelectYear={handleSelectYear}
        onAddYear={handleAddYear}
        onClose={() => setIsYearModalOpen(false)}
      />

      <CatChoiceModal
        isOpen={isCatChoiceOpen}
        itemName={pendingStoreItem?.name || ''}
        onChoice={handleChoiceConfirm}
        onClose={() => {
          setIsCatChoiceOpen(false);
          setPendingStoreItem(null);
        }}
      />
    </div>
  );
}
