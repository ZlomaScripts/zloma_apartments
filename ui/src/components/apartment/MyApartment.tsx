import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { OverviewTab } from './OverviewTab';
import { SafeTab } from './SafeTab';
import { RoommateTab } from './RoommateTab';
import { SecurityTab } from './SecurityTab';
import { LayoutDashboard, ShieldCheck, Users, LogOut, Lock } from 'lucide-react';
import { ApartmentTabId } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fetchNUI } from '@/hooks/useNUI';
import { toast } from '@/components/ui/Toast';
import { useT } from '@/i18n';

export function MyApartment() {
  const t = useT();
  const { myApartment, setMyApartment, setActiveTab, activeApartmentTab, setActiveApartmentTab, features, hotel, setRoomStatus } = useStore();
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!myApartment) return null;

  const isOwner = myApartment.is_owner;
  const isContract = myApartment.rent_type === 'contract';
  const isOwned = myApartment.status === 'owned';
  const canCancel = isOwner && !isContract && !isOwned;

  const leave = async () => {
    setLoading(true);
    const result = await fetchNUI(isOwner ? 'cancelRent' : 'leaveApartment', {});
    setLoading(false);
    if (result?.success) {
      if (isOwner && hotel?.id === myApartment.hotel_id) setRoomStatus(myApartment.room_number, 'free');
      setModal(false);
      setMyApartment(null);
      setActiveTab('browse');
    } else {
      toast.error(result?.error || t('error_generic'));
    }
  };

  const tabs: { id: ApartmentTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('tab_overview'), icon: <LayoutDashboard size={18} /> },
    ...(isOwner && features.safe ? [{ id: 'safe' as const, label: t('tab_safe'), icon: <ShieldCheck size={18} /> }] : []),
    ...(isOwner && features.security && myApartment.security ? [{ id: 'security' as const, label: t('tab_security'), icon: <Lock size={18} /> }] : []),
    ...(features.roommates ? [{ id: 'roommate' as const, label: t('tab_roommate'), icon: <Users size={18} /> }] : []),
  ];
  const tab = tabs.some(x => x.id === activeApartmentTab) ? activeApartmentTab : 'overview';

  return (
    <div className="h-full flex">
      <div className="w-64 bg-dark-950/40 border-r border-dark-700 flex flex-col p-4 shrink-0">
        <div className="mb-8 px-2">
          <h2 className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-2">{t('manage')}</h2>
          <div className="text-white font-semibold">{t('room_n', myApartment.room_number)}</div>
          {myApartment.hotel_label && <div className="text-dark-500 text-xs mt-1">{myApartment.hotel_label}</div>}
        </div>
        <div className="space-y-1">
          {tabs.map(x => (
            <button key={x.id} onClick={() => setActiveApartmentTab(x.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === x.id ? 'bg-dark-700 text-white' : 'text-dark-400 hover:bg-white/5 hover:text-white'}`}>
              {x.icon}{x.label}
            </button>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-dark-700/50">
          <button onClick={() => setModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-400/80 hover:text-danger-400 hover:bg-danger-500/10 transition-all border border-transparent hover:border-danger-500/20">
            <LogOut size={18} />
            {isOwner ? t('cancel_rent') : t('leave_apartment')}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'safe' && <SafeTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'roommate' && <RoommateTab />}
      </div>

      <Modal isOpen={modal} onClose={() => !loading && setModal(false)} title={isOwner ? t('cancel_rent') : t('leave_apartment')}>
        <div className="text-center py-4">
          {isOwner && !canCancel ? (
            <>
              <p className="text-dark-300 mb-6">{isContract ? t('cancel_contract_blocked') : t('cancel_owned_blocked')}</p>
              <Button variant="secondary" className="w-full" onClick={() => setModal(false)}>{t('ok')}</Button>
            </>
          ) : (
            <>
              <p className="text-dark-300 mb-6">{isOwner ? t('cancel_rent_confirm') : t('leave_confirm')}</p>
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={() => setModal(false)} disabled={loading}>{t('cancel')}</Button>
                <Button variant="danger" className="flex-1" onClick={leave} isLoading={loading}>{isOwner ? t('cancel_rent_button') : t('leave_apartment')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
