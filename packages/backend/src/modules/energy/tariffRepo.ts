import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { utilityTariffs } from '../../db/schema/utility-tariffs';

export interface UtilityTariffRow {
  id: number;
  meterType: string;
  providerName: string;
  startDate: string;
  endDate: string | null;
  standingChargePerDay: number;
  unitRate: number;
  wastewaterStandingChargePerDay: number | null;
  wastewaterUnitRate: number | null;
  rainwaterRemovalStandingChargePerDay: number | null;
  calorificValue: number | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface UtilityTariffWriteFields {
  meterType: string;
  providerName: string;
  startDate: string;
  endDate: string | null;
  standingChargePerDay: number;
  unitRate: number;
  wastewaterStandingChargePerDay: number | null;
  wastewaterUnitRate: number | null;
  rainwaterRemovalStandingChargePerDay: number | null;
  calorificValue: number | null;
  notes: string | null;
}

export function listUtilityTariffs(): UtilityTariffRow[] {
  return db.select().from(utilityTariffs).all();
}

export function getUtilityTariffById(id: number): UtilityTariffRow | undefined {
  return db.select().from(utilityTariffs).where(eq(utilityTariffs.id, id)).get();
}

export function insertUtilityTariff(fields: UtilityTariffWriteFields): UtilityTariffRow {
  const now = Date.now();
  return db
    .insert(utilityTariffs)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateUtilityTariff(
  id: number,
  fields: Partial<UtilityTariffWriteFields>,
): UtilityTariffRow | undefined {
  return db
    .update(utilityTariffs)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(utilityTariffs.id, id))
    .returning()
    .get();
}

export function deleteUtilityTariff(id: number): boolean {
  const result = db.delete(utilityTariffs).where(eq(utilityTariffs.id, id)).run();
  return result.changes > 0;
}
