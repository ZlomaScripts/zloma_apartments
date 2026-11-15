import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useT } from '@/i18n';
import { fetchNUI } from '@/hooks/useNUI';
import { AdminPayload, Building, roomNumbers, saveDefinition } from './model';
import {
  action,
  applyPayload,
  closeAdmin,
  closeBuilding,
  confirm,
  guardDirty,
  openBuilding,
  patchDraft,
  setAdminTab,
  useAdminStore,
} from './state';
import { Field, Icon, NumberInput, Photo } from './controls';
import { AlarmPlacement } from './AlarmPlacement';

const STEPS = [
  'adm_step_basics',
  'adm_step_reception',
  'adm_step_rooms',
  'adm_step_floors',
  'adm_step_prices',
];
export function AdminTabs() {
  const t = useT(),
    tab = useAdminStore((s) => s.tab);
  return (
    <nav className="tabs">
      <button
        type="button"
        className={'tab ' + (tab === 'buildings' ? 'active' : '')}
        onClick={() => setAdminTab('buildings')}
      >
        <Icon name="building" />
        {t('adm_tab_buildings')}
      </button>
      <button
        type="button"
        className={'tab ' + (tab === 'furniture' ? 'active' : '')}
        onClick={() => setAdminTab('furniture')}
      >
        <Icon name="sofa" />
        {t('adm_tab_furniture')}
      </button>
    </nav>
  );
}
function BuildingList() {
  const t = useT(),
    payload = useAdminStore((s) => s.payload);
  const [armed, setArmed] = useState<string | null>(null);
  return (
    <section className="body">
      <button className="card create" onClick={() => openBuilding(null)}>
        <span className="icon-box">
          <Icon name="plus" />
        </span>
        <span>
          <b>{t('adm_new_building')}</b>
          <small>{t('adm_new_building_desc')}</small>
        </span>
      </button>
      <div className="stack">
        {Object.keys(payload.hotels)
          .sort()
          .map((id) => {
            const hotel = payload.hotels[id],
              preset = payload.presets[id];
            return (
              <div key={id} className="card">
                <span className="icon-box">
                  <Icon name="building" />
                </span>
                <div className="grow">
                  <div className="name-row">
                    <b>{hotel.label}</b>
                    <span className={'badge ' + (preset ? 'preset' : 'custom')}>
                      {preset
                        ? payload.custom[id]
                          ? t('adm_preset_edited')
                          : t('adm_preset')
                        : t('adm_custom')}
                    </span>
                  </div>
                  <span className="pill">{id}</span>
                  <div className="meta">
                    <span>
                      <Icon name="layers" />
                      {t('adm_floors_count', hotel.floors.count || 0)}
                    </span>
                    <span>
                      <Icon name="door" />
                      {t('adm_rooms_count', (hotel.floors.count || 0) * hotel.rooms.length)}
                    </span>
                    <span>
                      <Icon name="users" />
                      {t('adm_occupied_count', payload.occupancy[id] || 0)}
                    </span>
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="icon-btn sm"
                    title={t('fe_goto')}
                    onClick={() => action('adm_goto', { hotel: id, room: 100 + hotel.rooms[0].index })}
                  >
                    <Icon name="pin" />
                  </button>
                  <button className="icon-btn sm" title={t('adm_edit')} onClick={() => openBuilding(id)}>
                    <Icon name="edit" />
                  </button>
                  {payload.custom[id] &&
                    (armed === id ? (
                      <div className="confirm-inline">
                        <span>{t('adm_sure')}</span>
                        <button
                          className="yes"
                          onClick={async () => {
                            const result = await action<AdminPayload>(
                              'adm_deleteHotel',
                              { id },
                              t('adm_deleted'),
                            );
                            setArmed(null);
                            if (result?.success) applyPayload(result);
                          }}
                        >
                          {preset ? t('adm_reset_short') : t('adm_delete_short')}
                        </button>
                        <button onClick={() => setArmed(null)}>{t('cancel')}</button>
                      </div>
                    ) : (
                      <button
                        className="icon-btn sm danger"
                        title={preset ? t('adm_reset_preset') : t('adm_delete')}
                        onClick={() => setArmed(id)}
                      >
                        <Icon name={preset ? 'reset' : 'trash'} />
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
      </div>
      <p className="hint">{t('adm_help_buildings')}</p>
    </section>
  );
}
// Lock upgrade prices for this building. Empty = the price from config.lua.
function SecurityPrices({ draft }: { draft: Building }) {
  const t = useT(),
    info = useAdminStore((s) => s.payload.security);
  if (!info?.configured) return null;
  if (!info.enabled)
    return (
      <>
        <p className="section">{t('adm_security_prices')}</p>
        <div className="note error">{t('adm_security_config_error')}{info.errors?.length ? ': ' + info.errors.join(' · ') : ''}</div>
      </>
    );
  const kinds = (['door', 'safe'] as const).filter((k) => Array.isArray(info[k]));
  return (
    <>
      <p className="section">{t('adm_security_prices')}</p>
      <p className="hint">{t('adm_security_prices_help')}</p>
      {kinds.map((kind) => (
        <div key={kind}>
          <p className="hint">{t(kind === 'door' ? 'security_door' : 'security_safe')}</p>
          <div className="grid3">
            {(info[kind] as { level: number; label?: string; price: number }[]).slice(1).map((l) => (
              <Field key={l.level} label={`${t('level_n', l.level)}${l.label ? ' · ' + l.label : ''}`}>
                <NumberInput
                  value={draft.security?.[kind]?.[String(l.level)] ?? null}
                  min={0}
                  step="1"
                  placeholder={String(l.price)}
                  onChange={(value) =>
                    patchDraft((d) => {
                      d.security = { ...(Array.isArray(d.security) ? {} : d.security) };
                      d.security[kind] = { ...(d.security[kind] || {}), [String(l.level)]: value };
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function BuildingWizard({ draft }: { draft: Building }) {
  const t = useT(),
    step = useAdminStore((s) => s.step),
    selectedId = useAdminStore((s) => s.selectedId);
  const [evictNumber, setEvictNumber] = useState<number | null>(null),
    [photoRoom, setPhotoRoom] = useState('');
  const numbers = roomNumbers(draft),
    selectedPhoto = numbers.some((n) => String(n) === photoRoom) ? photoRoom : String(numbers[0] || '');
  const ownPhoto = draft.roomImages?.[selectedPhoto] || '',
    photo = ownPhoto || draft.imageUrl || '';
  const text = (
    key: 'id' | 'label' | 'description' | 'imageUrl' | 'ipl' | 'doorModel',
    max: number,
    disabled = false,
  ) => (
    <input
      className="input"
      value={draft[key] ?? ''}
      maxLength={max}
      disabled={disabled}
      onChange={(e) =>
        patchDraft((d) => {
          d[key] = e.target.value;
        })
      }
    />
  );
  const capture = (kind: string, index?: number) => {
    if (index != null) useAdminStore.setState({ safeFor: index });
    void fetchNUI('adm_capture', { kind });
  };
  const groupNumber = (
    group: 'floors' | 'pricing' | 'blip',
    key: string,
    min?: number,
    max?: number,
    precision?: string,
  ) => (
    <NumberInput
      value={(draft[group] as Record<string, number | null>)[key]}
      min={min}
      max={max}
      step={precision}
      onChange={(value) =>
        patchDraft((d) => {
          (d[group] as Record<string, number | null>)[key] = value;
        })
      }
    />
  );
  return (
    <section className="body wizard">
      <ol className="steps">
        {STEPS.map((key, i) => (
          <li key={key} className={i + 1 < step ? 'done' : i + 1 === step ? 'current' : ''}>
            <button type="button" onClick={() => useAdminStore.setState({ step: i + 1 })}>
              <span className="num">{i + 1 < step ? <Icon name="check" /> : i + 1}</span>
              <span>{t(key)}</span>
            </button>
            {i < STEPS.length - 1 && <span className={'line ' + (i + 1 < step ? 'done' : '')} />}
          </li>
        ))}
      </ol>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        {step === 1 && (
          <div>
            <Field label={t('adm_label')}>{text('label', 64)}</Field>
            <Field label={t('adm_id')}>{text('id', 32, !!selectedId)}</Field>
            <Field label={t('adm_description')}>{text('description', 240)}</Field>
            <Field label={t('adm_image_url')}>{text('imageUrl', 2048)}</Field>
            <p className="hint">{t('adm_image_help')}</p>
          </div>
        )}
        {step === 2 && (
          <div className="capture">
            <span className="icon-box big">
              <Icon name="users" />
            </span>
            <b>{draft.reception ? t('adm_reception_set') : t('adm_not_set')}</b>
            <code>
              {draft.reception &&
                `${draft.reception.x.toFixed(2)}, ${draft.reception.y.toFixed(2)}, ${draft.reception.z.toFixed(2)} · ${Math.round(draft.reception.w || 0)}°`}
            </code>
            <p>{t('adm_reception_help')}</p>
            <button type="button" className="btn btn-primary" onClick={() => capture('reception')}>
              <Icon name="pin" />
              {t('adm_set_here')}
            </button>
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="hint">{t('adm_rooms_help')}</p>
            <div className="stack">
              {[...draft.rooms]
                .sort((a, b) => a.index - b.index)
                .map((room) => (
                  <div key={room.index} className="card">
                    <span className="room-num">{100 + room.index}</span>
                    <div className="grow">
                      <div className="name-row">
                        <span className="pill">
                          {room.door.x.toFixed(2)}, {room.door.y.toFixed(2)}, {room.door.z.toFixed(2)}
                        </span>
                        {!(room.model ?? draft.doorModel) && (
                          <span className="badge muted">{t('adm_no_lock')}</span>
                        )}
                      </div>
                      <div className="meta">
                        <span>
                          <Icon name="vault" />
                          {room.safe ? t('adm_safe_placed') : t('adm_safe_missing')}
                        </span>
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => capture('safe', room.index)}
                      >
                        <Icon name="vault" />
                        {t('adm_place_safe')}
                      </button>
                      <button
                        type="button"
                        className="icon-btn sm"
                        title={t('fe_goto')}
                        disabled={!selectedId}
                        onClick={() => action('adm_goto', { hotel: selectedId, room: 100 + room.index })}
                      >
                        <Icon name="pin" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn sm danger"
                        title={t('adm_delete')}
                        onClick={() =>
                          patchDraft((d) => {
                            d.rooms = d.rooms.filter((r) => r.index !== room.index);
                          })
                        }
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button type="button" className="card create small" onClick={() => capture('door')}>
              <span className="icon-box">
                <Icon name="plus" />
              </span>
              <span>
                <b>{t('adm_add_door')}</b>
                <small>{t('adm_add_door_desc')}</small>
              </span>
            </button>
            {selectedId && (
              <div>
                <p className="section">{t('adm_evict')}</p>
                <div className="row">
                  <NumberInput value={evictNumber} onChange={setEvictNumber} min={101} step="1" />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (!evictNumber) return;
                      confirm(t('adm_evict'), t('adm_evict_text', evictNumber), async () => {
                        const result = await action<AdminPayload>('adm_evictRoom', {
                          hotel: selectedId,
                          room: evictNumber,
                        });
                        if (result?.success) {
                          applyPayload(result);
                          setEvictNumber(null);
                        }
                      });
                    }}
                  >
                    {t('adm_evict')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 4 && (
          <div>
            <div className="grid3">
              <Field label={t('adm_floor_count')}>{groupNumber('floors', 'count', 1, 99, '1')}</Field>
              <Field label={t('adm_base_z')}>{groupNumber('floors', 'baseZ')}</Field>
              <Field label={t('adm_floor_step')}>{groupNumber('floors', 'step', 0)}</Field>
            </div>
            <button type="button" className="btn btn-secondary wide" onClick={() => capture('floor')}>
              <Icon name="ruler" />
              {t('adm_measure_floor')}
            </button>
            {numbers.length > 0 && (
              <div className="note">
                {t('adm_floor_preview', numbers.length, numbers[0], numbers[numbers.length - 1])}
              </div>
            )}
            <AlarmPlacement draft={draft} />
            <p className="section">{t('adm_room_photos')}</p>
            <p className="hint">{t('adm_room_image_help')}</p>
            <Field label={t('adm_room_number')}>
              <select
                className="select"
                value={selectedPhoto}
                disabled={!numbers.length}
                onChange={(e) => setPhotoRoom(e.target.value)}
              >
                {numbers.map((n) => (
                  <option key={n} value={String(n)}>
                    #{n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('adm_room_image_url')}>
              <input
                className="input"
                value={ownPhoto}
                disabled={!numbers.length}
                maxLength={2048}
                placeholder="https://..."
                onChange={(e) =>
                  patchDraft((d) => {
                    const value = e.target.value;
                    d.roomImages = { ...d.roomImages };
                    if (value) d.roomImages[selectedPhoto] = value;
                    else delete d.roomImages[selectedPhoto];
                  })
                }
              />
            </Field>
            <p className="hint">{ownPhoto ? t('adm_image_custom') : t('adm_image_inherited')}</p>
            <Photo key={photo} url={photo} alt={t('adm_room_number') + ' ' + selectedPhoto} />
            <details>
              <summary>{t('adm_advanced')}</summary>
              <Field label={t('adm_ipl')}>{text('ipl', 96)}</Field>
              <Field label={t('adm_door_model')}>{text('doorModel', 64)}</Field>
              <p className="hint">{t('adm_ipl_help')}</p>
            </details>
          </div>
        )}
        {step === 5 && (
          <div>
            <p className="section">{t('adm_payment_options')}</p>
            <div className="options">
              {(
                [
                  { key: 'enablePrepaid', labelKey: 'adm_prepaid' },
                  { key: 'enableContract', labelKey: 'adm_contract' },
                  { key: 'enableBuy', labelKey: 'adm_buy' },
                ] as const
              ).map(({ key, labelKey }) => (
                <label key={key} className={'option ' + (draft[key] ? 'checked' : '')}>
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) =>
                      patchDraft((d) => {
                        d[key] = e.target.checked;
                      })
                    }
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
            </div>
            <div className="grid3">
              {[
                { key: 'daily', labelKey: 'adm_price_daily', min: 0 },
                { key: 'contractDaily', labelKey: 'adm_price_contract', min: 0 },
                { key: 'buy', labelKey: 'adm_price_buy', min: 0 },
                { key: 'contractMinDays', labelKey: 'adm_contract_min', min: 1, max: 365 },
                { key: 'contractMaxDays', labelKey: 'adm_contract_max', min: 1, max: 365 },
              ].map((field) => (
                <Field key={field.key} label={t(field.labelKey)}>
                  {groupNumber('pricing', field.key, field.min, field.max, '1')}
                </Field>
              ))}
            </div>
            <SecurityPrices draft={draft} />
            <p className="section">{t('adm_blip')}</p>
            <div className="grid3">
              <Field label={t('adm_blip_sprite')}>{groupNumber('blip', 'sprite', 0, 1000, '1')}</Field>
              <Field label={t('adm_blip_color')}>{groupNumber('blip', 'color', 0, 100, '1')}</Field>
              <Field label={t('adm_blip_scale')}>{groupNumber('blip', 'scale', 0.1, 5, '0.1')}</Field>
            </div>
            <label className="option inline">
              <input
                type="checkbox"
                checked={!!draft.blip.hidden}
                onChange={(e) =>
                  patchDraft((d) => {
                    d.blip.hidden = e.target.checked;
                  })
                }
              />
              <span>{t('adm_blip_hidden')}</span>
            </label>
          </div>
        )}
      </form>
    </section>
  );
}
export function BuildingPanel() {
  const t = useT(),
    draft = useAdminStore((s) => s.draft),
    step = useAdminStore((s) => s.step),
    dirty = useAdminStore((s) => s.dirty),
    selectedId = useAdminStore((s) => s.selectedId),
    busy = useAdminStore((s) => s.busy),
    count = useAdminStore((s) => Object.keys(s.payload.hotels).length);
  const save = async () => {
    if (!draft) return;
    const result = await action<AdminPayload>(
      'adm_saveHotel',
      { hotel: saveDefinition(draft) },
      t('adm_saved'),
    );
    if (result?.success) {
      applyPayload(result);
      closeBuilding();
    }
  };
  return (
    <div className="overlay">
      <div className="panel">
        <header className="head">
          <button className="icon-btn" title="Esc" onClick={closeAdmin}>
            <Icon name="x" />
          </button>
          <div className="title">
            <h2>{t('adm_title')}</h2>
            <p>{t('adm_subtitle')}</p>
          </div>
          <span className="head-spacer" />
        </header>
        <AdminTabs />
        {draft ? <BuildingWizard draft={draft} /> : <BuildingList />}
        <footer className="foot">
          <span className="muted">
            {draft
              ? selectedId
                ? `${draft.label} · ${selectedId}`
                : t('adm_new_building')
              : t('adm_buildings_count', count)}
          </span>
          <div className="foot-actions">
            {draft ? (
              <>
                {dirty && <span className="dirty">{t('adm_unsaved')}</span>}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    step === 1 ? guardDirty(closeBuilding) : useAdminStore.setState({ step: step - 1 })
                  }
                >
                  {step === 1 ? t('cancel') : t('back')}
                </button>
                {step < STEPS.length && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => useAdminStore.setState({ step: step + 1 })}
                  >
                    {t('continue')}
                  </button>
                )}
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
                  {t('adm_save')}
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={closeAdmin}>
                {t('close')}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
