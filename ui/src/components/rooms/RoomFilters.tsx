import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FilterStatus, SortBy } from '@/types';
import { useT } from '@/i18n';

export function RoomFilters({ count }: { count: number }) {
  const t = useT();
  const { filterStatus, filterFloor, searchQuery, sortBy, setFilter, hotel } = useStore();
  const floors = Array.from({ length: hotel?.floors || 1 }, (_, i) => i + 1);
  return (
    <div className="px-5 pt-4 pb-3 space-y-3 border-b border-dark-700/50">
      <Input placeholder={t('search_room')} value={searchQuery} inputMode="numeric"
        onChange={(e) => setFilter('searchQuery', e.target.value.replace(/\D/g, ''))} icon={<Search className="w-4 h-4" />} />
      <div className="flex items-center gap-4 text-xs text-dark-400">
        <label className="flex items-center gap-2">
          {t('status')}:
          <select className="select" value={filterStatus} onChange={(e) => setFilter('filterStatus', e.target.value as FilterStatus)}>
            <option value="all">{t('filter_all_statuses')}</option>
            <option value="free">{t('status_free')}</option>
            <option value="rented">{t('status_rented')}</option>
            <option value="owned">{t('status_owned')}</option>
          </select>
        </label>
        {floors.length > 1 && (
          <label className="flex items-center gap-2">
            {t('floor')}:
            <select className="select" value={filterFloor ?? ''} onChange={(e) => setFilter('filterFloor', e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('filter_all_floors')}</option>
              {floors.map(f => <option key={f} value={f}>{t('floor_n', f)}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          {t('sort')}:
          <select className="select" value={sortBy} onChange={(e) => setFilter('sortBy', e.target.value as SortBy)}>
            <option value="room_asc">{t('sort_room_asc')}</option>
            <option value="room_desc">{t('sort_room_desc')}</option>
            <option value="floor_asc">{t('sort_floor_asc')}</option>
          </select>
        </label>
        <span className="ml-auto">{t('rooms_count', count)}</span>
      </div>
    </div>
  );
}
