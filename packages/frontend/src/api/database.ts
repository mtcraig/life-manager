import { apiFetch, ApiError } from './client.js';

/** A plain link/anchor download — no fetch/blob dance needed, the browser
 * handles the download from the response's Content-Disposition header. */
export const DATABASE_BACKUP_URL = '/api/database/backup';
const DATABASE_IMPORT_URL = '/api/database/import';

export function resetDatabase() {
  return apiFetch<void>('/database/reset', { method: 'POST' });
}

/**
 * Deliberately doesn't use apiFetch: it force-sets Content-Type: application/json
 * whenever a body is present, which would corrupt a multipart upload's boundary.
 * Letting the browser set Content-Type itself (by not setting it at all) is
 * required for FormData.
 */
export async function importDatabase(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(DATABASE_IMPORT_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? response.statusText, response.status);
  }
}
