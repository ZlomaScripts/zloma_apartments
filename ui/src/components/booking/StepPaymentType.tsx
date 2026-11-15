import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Calendar, FileSignature, Landmark } from 'lucide-react';
import { PaymentType } from '@/types';
import { money, useT } from '@/i18n';

export function StepPaymentType({ onNext, onBack }: { onNext: (type: PaymentType) => void; onBack: () => void }) {
  const t = useT();
  const { hotel } = useStore();
  if (!hotel) return null;
  const p = hotel.pricing;
  const options = [
    hotel.enablePrepaid && { id: 'prepaid' as const, icon: <Calendar className="text-blue-500" size={24} />, ring: 'bg-blue-500/10', hover: 'hover:border-dark-500', title: t('pay_prepaid'), text: t('pay_prepaid_desc'), price: money(p.daily), unit: t('per_day_long'), color: 'text-white' },
    hotel.enableContract && { id: 'contract' as const, icon: <FileSignature className="text-success-500" size={24} />, ring: 'bg-success-500/10', hover: 'hover:border-success-500/50', title: t('pay_contract'), text: t('pay_contract_desc', p.contractMinDays, p.contractMaxDays), price: money(p.contractDaily), unit: t('per_day_long'), color: 'text-success-400' },
    hotel.enableBuy && { id: 'buy' as const, icon: <Landmark className="text-warning-500" size={24} />, ring: 'bg-warning-500/10', hover: 'hover:border-warning-500/50', title: t('pay_buy'), text: t('pay_buy_desc'), price: money(p.buy), unit: t('one_time'), color: 'text-warning-400' },
  ].filter(Boolean) as { id: PaymentType; icon: React.ReactNode; ring: string; hover: string; title: string; text: string; price: string; unit: string; color: string }[];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('payment_title')}</h2>
        <p className="text-dark-400">{t('payment_subtitle')}</p>
      </div>
      <div className="space-y-4">
        {options.map(o => (
          <button key={o.id} type="button" onClick={() => onNext(o.id)}
            className={`w-full text-left bg-dark-900/60 border border-dark-700/50 rounded-lg p-6 ${o.hover} hover:bg-dark-800/60 transition-all flex items-center gap-6`}>
            <div className={`w-12 h-12 rounded-full ${o.ring} flex items-center justify-center shrink-0`}>{o.icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{o.title}</h3>
              <p className="text-sm text-dark-400">{o.text}</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${o.color}`}>{o.price}</div>
              <div className="text-xs text-dark-500">{o.unit}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-start mt-8 pt-6 border-t border-dark-700/50">
        <Button variant="ghost" onClick={onBack}>{t('back')}</Button>
      </div>
    </div>
  );
}
