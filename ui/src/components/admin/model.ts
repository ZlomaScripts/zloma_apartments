import { assertResourceName } from '@/resourceName';
assertResourceName();

export interface Point {
  x: number;
  y: number;
  z: number;
  w?: number;
  heading?: number;
}
export interface PanelPlacement {
  mode: 'auto' | 'manual';
  position?: Point;
  rotation?: Point;
}
export interface BaseRoom {
  index: number;
  door: Point;
  model?: string | number;
  safe?: Point;
  groundZ?: number;
  alarmPanel?: PanelPlacement;
}
export interface Building {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  roomImages?: Record<string, string>;
  alarmPanels?: Record<string, PanelPlacement>;
  reception: Point | null;
  receptionModel?: string | number;
  receptionScenario?: string;
  floors: { count: number | null; baseZ: number | null; step: number | null };
  rooms: BaseRoom[];
  ipl?: string;
  doorModel?: string | number;
  pricing: Record<string, number | null>;
  blip: { sprite: number | null; color: number | null; scale: number | null; hidden?: boolean };
  enablePrepaid: boolean;
  enableContract: boolean;
  enableBuy: boolean;
  security?: { door?: Record<string, number | null>; safe?: Record<string, number | null> };
}
export interface SecurityLevelInfo {
  level: number;
  label?: string;
  game: string;
  difficulty: string;
  price: number;
}
export interface SecurityInfo {
  enabled: boolean;
  configured?: boolean;
  errors?: string[];
  safe?: boolean | SecurityLevelInfo[];
  door?: SecurityLevelInfo[];
}
export interface FurnitureProp {
  model: string;
  label?: string;
  offset: Point;
  rotation: Point;
}
export interface FurnitureDraft {
  props: FurnitureProp[];
  anchor: Point & { heading: number };
}
export interface CatalogItem {
  model: string;
  label: string;
}
export interface AdminPayload {
  success?: boolean;
  hotels: Record<string, Building>;
  custom: Record<string, boolean>;
  presets: Record<string, boolean>;
  occupancy: Record<string, number>;
  sets: Record<string, unknown>;
  placements: Record<string, unknown>;
  catalog: { id: string; label: string; items: CatalogItem[] }[];
  defaults: Partial<Building>;
  locale: Record<string, string>;
  security?: SecurityInfo;
}
export interface GizmoData {
  visible: boolean;
  center: { x: number; y: number };
  axes: Record<'x' | 'y' | 'z', { x: number; y: number; visible: boolean }>;
}
export type AdminMessage = {
  action: string;
  data?: AdminPayload;
  kind?: string;
  draft?: FurnitureDraft;
  selected?: number;
  editingKey?: string;
  sets?: AdminPayload['sets'];
  placements?: AdminPayload['placements'];
} & Partial<GizmoData>;
export const emptyPayload = (): AdminPayload => ({
  hotels: {},
  custom: {},
  presets: {},
  occupancy: {},
  sets: {},
  placements: {},
  catalog: [],
  defaults: {},
  locale: {},
});
export const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const emptyFurniture = (): FurnitureDraft => ({ props: [], anchor: { x: 0, y: 0, z: 0, heading: 0 } });
export function newBuilding(defaults: Partial<Building>): Building {
  return {
    id: '',
    label: '',
    description: '',
    imageUrl: '',
    roomImages: {},
    reception: null,
    receptionModel: defaults.receptionModel,
    receptionScenario: defaults.receptionScenario,
    floors: { count: 1, baseZ: null, step: 0 },
    rooms: [],
    ipl: '',
    doorModel: defaults.doorModel ?? '',
    pricing: copy(defaults.pricing || {}),
    blip: copy(defaults.blip || { sprite: 475, color: 2, scale: 0.8 }),
    enablePrepaid: defaults.enablePrepaid !== false,
    enableContract: defaults.enableContract !== false,
    enableBuy: defaults.enableBuy !== false,
    security: {},
  };
}
export function roomNumbers(building: Building) {
  const result: number[] = [];
  for (let floor = 1; floor <= Math.min(99, Number(building.floors.count) || 0); floor++)
    for (const room of building.rooms) result.push(floor * 100 + room.index);
  return result;
}
export function saveDefinition(building: Building) {
  const result = copy(building),
    valid = new Set(roomNumbers(result).map(String));
  for (const key of ['id', 'label', 'description', 'imageUrl', 'ipl'] as const) {
    const value = result[key];
    if (typeof value === 'string') result[key] = value.trim();
  }
  result.alarmPanels = Object.fromEntries(Object.entries(result.alarmPanels || {}).filter(([number]) => valid.has(number)));
  result.roomImages = Object.fromEntries(
    Object.entries(result.roomImages || {})
      .filter(([number]) => valid.has(number))
      .map(([number, url]) => [number, url.trim()]),
  );
  // Empty price fields fall back to config.lua.
  const security: Building['security'] = {};
  for (const kind of ['door', 'safe'] as const) {
    const prices = Object.entries(result.security?.[kind] || {}).filter(([, v]) => typeof v === 'number' && v >= 0);
    if (prices.length) security[kind] = Object.fromEntries(prices);
  }
  result.security = security;
  if (!result.ipl) delete result.ipl;
  if (result.doorModel === '') delete result.doorModel;
  else if (typeof result.doorModel === 'string' && /^-?\d+$/.test(result.doorModel))
    result.doorModel = Number(result.doorModel);
  return result;
}
