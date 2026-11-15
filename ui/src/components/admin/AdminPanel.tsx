import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useEffect } from 'react';
import { useT } from '@/i18n';
import { BuildingPanel } from './BuildingPanel';
import { FurniturePanel } from './FurniturePanel';
import { closeAdmin, closeBuilding, guardDirty, useAdminStore } from './state';
import './admin.css';

export function AdminPanel() {
  const t = useT(),
    active = useAdminStore((s) => s.active),
    visible = useAdminStore((s) => s.visible),
    tab = useAdminStore((s) => s.tab);
  const confirmation = useAdminStore((s) => s.confirmation),
    toast = useAdminStore((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (useAdminStore.getState().toast?.id === toast.id) useAdminStore.setState({ toast: null });
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!active || !visible) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      const state = useAdminStore.getState();
      if (state.confirmation) useAdminStore.setState({ confirmation: null });
      else if (state.draft) guardDirty(closeBuilding);
      else closeAdmin();
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [active, visible]);
  if (!active) return null;
  return (
    <div className="apartment-admin" hidden={!visible}>
      <div hidden={tab !== 'buildings'}>
        <BuildingPanel />
      </div>
      <div hidden={tab !== 'furniture'}>
        <FurniturePanel enabled={visible && tab === 'furniture' && !confirmation} />
      </div>
      {toast && (
        <div className={'admin-toast ' + (toast.error ? 'error' : '')} role="status">
          {toast.message}
        </div>
      )}
      {confirmation && (
        <div className="overlay dim" role="dialog" aria-modal="true" aria-label={confirmation.title}>
          <div className="panel dialog">
            <header className="head">
              <div className="title">
                <h2>{confirmation.title}</h2>
              </div>
            </header>
            <div className="body">
              <p className="confirm-text">{confirmation.text}</p>
            </div>
            <footer className="foot end">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => useAdminStore.setState({ confirmation: null })}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  useAdminStore.setState({ confirmation: null });
                  confirmation.run();
                }}
              >
                {t('adm_confirm')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
