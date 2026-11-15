import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect, useState } from 'react';
import { fetchNUI } from '@/hooks/useNUI';
import { toast } from '@/components/ui/Toast';
import { Bell, CreditCard } from 'lucide-react';
import { useT } from '@/i18n';

type Settings = { doorbell_notify: boolean; payment_remind: boolean };

export function NotificationPreferences() {
  const t = useT();
  const [settings, setSettings] = useState<Settings>({ doorbell_notify: true, payment_remind: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNUI<Partial<Settings>>('getSettings').then(result => {
      setSettings({ doorbell_notify: result.doorbell_notify ?? true, payment_remind: result.payment_remind ?? true });
      setLoading(false);
    });
  }, []);

  const toggle = async (key: keyof Settings) => {
    setLoading(true);
    const updated = { ...settings, [key]: !settings[key] };
    const result = await fetchNUI('saveSettings', updated);
    if (result.success) setSettings(updated); else toast.error(result.error || t('error_generic'));
    setLoading(false);
  };

  const rows = [
    ['doorbell_notify', t('pref_doorbell'), t('pref_doorbell_desc'), Bell],
    ['payment_remind', t('pref_payment'), t('pref_payment_desc'), CreditCard],
  ] as const;

  return (
    <div className="mt-6 bg-dark-900/60 rounded-lg border border-dark-700/50 p-6 space-y-5">
      {rows.map(([key, label, description, Icon]) => (
        <div key={key} className="flex items-center gap-4">
          <Icon size={20} className="text-dark-400" />
          <div className="flex-1">
            <div className="text-white text-sm font-medium">{label}</div>
            <p className="text-dark-500 text-xs mt-1">{description}</p>
          </div>
          <button role="switch" aria-checked={settings[key]} aria-label={label} disabled={loading} onClick={() => toggle(key)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors disabled:opacity-50 ${settings[key] ? 'bg-success-500' : 'bg-dark-700'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${settings[key] ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
    </div>
  );
}
