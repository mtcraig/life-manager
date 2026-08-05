import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { appSettings } from '../../db/schema/app-settings';

export interface AppSettingsRow {
  id: number;
  userName: string | null;
  topTransactionsDisplay: string | null;
  dateFormat: string | null;
  updatedAt: number;
}

export interface AppSettingsWriteFields {
  userName: string | null;
  topTransactionsDisplay: string | null;
  dateFormat: string | null;
}

const SETTINGS_ID = 1;

export function getAppSettings(): AppSettingsRow {
  return (
    db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).get() ?? {
      id: SETTINGS_ID,
      userName: null,
      topTransactionsDisplay: null,
      dateFormat: null,
      updatedAt: 0,
    }
  );
}

export function updateAppSettings(fields: AppSettingsWriteFields): AppSettingsRow {
  const now = Date.now();
  db.insert(appSettings)
    .values({ id: SETTINGS_ID, ...fields, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.id, set: { ...fields, updatedAt: now } })
    .run();
  return getAppSettings();
}
