import { apiFetch } from './client.js';

export function shutdownServers() {
  return apiFetch<void>('/system/shutdown', { method: 'POST' });
}
