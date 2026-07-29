import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { areas } from '../../db/schema/areas';

export interface AreaRow {
  id: number;
  name: string;
  createdAt: number;
}

export function listAreas(): AreaRow[] {
  return db.select().from(areas).all();
}

export function getAreaById(id: number): AreaRow | undefined {
  return db.select().from(areas).where(eq(areas.id, id)).get();
}

export function insertArea(name: string): AreaRow {
  return db.insert(areas).values({ name, createdAt: Date.now() }).returning().get();
}

export function deleteArea(id: number): boolean {
  const result = db.delete(areas).where(eq(areas.id, id)).run();
  return result.changes > 0;
}
