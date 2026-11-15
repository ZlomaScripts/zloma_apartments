import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { fetchNUI } from '@/hooks/useNUI';
import { PaymentType } from '@/types';
import { money, useT } from '@/i18n';

export function StepConfirm({ paymentType, days, onBack }: { paymentType: PaymentType; days: number; onBack: () => void }) {
  const t = useT();
  const { bookingRoom, hotel, playerMoney, setActiveTab, setMyApartment, setBookingRoom, setPlayerMoney, setRoomStatus } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!bookingRoom || !hotel) return null;

  const p = hotel.pricing;
  const total = paymentType === 'buy' ? p.buy : paymentType === 'prepaid' ? p.daily : p.contractDaily * days;
  const description = paymentType === 'buy' ? t('confirm_buy') : paymentType === 'prepaid' ? t('confirm_prepaid') : t('confirm_contract', days);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchNUI('rentOrBuy', { hotel_id: hotel.id, room_number: bookingRoom.room_number, payment_type: paymentType, days });
    setLoading(false);
    if (result?.success) {
      setMyApartment({ ...result.room, hotel_label: hotel.label });
      setRoomStatus(bookingRoom.room_number, result.room.status);
      setPlayerMoney(playerMoney - (result.totalPaid || 0));
      setBookingRoom(null);
      setActiveTab('myApartment');
    } else {
      setError(result?.error || t('error_generic'));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('confirm_title')}</h2>
        <p className="text-dark-400">{t('confirm_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-dark-900/60 rounded-lg p-4 border border-dark-700/50 h-fit">
          <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-2">{t('apartment')}</h3>
          <div className="text-xl font-bold text-white">{t('room_n', bookingRoom.room_number)}</div>
          <div className="text-sm text-dark-500">{t('floor_n', bookingRoom.floor)} · {hotel.label}</div>
        </div>
        <div className="bg-dark-900/60 rounded-lg p-6 border border-dark-700/50 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">{t('payment_details')}</h3>
          <div className="flex justify-between text-sm flex-1">
            <span className="text-dark-400">{description}</span>
            <span className="text-white">{money(total)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-700/50">
            <div className="flex justify-between items-end mb-2">
              <span className="text-dark-400">{t('total_today')}</span>
              <span className="text-2xl font-bold text-success-400">{money(total)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-500">{t('your_balance')}</span>
              <span className={playerMoney >= total ? 'text-dark-300' : 'text-danger-400'}>{money(playerMoney)}</span>
            </div>
          </div>
        </div>
      </div>
      {error && <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg text-danger-400 text-sm text-center">{error}</div>}
      <div className="flex justify-between pt-6 border-t border-dark-700/50">
        <Button variant="ghost" onClick={onBack} disabled={loading}>{t('back')}</Button>
        <Button onClick={confirm} disabled={loading || playerMoney < total} isLoading={loading}>
          {t('confirm_pay')}
        </Button>
      </div>
    </div>
  );
}
