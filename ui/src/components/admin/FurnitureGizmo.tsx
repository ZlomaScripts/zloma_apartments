import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect, useState } from 'react';
import { fetchNUI } from '@/hooks/useNUI';
import { action, useGizmoStore } from './state';

type Drag = { axis: string; x: number; y: number; angle: number };
export function useFurnitureControls(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let drag: Drag | null = null,
      camera = false,
      delta = { x: 0, y: 0 };
    const keys = new Set<string>();
    const finish = () => {
      camera = false;
      delta = { x: 0, y: 0 };
      keys.clear();
      if (drag) {
        drag = null;
        void fetchNUI('fe_endDrag');
      }
    };
    const contextMenu = (event: Event) => event.preventDefault();
    const down = (event: PointerEvent) => {
      const target = event.target as Element;
      const axis = target.closest('[data-axis]')?.getAttribute('data-axis');
      const gizmo = useGizmoStore.getState().gizmo;
      if (event.button === 0 && axis && gizmo?.visible) {
        drag = {
          axis,
          x: event.clientX,
          y: event.clientY,
          angle: Math.atan2(
            event.clientY - gizmo.center.y * innerHeight,
            event.clientX - gizmo.center.x * innerWidth,
          ),
        };
        void fetchNUI('fe_beginDrag');
        event.preventDefault();
      } else if (event.button === 2 && !target.closest('aside,.bar,[role="dialog"]')) {
        camera = true;
        delta = { x: 0, y: 0 };
        event.preventDefault();
      }
    };
    const move = (event: PointerEvent) => {
      if (camera) {
        delta.x += event.movementX;
        delta.y += event.movementY;
      }
      if (!drag) return;
      const gizmo = useGizmoStore.getState().gizmo;
      if (!gizmo?.visible) {
        finish();
        return;
      }
      if (drag.axis === 'rotation') {
        const angle = Math.atan2(
          event.clientY - gizmo.center.y * innerHeight,
          event.clientX - gizmo.center.x * innerWidth,
        );
        let change = angle - drag.angle;
        if (change > Math.PI) change -= Math.PI * 2;
        if (change < -Math.PI) change += Math.PI * 2;
        void fetchNUI('fe_drag', { axis: 'rotation', angle: (change * 180) / Math.PI });
        drag.angle = angle;
      } else
        void fetchNUI('fe_drag', {
          axis: drag.axis,
          dx: (event.clientX - drag.x) / innerWidth,
          dy: (event.clientY - drag.y) / innerHeight,
        });
      drag.x = event.clientX;
      drag.y = event.clientY;
    };
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as Element).closest('input,select,textarea,[contenteditable="true"]')) return;
      keys.add(event.code);
      if (event.ctrlKey && event.code === 'KeyZ') {
        event.preventDefault();
        void action('fe_undo');
      }
    };
    const keyup = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };
    document.addEventListener('contextmenu', contextMenu);
    document.addEventListener('pointerdown', down);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    window.addEventListener('blur', finish);
    const timer = setInterval(() => {
      if (!camera) return;
      void fetchNUI('fe_camera', {
        dx: delta.x,
        dy: delta.y,
        forward: +keys.has('KeyW') - +keys.has('KeyS'),
        right: +keys.has('KeyD') - +keys.has('KeyA'),
        up: +keys.has('KeyE') - +keys.has('KeyQ'),
        fast: keys.has('ShiftLeft'),
      });
      delta = { x: 0, y: 0 };
    }, 33);
    return () => {
      clearInterval(timer);
      finish();
      document.removeEventListener('contextmenu', contextMenu);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', finish);
    };
  }, [enabled]);
}
export function FurnitureGizmo() {
  const gizmo = useGizmoStore((s) => s.gizmo);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const resize = () => setViewport({ width: innerWidth, height: innerHeight });
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  if (!gizmo?.visible) return null;
  const cx = gizmo.center.x * viewport.width,
    cy = gizmo.center.y * viewport.height;
  return (
    <svg className="furniture-gizmo" width="100%" height="100%" aria-label="Furniture gizmo">
      <circle
        cx={cx}
        cy={cy}
        r={56}
        fill="none"
        stroke="#fcd34d"
        strokeWidth={3}
        className="handle"
        data-axis="rotation"
      />
      {(['x', 'y', 'z'] as const).map((axis) => {
        const end = gizmo.axes[axis];
        if (!end?.visible) return null;
        const x = end.x * viewport.width,
          y = end.y * viewport.height,
          color = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' }[axis];
        return (
          <g key={axis}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={5}
              className="handle"
              data-axis={axis}
            />
            <circle
              cx={x}
              cy={y}
              r={6}
              fill={color}
              stroke={color}
              strokeWidth={8}
              className="handle"
              data-axis={axis}
            />
            <text x={x + 10} y={y - 7} fill={color}>
              {axis.toUpperCase()}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={5} fill="white" />
    </svg>
  );
}
