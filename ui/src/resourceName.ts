/** Runtime identity check; editable under the same GPL terms as this source. */
export const RESOURCE_NAME = 'zloma_apartments';
declare const GetParentResourceName: (() => string) | undefined;

export function assertResourceName(): void {
  if (typeof window === 'undefined') return; // static export / server-side build
  const host = window.location.hostname;
  const current = typeof GetParentResourceName === 'function'
    ? GetParentResourceName()
    : host.startsWith('cfx-nui-') ? host.slice('cfx-nui-'.length)
    : window.location.protocol === 'nui:' ? host : null;
  if (current !== null && current !== RESOURCE_NAME) {
    throw new Error(`[${RESOURCE_NAME}] Resource must be named "${RESOURCE_NAME}" (received "${current}"). Rename the folder and use ensure ${RESOURCE_NAME}.`);
  }
}
assertResourceName();
