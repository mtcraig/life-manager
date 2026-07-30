import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { appSettings } from '../../db/schema/app-settings';

export interface AppSettingsRow {
  id: number;
  userName: string | null;
  updatedAt: number;
}

const SETTINGS_ID = 1;

export function getAppSettings(): AppSettingsRow {
  return (
    db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).get() ?? {
      id: SETTINGS_ID,
      userName: null,
      updatedAt: 0,
    }
  );
}

export function updateAppSettings(fields: { userName: string | null }): AppSettingsRow {
  const now = Date.now();
  db.insert(appSettings)
    .values({ id: SETTINGS_ID, userName: fields.userName, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.id, set: { userName: fields.userName, updatedAt: now } })
    .run();
  return getAppSettings();
}
