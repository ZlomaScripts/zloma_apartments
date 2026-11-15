import { assertResourceName } from '@/resourceName';
assertResourceName();

import { create } from 'zustand';
import { fetchNUI } from '@/hooks/useNUI';
import { t, useI18n } from '@/i18n';
import {
  AdminMessage,
  AdminPayload,
  Building,
  FurnitureDraft,
  GizmoData,
  copy,
  emptyFurniture,
  emptyPayload,
  newBuilding,
} from './model';

interface Confirmation {
  title: string;
  text: string;
  run: () => void;
}
interface AdminState {
  active: boolean;
  visible: boolean;
  tab: 'buildings' | 'furniture';
  generation: number;
  busy: boolean;
  payload: AdminPayload;
  draft: Building | null;
  selectedId: string | null;
  dirty: boolean;
  step: number;
  safeFor: number | null;
  confirmation: Confirmation | null;
  toast: { message: string; error: boolean; id: number } | null;
}
export const useAdminStore = create<AdminState>(() => ({
  active: false,
  visible: false,
  tab: 'buildings',
  generation: 0,
  busy: false,
  payload: emptyPayload(),
  draft: null,
  selectedId: null,
  dirty: false,
  step: 1,
  safeFor: null,
  confirmation: null,
  toast: null,
}));
export const useFurnitureStore = create<{ draft: FurnitureDraft; selected: number }>(() => ({
  draft: emptyFurniture(),
  selected: 0,
}));
export const useGizmoStore = create<{ gizmo: GizmoData | null }>(() => ({ gizmo: null }));
let toastId = 0;
export function notify(message: string, error = false) {
  useAdminStore.setState({ toast: { message, error, id: ++toastId } });
}
export function confirm(title: string, text: string, run: () => void) {
  useAdminStore.setState({ confirmation: { title, text, run } });
}
export function guardDirty(run: () => void) {
  if (!useAdminStore.getState().dirty) return run();
  confirm(t('adm_discard_title'), t('adm_discard_text'), () => {
    useAdminStore.setState({ dirty: false });
    run();
  });
}
export function patchDraft(update: (draft: Building) => void) {
  const current = useAdminStore.getState().draft;
  if (!current) return;
  const draft = copy(current);
  update(draft);
  useAdminStore.setState({ draft, dirty: true });
}
export function openBuilding(id: string | null) {
  const payload = useAdminStore.getState().payload;
  const draft = id ? copy(payload.hotels[id]) : newBuilding(payload.defaults);
  draft.roomImages = { ...(draft.roomImages || {}) };
  useAdminStore.setState({ draft, selectedId: id, dirty: false, step: 1, safeFor: null });
}
export function closeBuilding() {
  useAdminStore.setState({ draft: null, selectedId: null, dirty: false, safeFor: null });
}
export function setAdminTab(tab: 'buildings' | 'furniture') {
  if (useAdminStore.getState().tab === tab) return;
  guardDirty(() => {
    closeBuilding();
    useAdminStore.setState({ tab });
    useGizmoStore.setState({ gizmo: null });
    void fetchNUI('adm_tab', { tab });
  });
}
export function closeAdmin() {
  guardDirty(() => {
    closeBuilding();
    void fetchNUI('adm_close');
  });
}
export function applyPayload(payload: AdminPayload) {
  useAdminStore.setState({ payload });
}
export async function action<T extends { success?: boolean; error?: string } = any>(
  name: string,
  value: object = {},
  message?: string,
): Promise<T | null> {
  const { busy, generation } = useAdminStore.getState();
  if (busy) return null;
  useAdminStore.setState({ busy: true });
  try {
    const result = await fetchNUI<T>(name, value);
    if (useAdminStore.getState().generation !== generation) return null;
    if (!result?.success) notify(result?.error || t('error_generic'), true);
    else if (message) notify(message);
    return result;
  } finally {
    if (useAdminStore.getState().generation === generation) useAdminStore.setState({ busy: false });
  }
}
export function handleAdminMessage(message: AdminMessage) {
  const state = useAdminStore.getState();
  switch (message.action) {
    case 'open':
      if (!message.data) return;
      useI18n.getState().setLocale(message.data.locale, useI18n.getState().lang);
      useAdminStore.setState({
        active: true,
        visible: true,
        tab: 'buildings',
        payload: message.data,
        busy: false,
        generation: state.generation + 1,
        confirmation: null,
        toast: null,
      });
      useGizmoStore.setState({ gizmo: null });
      break;
    case 'close':
      closeBuilding();
      useAdminStore.setState({
        active: false,
        visible: false,
        confirmation: null,
        busy: false,
        generation: state.generation + 1,
      });
      useGizmoStore.setState({ gizmo: null });
      break;
    case 'hide':
      useAdminStore.setState({ visible: false });
      break;
    case 'show':
      if (state.active) useAdminStore.setState({ visible: true });
      break;
    case 'draft':
      if (!message.draft) break;
      useFurnitureStore.setState({
        draft: { ...message.draft, props: Array.isArray(message.draft.props) ? message.draft.props : [] },
        selected: message.selected || 0,
      });
      break;
    case 'gizmo':
      useGizmoStore.setState({ gizmo: message as GizmoData });
      break;
    case 'sets':
      useAdminStore.setState({
        payload: { ...state.payload, sets: message.sets || {}, placements: message.placements || {} },
      });
      break;
    case 'captured': {
      const value: any = message.data;
      if (!value || !state.draft) break;
      const draft = copy(state.draft);
      if (message.kind === 'reception') {
        draft.reception = value;
        notify(t('adm_reception_saved'));
      } else if (message.kind === 'door') {
        const used = new Set(draft.rooms.map((room) => room.index));
        let index = 1;
        while (used.has(index)) index++;
        if (index > 99) {
          notify(t('adm_room_limit'), true);
          break;
        }
        if (draft.floors.baseZ == null) draft.floors.baseZ = Number(value.groundZ.toFixed(2));
        if (!draft.doorModel && value.model) draft.doorModel = value.model;
        draft.rooms.push({
          index,
          door: value.door,
          groundZ: value.groundZ,
          ...(value.model && value.model !== draft.doorModel ? { model: value.model } : {}),
        });
        notify(
          Math.abs(value.groundZ - Number(draft.floors.baseZ)) > 1.5
            ? t('adm_door_other_floor')
            : t('adm_door_added', 100 + index),
          Math.abs(value.groundZ - Number(draft.floors.baseZ)) > 1.5,
        );
      } else if (message.kind === 'panel_all') {
        const specs = value.specs || {};
        let count = 0;
        for (const room of draft.rooms) {
          const spec = specs[String(room.index)];
          if (!spec) continue;
          room.alarmPanel = spec;
          count++;
        }
        // Room templates now drive every floor: drop per-apartment overrides.
        draft.alarmPanels = Object.fromEntries(Object.entries(draft.alarmPanels || {}).filter(([n]) => !specs[String(Number(n) % 100)]));
        const missing: number[] = Array.isArray(value.missing) ? value.missing : [];
        notify(missing.length ? t('alarm_panel_copied_missing', count, missing.join(', ')) : t('alarm_panel_copied', count), missing.length > 0);
      } else if (message.kind === 'panel') {
        draft.alarmPanels = { ...(Array.isArray(draft.alarmPanels) ? {} : draft.alarmPanels), [String(value.number)]: value.spec };
        notify(t('alarm_panel_saved', value.number));
      } else if (message.kind === 'safe') {
        const room = draft.rooms.find((room) => room.index === state.safeFor);
        if (room) {
          room.safe = value;
          notify(t('adm_safe_added', 100 + room.index));
        }
      } else if (message.kind === 'floor') {
        const height = value.z - Number(draft.floors.baseZ);
        if (draft.floors.baseZ == null || !Number.isFinite(height) || height < 1) {
          notify(t('adm_floor_measure_failed'), true);
          break;
        }
        draft.floors.step = Number(height.toFixed(4));
        draft.floors.count = Math.max(2, draft.floors.count || 0);
        notify(t('adm_floor_measured', height.toFixed(2)));
      }
      useAdminStore.setState({ draft, dirty: true });
      break;
    }
  }
}
