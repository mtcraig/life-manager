import type {
  CreateProjectionScenarioInput,
  ProjectionResultDto,
  ProjectionScenarioDto,
  UpdateProjectionScenarioInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchProjectionScenarios() {
  return apiFetch<ProjectionScenarioDto[]>('/projection-scenarios');
}

export function createProjectionScenario(input: CreateProjectionScenarioInput) {
  return apiFetch<ProjectionScenarioDto>('/projection-scenarios', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProjectionScenario(id: number, input: UpdateProjectionScenarioInput) {
  return apiFetch<ProjectionScenarioDto>(`/projection-scenarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProjectionScenario(id: number) {
  return apiFetch<undefined>(`/projection-scenarios/${id}`, { method: 'DELETE' });
}

export function fetchProjectionResult(id: number) {
  return apiFetch<ProjectionResultDto>(`/projection-scenarios/${id}/projection`);
}
