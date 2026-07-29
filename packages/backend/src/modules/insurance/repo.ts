import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { insurancePlans } from '../../db/schema/insurance-plans';

export interface InsurancePlanRow {
  id: number;
  name: string;
  type: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: string;
  renewalDate: string;
  provider: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface InsurancePlanWriteFields {
  name: string;
  type: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: string;
  renewalDate: string;
  provider: string | null;
  notes: string | null;
}

export function listInsurancePlans(): InsurancePlanRow[] {
  return db.select().from(insurancePlans).all();
}

export function getInsurancePlanById(id: number): InsurancePlanRow | undefined {
  return db.select().from(insurancePlans).where(eq(insurancePlans.id, id)).get();
}

export function insertInsurancePlan(fields: InsurancePlanWriteFields): InsurancePlanRow {
  const now = Date.now();
  return db
    .insert(insurancePlans)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateInsurancePlan(
  id: number,
  fields: Partial<InsurancePlanWriteFields>,
): InsurancePlanRow | undefined {
  return db
    .update(insurancePlans)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(insurancePlans.id, id))
    .returning()
    .get();
}

export function deleteInsurancePlan(id: number): boolean {
  const result = db.delete(insurancePlans).where(eq(insurancePlans.id, id)).run();
  return result.changes > 0;
}
