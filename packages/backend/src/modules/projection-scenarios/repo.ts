import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { projectionScenarios } from '../../db/schema/projection-scenarios';

export interface ProjectionScenarioRow {
  id: number;
  name: string;
  growthRatePct: number;
  monthlyContribution: number;
  retirementAge: number | null;
  retirementDate: string | null;
  comments: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectionScenarioWriteFields {
  name: string;
  growthRatePct: number;
  monthlyContribution: number;
  retirementAge: number | null;
  retirementDate: string | null;
  comments: string | null;
}

export function listScenarios(): ProjectionScenarioRow[] {
  return db.select().from(projectionScenarios).all();
}

export function getScenarioById(id: number): ProjectionScenarioRow | undefined {
  return db.select().from(projectionScenarios).where(eq(projectionScenarios.id, id)).get();
}

export function insertScenario(fields: ProjectionScenarioWriteFields): ProjectionScenarioRow {
  const now = Date.now();
  return db
    .insert(projectionScenarios)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateScenario(
  id: number,
  fields: Partial<ProjectionScenarioWriteFields>,
): ProjectionScenarioRow | undefined {
  return db
    .update(projectionScenarios)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(projectionScenarios.id, id))
    .returning()
    .get();
}

export function deleteScenario(id: number): boolean {
  const result = db
    .delete(projectionScenarios)
    .where(eq(projectionScenarios.id, id))
    .run();
  return result.changes > 0;
}
