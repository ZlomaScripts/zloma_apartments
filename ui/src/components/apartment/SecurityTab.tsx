import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { fetchNUI } from '@/hooks/useNUI';
import { DoorClosed, Vault, ShieldCheck, Siren } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { SecurityLock } from '@/types';
import { money, useT } from '@/i18n';

function LockCard({ kind, lock }: { kind: 'door' | 'safe'; lock: SecurityLock }) {
  const t = useT();
  const { myApartment, playerMoney, setMyApartment, setPlayerMoney } = useStore();
  const [loading, setLoading] = useState(false);
  const next = lock.next;

  const upgrade = async () => {
    if (!next || !myApartment) return;
    setLoading(true);
    const result = await fetchNUI('upgradeSecurity', { kind });
    setLoading(false);
    if (result?.success) {
      setMyApartment({ ...myApartment, security: result.security });
      setPlayerMoney(playerMoney - next.price);
      toast.success(t('security_upgraded'));
    } else toast.error(result?.error || t('error_generic'));
  };

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center text-dark-200">
          {kind === 'door' ? <DoorClosed size={22} /> : <Vault size={22} />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{t(kind === 'door' ? 'security_door' : 'security_safe')}</h3>
          <p className="text-sm text-dark-400">{lock.label || t('level_n', lock.level)}</p>
        </div>
        {lock.alarm && <span className="pill" title={t('security_alarm_on')}><Siren size={12} className="inline mr-1" />{t('security_alarm')}</span>}
        <span className="pill">{t('security_level_of', lock.level, lock.max)}</span>
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: lock.max }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < lock.level ? 'bg-success-500' : 'bg-dark-700'}`} />
        ))}
      </div>

      {next ? (
        <div className="rounded-lg bg-dark-950/40 border border-dark-700/50 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="label mb-1">{t('security_next')}</p>
            <p className="text-white font-medium">{next.label || t('level_n', next.level)}</p>
            {next.alarm && !lock.alarm && <p className="text-xs text-dark-400 mt-1"><Siren size={12} className="inline mr-1" />{t('security_alarm_on')}</p>}
          </div>
          <Button onClick={upgrade} isLoading={loading} disabled={loading || !!next.blocked || playerMoney < next.price}>
            {t('security_buy', money(next.price))}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-dark-950/40 border border-dark-700/50 p-4 flex items-center gap-3 text-sm text-dark-300">
          <ShieldCheck size={18} className="text-success-500" /> {t('security_max')}
        </div>
      )}
      {next?.blocked && <p className="text-xs text-danger-400 -mt-3">{next.blocked}</p>}
      {next && playerMoney < next.price && <p className="text-xs text-danger-400 -mt-3">{t('not_enough_money', money(next.price))}</p>}
    </div>
  );
}

export function SecurityTab() {
  const t = useT();
  const { myApartment } = useStore();
  const security = myApartment?.security;
  if (!security) return null;
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('security_title')}</h1>
        <p className="text-dark-400">{t('security_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {security.door && <LockCard kind="door" lock={security.door} />}
        {security.safe && <LockCard kind="safe" lock={security.safe} />}
      </div>
    </div>
  );
}
