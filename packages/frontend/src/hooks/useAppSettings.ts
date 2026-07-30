import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateAppSettingsInput } from '@life-manager/shared';
import * as appSettingsApi from '../api/appSettings.js';

const APP_SETTINGS_KEY = ['app-settings'] as const;

export function useAppSettings() {
  return useQuery({
    queryKey: APP_SETTINGS_KEY,
    queryFn: () => appSettingsApi.fetchAppSettings(),
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAppSettingsInput) => appSettingsApi.updateAppSettings(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APP_SETTINGS_KEY }),
  });
}
