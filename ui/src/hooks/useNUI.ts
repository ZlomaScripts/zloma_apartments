import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect, useRef } from 'react';

type NUIMessage = { action: string; [key: string]: any };

export function useNUIMessage(handler: (data: NUIMessage) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data?.action) ref.current(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);
}

declare function GetParentResourceName(): string;
const resource = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'zloma_apartments';

export async function fetchNUI<T = any>(eventName: string, data: object = {}): Promise<T> {
  assertResourceName();
  try {
    const res = await fetch(`https://${resource}/${eventName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return {} as T;
  }
}

export function sendNUIClose() {
  fetchNUI('closeUI');
}
