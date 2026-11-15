import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useT } from '@/i18n';
import { fetchNUI } from '@/hooks/useNUI';
import { Building, copy, roomNumbers } from './model';
import { patchDraft, useAdminStore } from './state';
import { Field } from './controls';

export function AlarmPlacement({ draft }: { draft: Building }) {
  const t = useT(), configured = useAdminStore(s => s.payload.security?.configured);
  const [selected, setSelected] = useState('');
  if (!configured) return null;
  const numbers = roomNumbers(draft);
  const number = numbers.includes(Number(selected)) ? Number(selected) : numbers[0];
  const base = draft.rooms.find(r => r.index === number % 100);
  const own = draft.alarmPanels?.[String(number)];
  const effective = own || base?.alarmPanel;
  const manual = effective?.mode === 'manual';
  return <section aria-label={t('alarm_panel_admin_title')}>
    <p className="section">{t('alarm_panel_admin_title')}</p>
    <p className="hint">{t('alarm_panel_admin_help')}</p>
    <Field label={t('alarm_panel_room_number')}>
      <select className="select" value={number || ''} disabled={!numbers.length} onChange={e => setSelected(e.target.value)}>
        {numbers.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
    <div className="note">{t(manual ? 'alarm_panel_manual' : 'alarm_panel_auto')}</div>
    <div className="actions" style={{ flexWrap: 'wrap', margin: '12px 0' }}>
      <button type="button" className="btn btn-primary btn-sm" disabled={!number}
        onClick={() => void fetchNUI('adm_capture', { kind: 'panel', definition: draft, number })}>{t('alarm_panel_place')}</button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={!number}
        onClick={() => patchDraft(d => { d.alarmPanels = { ...(Array.isArray(d.alarmPanels) ? {} : d.alarmPanels), [String(number)]: { mode: 'auto' } }; })}>{t('alarm_panel_use_auto')}</button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={!number || !manual}
        onClick={() => patchDraft(d => {
          const room = d.rooms.find(r => r.index === number % 100);
          if (!room || !effective) return;
          const spec = copy(effective);
          // An explicit placement is in world coordinates on the selected floor;
          // a base-room template is already measured on floor one.
          if (own && spec.position) spec.position.z -= (Math.floor(number / 100) - 1) * Number(d.floors.step);
          room.alarmPanel = spec;
          d.alarmPanels = Object.fromEntries(Object.entries(d.alarmPanels || {}).filter(([n]) => Number(n) % 100 !== room.index));
        })}>{t('alarm_panel_copy_floors')}</button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={!number || !manual}
        title={t('alarm_panel_copy_rooms_help')}
        onClick={() => void fetchNUI('adm_capture', { kind: 'panel_all', definition: draft, number })}>{t('alarm_panel_copy_rooms')}</button>
    </div>
    <p className="hint">{t('alarm_panel_auto_help')}</p>
  </section>;
}
