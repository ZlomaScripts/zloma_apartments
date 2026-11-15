import { assertResourceName } from '@/resourceName';
assertResourceName();

import { create } from 'zustand';

interface I18nState {
  strings: Record<string, string>;
  lang: string;
  setLocale: (strings: Record<string, string>, lang: string) => void;
}

export const useI18n = create<I18nState>((set) => ({
  strings: {},
  lang: 'en',
  setLocale: (strings, lang) => set({ strings: strings || {}, lang: lang || 'en' }),
}));

// t('key', a, b) replaces %s placeholders in order.
export function t(key: string, ...args: (string | number)[]): string {
  const text = useI18n.getState().strings[key] ?? key;
  let i = 0;
  return text.replace(/%s/g, () => (i < args.length ? String(args[i++]) : ''));
}

// Re-renders the component when the locale changes.
export function useT() {
  useI18n((s) => s.strings);
  return t;
}

function localeTag() {
  const lang = useI18n.getState().lang;
  return lang === 'hr' ? 'hr-HR' : lang === 'en' ? 'en-US' : lang;
}

export function money(value: number | undefined | null) {
  return '$' + Number(value || 0).toLocaleString(localeTag());
}

export function date(ms: number | undefined | null) {
  if (!ms) return '';
  return new Date(ms).toLocaleString(localeTag(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
