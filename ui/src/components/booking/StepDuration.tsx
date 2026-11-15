import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { money, useT } from '@/i18n';

interface Props { days: number; setDays: (days: number) => void; onNext: () => void; onBack: () => void }

export function StepDuration({ days, setDays, onNext, onBack }: Props) {
  const t = useT();
  const { hotel, playerMoney } = useStore();
  if (!hotel) return null;
  const { contractMinDays: min, contractMaxDays: max, contractDaily: daily } = hotel.pricing;
  const value = Math.min(max, Math.max(min, days));
  const total = value * daily;
  const canAfford = playerMoney >= total;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('duration_title')}</h2>
        <p className="text-dark-400">{t('duration_subtitle')}</p>
      </div>
      <div className="bg-dark-900/60 border border-dark-700/50 rounded-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-3xl font-bold text-white">{t('days_n', value)}</div>
            <div className="text-dark-500 text-sm">{t('contract_length')}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{money(total)}</div>
            <div className="text-dark-500 text-sm">{money(daily)}{t('per_day')}</div>
          </div>
        </div>
        {max > min && (
          <input type="range" min={min} max={max} value={value} onChange={(e) => setDays(Number(e.target.value))}
            className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-white" />
        )}
        <div className="flex justify-between mt-2 text-xs text-dark-500">
          <span>{t('days_min', min)}</span>
          <span>{t('days_max', max)}</span>
        </div>
        {!canAfford && (
          <div className="mt-6 p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg text-danger-400 text-sm text-center">{t('not_enough_money', money(total))}</div>
        )}
      </div>
      <div className="flex justify-between pt-6 border-t border-dark-700/50">
        <Button variant="ghost" onClick={onBack}>{t('back')}</Button>
        <Button disabled={!canAfford} onClick={() => { setDays(value); onNext(); }}>{t('continue')}</Button>
      </div>
    </div>
  );
}
