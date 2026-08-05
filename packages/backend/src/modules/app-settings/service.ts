import type {
  AppSettingsDto,
  DisplayDateFormat,
  TopTransactionsDisplay,
  UpdateAppSettingsInput,
} from '@life-manager/shared';
import type { AppSettingsRow } from './repo';
import * as repo from './repo';

const DEFAULT_TOP_TRANSACTIONS_DISPLAY: TopTransactionsDisplay = 'description';
const DEFAULT_DATE_FORMAT: DisplayDateFormat = 'dd_mm';

function toDto(row: AppSettingsRow): AppSettingsDto {
  return {
    userName: row.userName,
    topTransactionsDisplay:
      (row.topTransactionsDisplay as TopTransactionsDisplay | null) ?? DEFAULT_TOP_TRANSACTIONS_DISPLAY,
    dateFormat: (row.dateFormat as DisplayDateFormat | null) ?? DEFAULT_DATE_FORMAT,
  };
}

export function getAppSettings(): AppSettingsDto {
  return toDto(repo.getAppSettings());
}

export function updateAppSettings(input: UpdateAppSettingsInput): AppSettingsDto {
  const existing = repo.getAppSettings();
  const row = repo.updateAppSettings({
    userName: input.userName !== undefined ? input.userName : existing.userName,
    topTransactionsDisplay:
      input.topTransactionsDisplay !== undefined ? input.topTransactionsDisplay : existing.topTransactionsDisplay,
    dateFormat: input.dateFormat !== undefined ? input.dateFormat : existing.dateFormat,
  });
  return toDto(row);
}
