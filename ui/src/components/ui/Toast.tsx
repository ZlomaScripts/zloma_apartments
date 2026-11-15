'use client';

import { assertResourceName } from '@/resourceName';
assertResourceName();

import { create } from 'zustand';
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ── Toast Store ──
interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  exiting?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: 'error' | 'success' | 'info') => void;
  removeToast: (id: string) => void;
  markExiting: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, type }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  markExiting: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    })),
}));

// Shorthand helpers
export const toast = {
  error: (msg: string) => useToast.getState().addToast(msg, 'error'),
  success: (msg: string) => useToast.getState().addToast(msg, 'success'),
  info: (msg: string) => useToast.getState().addToast(msg, 'info'),
};

// ── Toast Component ──
function ToastItem({ t }: { t: Toast }) {
  const { markExiting, removeToast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      markExiting(t.id);
      setTimeout(() => removeToast(t.id), 220);
    }, 4500);
    return () => clearTimeout(timerRef.current);
  }, [t.id, markExiting, removeToast]);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    markExiting(t.id);
    setTimeout(() => removeToast(t.id), 220);
  }, [t.id, markExiting, removeToast]);

  const colors = {
    error: 'bg-dark-900 border-danger-500/30 text-danger-400',
    success: 'bg-dark-900 border-success-500/30 text-success-400',
    info: 'bg-dark-900 border-dark-600 text-dark-200',
  };
  const Icon = t.type === 'error' ? AlertCircle : t.type === 'success' ? CheckCircle : Info;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${colors[t.type]}
        ${t.exiting ? 'toast-exit' : 'toast-enter'}
        shadow-lg shadow-black/30
      `}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{t.message}</span>
      <button onClick={dismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Container — place in page.tsx ──
export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 w-80 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
