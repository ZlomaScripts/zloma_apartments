import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { fetchNUI } from '@/hooks/useNUI';
import { ShieldCheck, ArrowUpCircle } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { money, useT } from '@/i18n';

const pinClass = 'w-full bg-dark-950/40 border border-dark-700/50 rounded-lg p-3 text-white text-center tracking-widest focus:outline-none focus:border-dark-500';

export function SafeTab() {
  const t = useT();
  const { myApartment, safeUpgrades, playerMoney, setMyApartment, setPlayerMoney, features } = useStore();
  const [loading, setLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  if (!myApartment) return null;

  const len = features.pinLength;
  const level = myApartment.safe_level || 1;
  const current = safeUpgrades[String(level)];
  const next = safeUpgrades[String(level + 1)];

  const upgrade = async () => {
    if (!next) return;
    setLoading(true);
    const result = await fetchNUI('upgradeSafe', { new_level: level + 1 });
    setLoading(false);
    if (result?.success) {
      setMyApartment({ ...myApartment, safe_level: result.new_level, security: result.security || myApartment.security });
      setPlayerMoney(playerMoney - next.price);
      toast.success(t('safe_upgraded'));
    } else toast.error(result?.error || t('error_generic'));
  };

  const closePin = () => { if (!loading) { setPinOpen(false); setPin(''); setConfirmPin(''); } };
  const savePin = async () => {
    if (pin.length !== len || pin !== confirmPin) return;
    setLoading(true);
    const result = await fetchNUI('setSafePin', { pin });
    setLoading(false);
    if (result?.success) { toast.success(t('pin_changed')); setPinOpen(false); setPin(''); setConfirmPin(''); }
    else toast.error(result?.error || t('error_generic'));
  };

  const capacity = (u: { slots: number; weight: number }) => t('capacity_value', u.slots, Math.round(u.weight / 1000));

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('safe_title')}</h1>
        <p className="text-dark-400">{t('safe_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-dark-900/60 rounded-lg p-6 border border-dark-700/50 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-success-500/10 flex items-center justify-center text-success-500"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('safe_current')}</h3>
              <p className="text-sm text-dark-400">{t('level_n', level)}</p>
            </div>
          </div>
          {current && (
            <div className="bg-dark-950/40 p-4 rounded-lg flex-1">
              <div className="text-white font-medium mb-1">{current.label}</div>
              <div className="text-sm text-dark-500 flex justify-between"><span>{t('capacity')}</span><span>{capacity(current)}</span></div>
            </div>
          )}
          <Button variant="ghost" className="w-full mt-4" onClick={() => setPinOpen(true)}>{t('change_pin')}</Button>
        </div>
        <div className="bg-dark-900/60 rounded-lg p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><ArrowUpCircle size={20} className="text-white" /> {t('upgrades')}</h3>
          {!next ? (
            <div className="h-40 flex flex-col items-center justify-center text-center">
              <ShieldCheck size={48} className="text-success-500 mb-4 opacity-50" />
              <div className="text-white font-medium">{t('max_level')}</div>
              <p className="text-sm text-dark-500">{t('max_level_text')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-dark-800/60 border border-dark-600 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-white font-medium">{next.label}</div>
                  <div className="text-white font-bold">{money(next.price)}</div>
                </div>
                <div className="flex justify-between mt-4 text-sm text-dark-400"><span>{t('new_capacity')}</span><span className="text-white">{capacity(next)}</span></div>
              </div>
              <Button className="w-full" onClick={upgrade} disabled={loading || playerMoney < next.price} isLoading={loading}>{t('buy_upgrade')}</Button>
              {playerMoney < next.price && <p className="text-xs text-danger-400 text-center mt-2">{t('not_enough_money', money(next.price))}</p>}
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={pinOpen} onClose={closePin} title={t('change_pin_title')}>
        <div className="space-y-4">
          <p className="text-dark-400 text-sm">{t('change_pin_text', len)}</p>
          <input autoFocus aria-label={t('pin')} placeholder={t('pin')} type="password" autoComplete="new-password" inputMode="numeric" maxLength={len} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} className={pinClass} />
          <input aria-label={t('confirm_pin')} placeholder={t('confirm_pin')} type="password" autoComplete="new-password" inputMode="numeric" maxLength={len} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} className={pinClass} />
          {confirmPin.length === len && pin !== confirmPin && <p className="text-xs text-danger-400 text-center">{t('pin_mismatch')}</p>}
          <Button className="w-full" onClick={savePin} isLoading={loading} disabled={loading || pin.length !== len || pin !== confirmPin}>{t('save_pin')}</Button>
        </div>
      </Modal>
    </div>
  );
}
