import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { User, DoorClosed } from 'lucide-react';
import { useT } from '@/i18n';
import { sendNUIClose } from '@/hooks/useNUI';

export function StatusBar() {
  const t = useT();
  const { playerName, myApartment } = useStore();
  return (
    <div className="px-6 py-3 border-t border-dark-700 flex items-center justify-between">
      <div className="flex items-center gap-5 text-sm text-dark-400">
        <span className="flex items-center gap-2"><User className="w-4 h-4" />{playerName}</span>
        {myApartment && (
          <span className="flex items-center gap-2">
            <DoorClosed className="w-4 h-4" />
            {t('room_short', myApartment.room_number)}{myApartment.hotel_label ? ` · ${myApartment.hotel_label}` : ''}
          </span>
        )}
      </div>
      <button className="btn btn-secondary btn-sm" onClick={() => sendNUIClose()}>{t('close')}</button>
    </div>
  );
}
