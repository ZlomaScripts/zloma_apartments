import { assertResourceName } from '@/resourceName';
assertResourceName();

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';

interface PaginationProps { currentPage: number; totalPages: number; onPageChange: (page: number) => void }

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useT();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-dark-700/50">
      <button className="btn btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} aria-label={t('previous')}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-dark-400">{t('page_of', currentPage, totalPages)}</span>
      <button className="btn btn-ghost btn-sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label={t('next')}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
