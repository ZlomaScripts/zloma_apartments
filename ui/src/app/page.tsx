'use client';

import { assertResourceName } from '@/resourceName';
assertResourceName();

import { SafePinDialog, useSafePin } from '@/components/apartment/SafePinDialog';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useNUIMessage, sendNUIClose } from '@/hooks/useNUI';
import { useI18n } from '@/i18n';
import { TabBar } from '@/components/layout/TabBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { RoomBrowser } from '@/components/rooms/RoomBrowser';
import { MyApartment } from '@/components/apartment/MyApartment';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { ToastContainer } from '@/components/ui/Toast';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { DoorpickHud } from '@/components/doorpick/DoorpickHud';
import { handleAdminMessage, useAdminStore } from '@/components/admin/state';

export default function Home() {
  const { isOpen, bookingRoom, activeTab, open, close } = useStore();
  const setLocale = useI18n((s) => s.setLocale);
  const adminActive = useAdminStore(s => s.active);

  useNUIMessage((data) => {
    switch (data.action) {
      case 'openMainUI':
        setLocale(data.data.locale, data.data.lang);
        open(data.data);
        break;
      case 'openSafePin':
        setLocale(data.locale, data.lang);
        close();
        useSafePin.getState().open({ requestId: data.requestId, setup: data.setup, pinLength: data.pinLength });
        break;
      case 'closeSafePin':
        useSafePin.getState().close();
        break;
      case 'closeUI':
        useSafePin.getState().close();
        close();
        break;
      case 'admin':
        handleAdminMessage(data.message || {});
        break;
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useSafePin.getState().session && !useAdminStore.getState().active && useStore.getState().isOpen) sendNUIClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <AdminPanel />
      <DoorpickHud />
      <SafePinDialog />
      {isOpen && !adminActive && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
          <ToastContainer />
          <div className="glass-dark rounded-2xl overflow-hidden flex flex-col w-[95vw] max-w-[1400px] h-[85vh] max-h-[860px] relative animate-scale-in">
            <TabBar />
            <div className="flex-1 overflow-hidden relative">
              {bookingRoom ? <BookingFlow /> : activeTab === 'browse' ? <RoomBrowser /> : <MyApartment />}
            </div>
            <StatusBar />
          </div>
        </div>
      )}
    </>
  );
}
