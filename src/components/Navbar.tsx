import { Calendar, PackageOpen } from 'lucide-react';

interface NavbarProps {
  activeTabLabel: string;
  activeYear: string;
  onOpenYearModal: () => void;
}

export default function Navbar({
  activeTabLabel,
  activeYear,
  onOpenYearModal,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-linear-to-r from-indigo-700 to-blue-600 px-4 md:px-6 py-3 shadow-lg no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md shadow-inner">
            <PackageOpen className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2">
              سیستەمی بەڕێوەبردنی کەلوپەل
              <span className="hidden sm:inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white tracking-wide">
                {activeTabLabel}
              </span>
            </h1>
          </div>
        </div>

        {/* Year Badge */}
        <button
          onClick={onOpenYearModal}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs md:text-sm font-extrabold text-indigo-700 shadow-md hover:bg-slate-50 transition-all hover:scale-102 active:scale-98 cursor-pointer border-none"
        >
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span>ساڵی چالاک: {activeYear}</span>
        </button>
      </div>
    </nav>
  );
}
