import { assertResourceName } from '@/resourceName';
assertResourceName();

import { NotificationPreferences } from './NotificationPreferences';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/ui/Badge';
import { date, money, useT } from '@/i18n';

export function OverviewTab() {
  const t = useT();
  const { myApartment } = useStore();
  if (!myApartment) return null;
  const a = myApartment;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('overview_title')}</h1>
        <p className="text-dark-400">{t('overview_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-dark-900/60 rounded-lg p-6 border border-dark-700/50">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold text-white">{t('status')}</h3>
            <Badge status={a.status} />
          </div>
          <dl className="space-y-4">
            <div><dt className="text-sm text-dark-500 mb-1">{t('room_number')}</dt><dd className="text-white font-medium">{a.room_number}</dd></div>
            <div><dt className="text-sm text-dark-500 mb-1">{t('floor')}</dt><dd className="text-white font-medium">{a.floor}</dd></div>
            <div><dt className="text-sm text-dark-500 mb-1">{t('your_role')}</dt><dd className="text-white font-medium">{a.is_owner ? t('role_owner') : t('role_roommate', a.owner_name || '')}</dd></div>
          </dl>
        </div>
        <div className="bg-dark-900/60 rounded-lg p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-6">{t('finances')}</h3>
          {a.status === 'owned' ? (
            <div className="text-center py-8">
              <div className="text-success-400 font-semibold text-lg mb-2">{t('owned_title')}</div>
              <p className="text-sm text-dark-400">{t('owned_text')}</p>
            </div>
          ) : (
            <dl className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-dark-700/50">
                <dt className="text-sm text-dark-500">{t('daily_rent')}</dt><dd className="text-white font-medium">{money(a.daily_price)}</dd>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-dark-700/50">
                <dt className="text-sm text-dark-500">{t('rent_type')}</dt><dd className="text-white font-medium">{a.rent_type === 'contract' ? t('pay_contract') : t('pay_prepaid')}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-dark-500">{a.rent_type === 'contract' ? t('contract_ends') : t('next_payment')}</dt>
                <dd className="text-white font-medium">{a.rent_type === 'contract' ? date(a.rent_end) : date(a.next_payment)}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
      <NotificationPreferences />
    </div>
  );
}
