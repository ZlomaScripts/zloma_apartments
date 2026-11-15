import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useT } from '@/i18n';

const styles: Record<string, string> = { free: 'badge-success', rented: 'badge-warning', owned: 'badge-primary' };

export function Badge({ status, className = '' }: { status: string; className?: string }) {
  const t = useT();
  return (
    <span className={`badge ${styles[status] || 'badge-accent'} ${className}`}>
      <span className={`dot dot-${status}`} />
      {t('status_' + status)}
    </span>
  );
}
