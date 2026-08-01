import { z } from 'zod';

export interface ProjectionScenarioDto {
  id: number;
  name: string;
  growthRatePct: number;
  monthlyContribution: number; // integer pence
  retirementAge: number | null;
  retirementDate: string | null; // ISO YYYY-MM-DD
  /** Free-form explanation of the scenario being modeled — lets the name stay a short title. */
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createProjectionScenarioSchema = z.object({
  name: z.string().min(1),
  growthRatePct: z.number(),
  monthlyContribution: z.number().int().default(0),
  retirementAge: z.number().int().positive().optional(),
  retirementDate: z.string().optional(),
  comments: z.string().min(1).optional(),
});
export type CreateProjectionScenarioInput = z.infer<typeof createProjectionScenarioSchema>;

export const updateProjectionScenarioSchema = createProjectionScenarioSchema.partial();
export type UpdateProjectionScenarioInput = z.infer<typeof updateProjectionScenarioSchema>;

export interface ProjectionResultDto {
  /** Null when the scenario has no retirementDate set — there's no birthdate in
   *  the domain model to convert a retirementAge into a target date. */
  projectedValue: number | null;
  months: number | null;
}
