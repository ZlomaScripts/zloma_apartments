import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { LockKeyhole } from 'lucide-react';
import { fetchNUI } from '@/hooks/useNUI';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';

type Session = { requestId: number; setup: boolean; pinLength: number };
export const useSafePin = create<{ session: Session | null; open: (session: Session) => void; close: () => void }>(set => ({
  session: null, open: session => set({ session }), close: () => set({ session: null }),
}));

export function SafePinDialog() {
  const session = useSafePin(s => s.session);
  return session ? <PinForm key={session.requestId} session={session} /> : null;
}

function PinForm({ session }: { session: Session }) {
  const t = useT();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const cancel = async () => {
    if (busy.current) return;
    busy.current = true;
    const result = await fetchNUI('cancelSafePin', { requestId: session.requestId });
    busy.current = false;
    if (result.success && useSafePin.getState().session?.requestId === session.requestId) useSafePin.getState().close();
  };
  useEffect(() => {
    input.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); void cancel(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [session.requestId]);
  const valid = pin.length === session.pinLength && (!session.setup || pin === confirmPin);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || busy.current) return;
    busy.current = true; setLoading(true); setError('');
    const result = await fetchNUI('submitSafePin', { requestId: session.requestId, pin, ...(session.setup ? { confirmPin } : {}) });
    busy.current = false; setLoading(false);
    if (useSafePin.getState().session?.requestId !== session.requestId) return;
    if (result.success) useSafePin.getState().close();
    else { setError(result.error || t('error_generic')); setPin(''); setConfirmPin(''); input.current?.focus(); }
  };
  const field = 'w-full bg-dark-950/40 border border-dark-700/50 rounded-lg p-3 text-white text-center tracking-widest focus:outline-none focus:border-dark-500';
  return <div className="fixed inset-0 z-[100] flex items-center justify-center">
    <form role="dialog" aria-modal="true" aria-labelledby="safe-pin-title" onSubmit={submit} className="glass-dark rounded-2xl p-7 w-[90vw] max-w-sm space-y-5">
      <div className="flex items-center gap-3"><LockKeyhole className="text-white" /><h1 id="safe-pin-title" className="text-xl font-semibold text-white">{t(session.setup ? 'safe_setup_title' : 'safe_open_title')}</h1></div>
      <p className="text-sm text-dark-400">{t('safe_pin_hint', session.pinLength)}</p>
      <label className="block text-sm text-dark-400">{t('pin')}<input ref={input} className={field} type="password" inputMode="numeric" autoComplete="new-password" required maxLength={session.pinLength} value={pin} disabled={loading} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} /></label>
      {session.setup && <label className="block text-sm text-dark-400">{t('confirm_pin')}<input className={field} type="password" inputMode="numeric" autoComplete="new-password" required maxLength={session.pinLength} value={confirmPin} disabled={loading} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} /></label>}
      {session.setup && confirmPin.length === session.pinLength && pin !== confirmPin && <p role="alert" className="text-sm text-danger-400">{t('pin_mismatch')}</p>}
      {error && <p role="alert" className="text-sm text-danger-400">{error}</p>}
      <div className="flex gap-3"><Button variant="ghost" className="flex-1" disabled={loading} onClick={cancel}>{t('cancel')}</Button><Button type="submit" className="flex-1" disabled={!valid || loading} isLoading={loading}>{t(session.setup ? 'save_pin' : 'safe_open_title')}</Button></div>
    </form>
  </div>;
}
