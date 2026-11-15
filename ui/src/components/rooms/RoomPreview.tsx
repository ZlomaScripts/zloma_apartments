import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { roomImageSource } from '@/roomImages';
import { useStore } from '@/store/useStore';
import { Room } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Check, Calendar, FileSignature, Landmark, DoorClosed } from 'lucide-react';
import { money, useT } from '@/i18n';

function RoomPhoto({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-dark-900 border border-dark-700/50 flex items-center justify-center mb-5">
      {src && !failed ? (
        // Bundled preset image or a direct admin URL; no Next image proxy in FiveM NUI.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : <DoorClosed className="w-12 h-12 text-dark-600" />}
    </div>
  );
}

export function RoomPreview({ room }: { room: Room }) {
  const t = useT();
  const { hotel, setBookingRoom, myApartment, setActiveTab, features } = useStore();
  const isMine = myApartment?.hotel_id === hotel?.id && myApartment?.room_number === room.room_number;
  const p = hotel?.pricing;
  const photo = roomImageSource(room.image_url ?? hotel?.imageUrl);
  const included = [t('feature_furnished'), t('feature_door_lock'), ...(features.safe ? [t('feature_safe')] : []), ...(features.roommates ? [t('feature_roommate')] : [])];
  const prices = !hotel || !p ? [] : [
    hotel.enablePrepaid && { icon: <Calendar className="w-4 h-4" />, label: t('pay_prepaid'), value: money(p.daily) + t('per_day') },
    hotel.enableContract && { icon: <FileSignature className="w-4 h-4" />, label: t('pay_contract'), value: money(p.contractDaily) + t('per_day') },
    hotel.enableBuy && { icon: <Landmark className="w-4 h-4" />, label: t('pay_buy'), value: money(p.buy) },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="h-full flex flex-col bg-dark-950/40">
      <div className="p-6 border-b border-dark-700/50">
        <RoomPhoto key={photo || 'no-photo'} src={photo} alt={t('room_n', room.room_number)} />
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">{t('room_n', room.room_number)}</h3>
          <Badge status={room.status} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="pill">{t('floor_n', room.floor)}</span>
          {hotel && <span className="pill">{hotel.label}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {hotel?.description && <p className="text-sm text-dark-400 leading-relaxed">{hotel.description}</p>}
        <div>
          <p className="label mb-3">{t('included')}</p>
          <ul className="space-y-2">
            {included.map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-dark-200"><Check className="w-4 h-4 text-success-500" /> {item}</li>
            ))}
          </ul>
        </div>
        {room.status === 'free' && prices.length > 0 && (
          <div>
            <p className="label mb-3">{t('prices')}</p>
            <div className="card divide-y divide-dark-700/50">
              {prices.map(x => (
                <div key={x.label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-dark-400">{x.icon}{x.label}</span>
                  <span className="text-white font-medium">{x.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-dark-700/50">
        {isMine ? (
          <button className="btn btn-primary w-full" onClick={() => setActiveTab('myApartment')}>{t('manage_apartment')}</button>
        ) : room.status === 'free' && !myApartment ? (
          <button className="btn btn-primary w-full" onClick={() => setBookingRoom(room)}>{t('book_room')}</button>
        ) : (
          <button className="btn btn-secondary w-full" disabled>{room.status === 'free' ? t('already_have_apartment') : t('room_taken')}</button>
        )}
      </div>
    </div>
  );
}
