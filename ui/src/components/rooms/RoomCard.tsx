import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { Room } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { money, useT } from '@/i18n';

export function RoomCard({ room, isSelected, onClick }: { room: Room; isSelected: boolean; onClick: () => void }) {
  const t = useT();
  const { hotel, myApartment } = useStore();
  const isMine = myApartment?.hotel_id === hotel?.id && myApartment?.room_number === room.room_number;
  const p = hotel?.pricing;
  const price = !hotel || !p ? null
    : hotel.enablePrepaid ? { value: money(p.daily), unit: t('per_day') }
    : hotel.enableContract ? { value: money(p.contractDaily), unit: t('per_day') }
    : { value: money(p.buy), unit: '' };

  return (
    <button type="button" onClick={onClick} className={`card card-hover text-left px-4 py-3 flex flex-col gap-2 ${isSelected ? 'card-active' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-semibold text-base">#{room.room_number}</span>
        <Badge status={room.status} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="pill">{t('floor_n', room.floor)}</span>
        {isMine && <span className="pill text-white border-dark-500">{t('yours')}</span>}
      </div>
      <div className="pt-2 border-t border-dark-700/50 flex items-center justify-between text-sm">
        {room.status === 'free' && price ? (
          <>
            <span className="label">{t('from')}</span>
            <span className="text-white font-semibold">{price.value}<span className="text-dark-500 font-normal text-xs">{price.unit}</span></span>
          </>
        ) : (
          <span className="text-dark-500 text-xs">{t('occupied')}</span>
        )}
      </div>
    </button>
  );
}
