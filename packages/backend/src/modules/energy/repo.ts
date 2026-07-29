import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { energyReadings } from '../../db/schema/energy-readings';

export interface EnergyReadingRow {
  id: number;
  meterType: string;
  readingDate: string;
  value: number;
  unit: string;
  notes: string | null;
  createdAt: number;
}

export interface EnergyReadingWriteFields {
  meterType: string;
  readingDate: string;
  value: number;
  unit: string;
  notes: string | null;
}

export function listEnergyReadings(): EnergyReadingRow[] {
  return db.select().from(energyReadings).all();
}

export function getEnergyReadingById(id: number): EnergyReadingRow | undefined {
  return db.select().from(energyReadings).where(eq(energyReadings.id, id)).get();
}

export function findByMeterAndDate(meterType: string, readingDate: string): EnergyReadingRow | undefined {
  return db
    .select()
    .from(energyReadings)
    .where(and(eq(energyReadings.meterType, meterType), eq(energyReadings.readingDate, readingDate)))
    .get();
}

export function insertEnergyReading(fields: EnergyReadingWriteFields): EnergyReadingRow {
  return db
    .insert(energyReadings)
    .values({ ...fields, createdAt: Date.now() })
    .returning()
    .get();
}

export function deleteEnergyReading(id: number): boolean {
  const result = db.delete(energyReadings).where(eq(energyReadings.id, id)).run();
  return result.changes > 0;
}
