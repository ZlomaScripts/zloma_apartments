import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { Home, Building2, X, Wallet } from 'lucide-react';
import { TabId } from '@/types';
import { money, useT } from '@/i18n';
import { sendNUIClose } from '@/hooks/useNUI';

export function TabBar() {
  const t = useT();
  const { activeTab, setActiveTab, hotel, myApartment, playerMoney } = useStore();
  const tabs: { id: TabId; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'browse', label: t('tab_browse'), icon: <Building2 className="w-4 h-4" /> },
    { id: 'myApartment', label: t('tab_my_apartment'), icon: <Home className="w-4 h-4" />, disabled: !myApartment },
  ];
  return (
    <>
      <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between relative">
        <button onClick={() => sendNUIClose()} className="btn-icon" aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <h2 className="text-xl font-bold text-white">{hotel?.label}</h2>
          <p className="text-sm text-dark-400">{t('header_subtitle', hotel?.floors ?? 0, (hotel?.floors ?? 0) * (hotel?.roomsPerFloor ?? 0))}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-sm">
          <Wallet className="w-4 h-4 text-dark-400" />
          <span className="text-white font-semibold">{money(playerMoney)}</span>
        </div>
      </div>
      <div className="px-6 py-2 border-b border-dark-700/50 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed
              ${activeTab === tab.id ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
