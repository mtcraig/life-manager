import type { AppSettingsDto, UpdateAppSettingsInput } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchAppSettings() {
  return apiFetch<AppSettingsDto>('/app-settings');
}

export function updateAppSettings(input: UpdateAppSettingsInput) {
  return apiFetch<AppSettingsDto>('/app-settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
