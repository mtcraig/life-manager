import type { AppSettingsDto, UpdateAppSettingsInput } from '@life-manager/shared';
import * as repo from './repo';

export function getAppSettings(): AppSettingsDto {
  return { userName: repo.getAppSettings().userName };
}

export function updateAppSettings(input: UpdateAppSettingsInput): AppSettingsDto {
  return { userName: repo.updateAppSettings({ userName: input.userName }).userName };
}
