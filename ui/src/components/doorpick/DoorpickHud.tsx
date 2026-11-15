'use client';

import { assertResourceName } from '@/resourceName';
assertResourceName();

// HUD of the door lockpick (game by TR Scripts): hint and keys, the eight
// wafer positions, bends and the pressure meter. Lua: client/doorpick/ui.lua.
import { useEffect, useRef, useState } from 'react';
import { useNUIMessage } from '@/hooks/useNUI';
import { playSound, setLoop, stopLoop } from './sounds';

type Slot = { label: string; active?: boolean; done?: boolean; progress?: string | null };
export type DoorpickHudData = {
  hint?: { text: string; keys?: { key: string; label: string }[] };
  tools?: Slot[];
  strikes?: { label: string; used: number; max: number };
  meter?: { label: string; value: number; tone?: 'accent' | 'danger' };
};
type Flash = { id: number; text: string; tone: string };

const TONE: Record<string, string> = {
  success: 'text-success-400 border-success-500/40',
  error: 'text-danger-400 border-danger-500/40',
  muted: 'text-dark-300 border-dark-600',
  default: 'text-white border-dark-600',
};

export function DoorpickHud() {
  const [hud, setHud] = useState<DoorpickHudData | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useNUIMessage((msg) => {
    switch (msg.action) {
      case 'doorpick:hud':
        setHud(msg.data || null);
        break;
      case 'doorpick:flash': {
        const id = Date.now();
        setFlash({ id, text: msg.data.text, tone: msg.data.tone || 'default' });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setFlash((f) => (f && f.id === id ? null : f)), msg.data.duration || 1600);
        break;
      }
      case 'doorpick:sound':
        playSound(msg.data.name, msg.data.volume);
        break;
      case 'doorpick:loop':
        if (msg.data.stop) stopLoop(msg.data.id);
        else setLoop(msg.data.id, msg.data.name, msg.data.params || {}, msg.data.volume);
        break;
    }
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40" data-testid="doorpick-hud">
      {flash && (
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2">
          <div key={flash.id} className={`glass-dark rounded-lg border px-5 py-2 text-sm font-semibold animate-fade-in ${TONE[flash.tone] || TONE.default}`}>
            {flash.text}
          </div>
        </div>
      )}
      {hud && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[min(720px,92vw)] flex flex-col gap-3 animate-fade-in">
          {hud.hint && (
            <div className="glass-dark rounded-xl px-5 py-3 text-center">
              <p className="text-white text-sm">{hud.hint.text}</p>
              {hud.hint.keys && (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {hud.hint.keys.map((k) => (
                    <span key={k.key} className="text-xs text-dark-300 flex items-center gap-1.5">
                      <span className="pill text-white">{k.key}</span>{k.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="glass-dark rounded-xl px-5 py-3 flex items-center gap-5">
            {hud.tools && (
              <div className="flex gap-1.5 flex-1">
                {hud.tools.map((slot, i) => (
                  <div key={i} data-testid="doorpick-slot"
                    className={`flex-1 rounded-md border px-1 py-1.5 text-center transition-colors ${
                      slot.done ? 'border-success-500/60 bg-success-500/15' : slot.active ? 'border-white/70 bg-white/10' : 'border-dark-700 bg-dark-900/40'}`}>
                    <div className="text-[10px] text-dark-400">{slot.label}</div>
                    <div className={`text-xs font-mono ${slot.done ? 'text-success-400' : 'text-white'}`}>{slot.progress ?? '·'}</div>
                  </div>
                ))}
              </div>
            )}
            {hud.strikes && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-dark-400">{hud.strikes.label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: hud.strikes.max }, (_, i) => (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < hud.strikes!.used ? 'bg-danger-500' : 'bg-dark-700'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
          {hud.meter && (
            <div className="glass-dark rounded-xl px-5 py-2.5 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wide text-dark-400 w-20">{hud.meter.label}</span>
              <div className="flex-1 h-2 rounded-full bg-dark-800 overflow-hidden">
                <div className={`h-full rounded-full ${hud.meter.tone === 'danger' ? 'bg-danger-500' : 'bg-white'}`}
                  style={{ width: `${Math.round(Math.max(0, Math.min(1, hud.meter.value)) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
