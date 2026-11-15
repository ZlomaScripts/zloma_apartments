import { assertResourceName } from '@/resourceName';
assertResourceName();

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }

export function Modal({ isOpen, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative w-full ${width} glass-dark rounded-2xl overflow-hidden animate-scale-in`}>
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between relative">
          <button onClick={onClose} className="btn-icon" aria-label="Close"><X className="w-5 h-5" /></button>
          <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">{title}</h2>
          <div className="w-10" />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
