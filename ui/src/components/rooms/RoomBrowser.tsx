import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { RoomCard } from './RoomCard';
import { RoomFilters } from './RoomFilters';
import { RoomPreview } from './RoomPreview';
import { Pagination } from '@/components/ui/Pagination';
import { Building2 } from 'lucide-react';
import { useT } from '@/i18n';

const PER_PAGE = 12;

export function RoomBrowser() {
  const t = useT();
  const { rooms, filterStatus, filterFloor, searchQuery, sortBy, currentPage, setPage } = useStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const result = rooms.filter(r =>
      (filterStatus === 'all' || r.status === filterStatus) &&
      (filterFloor === null || r.floor === filterFloor) &&
      (!searchQuery || r.room_number.toString().includes(searchQuery.trim())));
    result.sort((a, b) => sortBy === 'room_desc' ? b.room_number - a.room_number
      : sortBy === 'floor_asc' ? a.floor - b.floor || a.room_number - b.room_number
      : a.room_number - b.room_number);
    return result;
  }, [rooms, filterStatus, filterFloor, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selected = filtered.find(r => r.room_number === selectedId) || visible[0] || null;

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <RoomFilters count={filtered.length} />
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Building2 className="w-12 h-12 text-dark-600 mb-3" />
              <p className="text-dark-300 font-medium">{t('no_rooms_found')}</p>
              <p className="text-sm text-dark-500 mt-1">{t('change_filters')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {visible.map(room => (
                <RoomCard key={room.room_number} room={room} isSelected={selected?.room_number === room.room_number} onClick={() => setSelectedId(room.room_number)} />
              ))}
            </div>
          )}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
      <div className="w-[380px] shrink-0 border-l border-dark-700">
        {selected && <RoomPreview room={selected} />}
      </div>
    </div>
  );
}
