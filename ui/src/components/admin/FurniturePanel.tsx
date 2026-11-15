import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n';
import { fetchNUI } from '@/hooks/useNUI';
import { AdminTabs } from './BuildingPanel';
import { Field, Icon, NumberInput } from './controls';
import { action, closeAdmin, confirm, notify, useAdminStore, useFurnitureStore } from './state';
import { FurnitureGizmo, useFurnitureControls } from './FurnitureGizmo';

function Catalog() {
  const t = useT(),
    catalog = useAdminStore((s) => s.payload.catalog),
    count = useFurnitureStore((s) => s.draft.props.length);
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('');
  const items = useMemo(
    () =>
      (Array.isArray(catalog) ? catalog : [])
        .filter((group) => !category || group.id === category)
        .flatMap((group) => group.items)
        .filter((item) => (item.label + ' ' + item.model).toLowerCase().includes(search.toLowerCase())),
    [catalog, category, search],
  );
  return (
    <aside className="side left" id="catalogPanel">
      <div className="side-head">
        <h3>{t('fe_catalog')}</h3>
        <span className="muted">{t('fe_count', count)}</span>
      </div>
      <div className="side-body">
        <div className="search">
          <Icon name="search" />
          <input
            className="input"
            placeholder={t('fe_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select"
          aria-label={t('fe_all_categories')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('fe_all_categories')}</option>
          {(Array.isArray(catalog) ? catalog : []).map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
        <div id="catalog">
          {items.map((item) => (
            <button className="item" key={item.model} onClick={() => action('fe_add', item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`./admin/images/${item.model}.webp`}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
              <span>{item.label}</span>
              <small>{item.model}</small>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
function TransformTools() {
  const t = useT(),
    draft = useFurnitureStore((s) => s.draft),
    selected = useFurnitureStore((s) => s.selected),
    object = draft.props[selected - 1];
  const [values, setValues] = useState<Record<string, number | null>>({});
  useEffect(() => {
    const transform = object
      ? {
          x: object.offset.x,
          y: object.offset.y,
          z: object.offset.z,
          rx: object.rotation.x,
          ry: object.rotation.y,
          rz: object.rotation.z,
        }
      : draft.anchor;
    setValues({ ...transform } as Record<string, number>);
  }, [draft, object, selected]);
  return (
    <>
      <div id="objects">
        {draft.props.map((prop, index) => (
          <button
            key={index}
            className={selected === index + 1 ? 'active' : ''}
            onClick={() => fetchNUI('fe_select', { index: index + 1 })}
          >
            {index + 1}. {prop.label || prop.model}
          </button>
        ))}
      </div>
      <p className="section">{object ? object.label || object.model : t('fe_anchor')}</p>
      <div className="grid3">
        {Object.keys(values).map((key) => (
          <Field key={key} label={key === 'heading' ? t('fe_rotation') : key.toUpperCase()}>
            <NumberInput
              value={values[key]}
              onChange={(value) => setValues((previous) => ({ ...previous, [key]: value }))}
            />
          </Field>
        ))}
      </div>
      <div className="row">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() =>
            action(
              'fe_transform',
              Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ?? 0])),
            )
          }
        >
          {t('fe_apply')}
        </button>
        <button className="btn btn-secondary btn-sm" disabled={!object} onClick={() => action('fe_ground')}>
          {t('fe_ground')}
        </button>
      </div>
      <div className="row">
        <button
          className="btn btn-secondary btn-sm"
          disabled={!object}
          onClick={() => action('fe_duplicate')}
        >
          {t('fe_duplicate')}
        </button>
        <button className="btn btn-danger btn-sm" disabled={!object} onClick={() => action('fe_delete')}>
          {t('fe_delete')}
        </button>
      </div>
      <button className="btn btn-ghost btn-sm wide" onClick={() => action('fe_anchorHere')}>
        {t('fe_anchor_here')}
      </button>
    </>
  );
}
function SavedLayouts() {
  const t = useT(),
    sets = useAdminStore((s) => s.payload.sets),
    hotels = useAdminStore((s) => s.payload.hotels);
  const [name, setName] = useState(''),
    [selectedSet, selectSet] = useState(''),
    [hotel, setHotel] = useState(''),
    [room, setRoom] = useState<number | null>(101);
  const [from, setFrom] = useState<number | null>(1),
    [to, setTo] = useState<number | null>(2),
    [last, setLast] = useState<number | null>(1);
  const hotelId = hotels[hotel] ? hotel : Object.keys(hotels)[0] || '',
    floorCount = hotels[hotelId]?.floors.count || 1;
  const set = sets[selectedSet] ? selectedSet : '';
  useEffect(() => {
    setLast(floorCount);
  }, [hotelId, floorCount]);
  const roomRef = () => ({ hotel: hotelId, room: room || 0 });
  const updateSets = (next: Record<string, unknown>) =>
    useAdminStore.setState((state) => ({ payload: { ...state.payload, sets: next } }));
  const saveSet = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      notify(t('fe_name_required'), true);
      return;
    }
    const save = async () => {
      const result = await action('fe_saveSet', { name: trimmed }, t('fe_set_saved'));
      if (result?.success) {
        updateSets(result.sets);
        selectSet(trimmed);
      }
    };
    if (sets[trimmed]) confirm(t('fe_overwrite_title'), t('fe_overwrite_text', trimmed), save);
    else void save();
  };
  return (
    <>
      <p className="section">{t('fe_sets')}</p>
      <input
        className="input"
        maxLength={64}
        placeholder={t('fe_set_name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn btn-primary btn-sm wide" onClick={saveSet}>
        {t('fe_save_set')}
      </button>
      <select
        className="select"
        aria-label={t('fe_pick_set')}
        value={set}
        onChange={(e) => selectSet(e.target.value)}
      >
        <option value="">{t('fe_pick_set')}</option>
        {Object.keys(sets)
          .sort()
          .map((key) => (
            <option key={key}>{key}</option>
          ))}
      </select>
      <div className="row">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (set)
              confirm(t('fe_load_set'), t('fe_load_text'), async () => {
                const result = await action('fe_loadSet', { name: set });
                if (result?.success) setName(set);
              });
          }}
        >
          {t('fe_load_set')}
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            if (set)
              confirm(t('fe_delete_set'), t('fe_delete_set_text', set), async () => {
                const result = await action('fe_deleteSet', { name: set }, t('adm_deleted'));
                if (result?.success) updateSets(result.sets);
              });
          }}
        >
          {t('fe_delete_set')}
        </button>
      </div>
      <p className="section">{t('fe_room')}</p>
      <select
        className="select"
        aria-label={t('adm_tab_buildings')}
        value={hotelId}
        onChange={(e) => setHotel(e.target.value)}
      >
        {Object.entries(hotels).map(([id, building]) => (
          <option key={id} value={id}>
            {building.label}
          </option>
        ))}
      </select>
      <Field label={t('adm_room_number')}>
        <NumberInput min={101} step="1" value={room} onChange={setRoom} />
      </Field>
      <div className="row">
        <button
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            const result = await action('adm_goto', roomRef());
            if (result?.success) await fetchNUI('adm_tab', { tab: 'furniture' });
          }}
        >
          {t('fe_goto')}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            const result = await action('fe_loadPlacement', roomRef());
            if (result?.success) {
              setName(result.set);
              selectSet(result.set);
            }
          }}
        >
          {t('fe_load_room')}
        </button>
      </div>
      <button
        className="btn btn-primary btn-sm wide"
        onClick={() => {
          if (!set) {
            notify(t('fe_pick_set_first'), true);
            return;
          }
          const ref = roomRef();
          confirm(t('fe_save_room'), t('fe_save_room_text', set, ref.room), () =>
            action('fe_savePlacement', { ...ref, set }, t('fe_room_saved')),
          );
        }}
      >
        {t('fe_save_room')}
      </button>
      <button
        className="btn btn-danger btn-sm wide"
        onClick={() =>
          confirm(t('fe_remove_room'), t('fe_remove_room_text'), () =>
            action('fe_removePlacement', roomRef(), t('adm_deleted')),
          )
        }
      >
        {t('fe_remove_room')}
      </button>
      <p className="section">{t('fe_copy_floors')}</p>
      <p className="hint">{t('fe_copy_help')}</p>
      <div className="grid3">
        <Field label={t('fe_from_floor')}>
          <NumberInput value={from} onChange={setFrom} min={1} max={floorCount} step="1" />
        </Field>
        <Field label={t('fe_to_floor')}>
          <NumberInput value={to} onChange={setTo} min={1} max={floorCount} step="1" />
        </Field>
        <Field label={t('fe_last_floor')}>
          <NumberInput value={last} onChange={setLast} min={1} max={floorCount} step="1" />
        </Field>
      </div>
      <button
        className="btn btn-primary btn-sm wide"
        onClick={() => {
          const value = { hotel: hotelId, from, to, last };
          confirm(t('fe_copy_floors'), t('fe_copy_text', from || 0, to || 0, last || 0), async () => {
            const result = await action('fe_copyFloors', value);
            if (result?.success) notify(t('fe_copied', result.count));
          });
        }}
      >
        {t('fe_copy')}
      </button>
    </>
  );
}
export function FurniturePanel({ enabled }: { enabled: boolean }) {
  const t = useT(),
    selected = useFurnitureStore((s) => s.selected);
  useFurnitureControls(enabled);
  return (
    <div>
      <FurnitureGizmo />
      <div className="bar">
        <button className="icon-btn" title="Esc" onClick={closeAdmin}>
          <Icon name="x" />
        </button>
        <AdminTabs />
      </div>
      <Catalog />
      <aside className="side right">
        <div className="side-head">
          <h3>{t('fe_layout')}</h3>
          <div className="row tight">
            <button
              className={'btn btn-sm ' + (selected === 0 ? 'btn-primary' : 'btn-secondary')}
              onClick={() => fetchNUI('fe_select', { index: 0 })}
            >
              {t('fe_whole_set')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => action('fe_undo')}>
              {t('fe_undo')}
            </button>
          </div>
        </div>
        <div className="side-body">
          <TransformTools />
          <SavedLayouts />
        </div>
      </aside>
      <div id="hint">{t('fe_hint')}</div>
    </div>
  );
}
