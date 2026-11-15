import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { fetchNUI } from '@/hooks/useNUI';
import { Users, UserMinus, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { NearbyPlayer } from '@/types';
import { useT } from '@/i18n';

export function RoommateTab() {
  const t = useT();
  const { myApartment, setMyApartment, features } = useStore();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [players, setPlayers] = useState<NearbyPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  if (!myApartment) return null;

  const load = async () => {
    setSearching(true); setSelected(null);
    const result = await fetchNUI('getNearbyPlayers');
    setPlayers(Array.isArray(result) ? result : []);
    setSearching(false);
  };

  const add = async () => {
    if (selected === null) return;
    setLoading(true);
    const result = await fetchNUI('addRoommate', { target_source: selected });
    setLoading(false);
    if (result?.success) {
      setModal(false);
      setMyApartment({ ...myApartment, has_roommate: true, roommate_name: result.roommate_name });
      toast.success(t('roommate_added', result.roommate_name));
    } else toast.error(result?.error || t('error_generic'));
  };

  const remove = async () => {
    setLoading(true);
    const result = await fetchNUI('removeRoommate', {});
    setLoading(false);
    if (result?.success) setMyApartment({ ...myApartment, has_roommate: false, roommate_name: null });
    else toast.error(result?.error || t('error_generic'));
  };

  if (!myApartment.is_owner) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-2">{t('tab_roommate')}</h1>
        <p className="text-dark-400">{t('roommate_you_are', myApartment.owner_name || '')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('tab_roommate')}</h1>
        <p className="text-dark-400">{t('roommate_subtitle')}</p>
      </div>
      <div className="bg-dark-900/60 rounded-lg border border-dark-700/50 p-6">
        {myApartment.has_roommate ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-dark-300/10 flex items-center justify-center text-dark-300"><Users size={24} /></div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('roommate_current')}</h3>
                <p className="text-sm text-dark-400">{myApartment.roommate_name}</p>
              </div>
            </div>
            <Button variant="danger" onClick={remove} isLoading={loading}><UserMinus size={16} /> {t('roommate_remove')}</Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-dark-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('roommate_none')}</h3>
            <p className="text-dark-400 text-sm max-w-md mx-auto mb-6">{t('roommate_none_text')}</p>
            <Button onClick={() => { load(); setModal(true); }}><UserPlus size={16} /> {t('roommate_add')}</Button>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={t('roommate_add')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">{t('nearby_players')}</div>
              <p className="text-dark-500 text-xs mt-1">{t('nearby_players_text', features.roommateDistance)}</p>
            </div>
            <Button variant="ghost" onClick={load} disabled={searching}>{t('refresh')}</Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {searching ? (
              <p className="text-dark-500 py-8 text-center">{t('searching')}</p>
            ) : players.length === 0 ? (
              <div className="rounded-lg bg-dark-950/40 p-8 text-center">
                <Users size={32} className="mx-auto mb-3 text-dark-600" />
                <p className="text-dark-400">{t('nobody_nearby', features.roommateDistance)}</p>
              </div>
            ) : players.map(p => (
              <button key={p.source} onClick={() => setSelected(p.source)}
                className={`w-full flex items-center gap-3 rounded-lg p-4 border text-left transition-colors ${selected === p.source ? 'bg-dark-700 border-white/40' : 'bg-dark-950/40 border-dark-700/50 hover:border-dark-500'}`}>
                <div className="w-10 h-10 rounded-full bg-dark-700 text-white flex items-center justify-center font-semibold">{p.name.slice(0, 1)}</div>
                <div className="flex-1">
                  <div className="text-white font-medium">{p.name}</div>
                  <div className="text-dark-500 text-xs">{t('player_id', p.source)}</div>
                </div>
                <span className="text-dark-400 text-xs">{p.distance} m</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
            <Button variant="ghost" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={add} isLoading={loading} disabled={selected === null || loading || searching}>{t('roommate_add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
