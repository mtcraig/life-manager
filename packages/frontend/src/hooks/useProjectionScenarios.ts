import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProjectionScenarioInput,
  UpdateProjectionScenarioInput,
} from '@life-manager/shared';
import * as scenariosApi from '../api/projectionScenarios.js';

const SCENARIOS_KEY = ['projection-scenarios'] as const;
const resultKey = (id: number) => ['projection-result', id] as const;

export function useProjectionScenarios() {
  return useQuery({
    queryKey: SCENARIOS_KEY,
    queryFn: () => scenariosApi.fetchProjectionScenarios(),
  });
}

export function useCreateProjectionScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectionScenarioInput) =>
      scenariosApi.createProjectionScenario(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCENARIOS_KEY }),
  });
}

export function useUpdateProjectionScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProjectionScenarioInput }) =>
      scenariosApi.updateProjectionScenario(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCENARIOS_KEY }),
  });
}

export function useDeleteProjectionScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => scenariosApi.deleteProjectionScenario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCENARIOS_KEY }),
  });
}

export function useProjectionResult(id: number) {
  return useQuery({
    queryKey: resultKey(id),
    queryFn: () => scenariosApi.fetchProjectionResult(id),
  });
}
