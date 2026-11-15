import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState, ReactNode } from 'react';
import { roomImageSource } from '@/roomImages';
import {
  X,
  Plus,
  Building2,
  Sofa,
  MapPin,
  Pencil,
  Trash2,
  RotateCcw,
  Layers,
  DoorClosed,
  Users,
  Vault,
  Ruler,
  Search,
  Check,
} from 'lucide-react';
const icons = {
  x: X,
  plus: Plus,
  building: Building2,
  sofa: Sofa,
  pin: MapPin,
  edit: Pencil,
  trash: Trash2,
  reset: RotateCcw,
  layers: Layers,
  door: DoorClosed,
  users: Users,
  vault: Vault,
  ruler: Ruler,
  search: Search,
  check: Check,
};
export function Icon({ name }: { name: keyof typeof icons }) {
  const Component = icons[name];
  return (
    <i data-icon={name}>
      <Component />
    </i>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = '0.01',
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <input
      className="input"
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}
export function Photo({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!url?.startsWith('https://') || failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      className="room-photo-preview"
      src={roomImageSource(url)}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
