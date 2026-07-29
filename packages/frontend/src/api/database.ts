import { apiFetch } from './client.js';

/** A plain link/anchor download — no fetch/blob dance needed, the browser
 * handles the download from the response's Content-Disposition header. */
export const DATABASE_BACKUP_URL = '/api/database/backup';

export function resetDatabase() {
  return apiFetch<void>('/database/reset', { method: 'POST' });
}
