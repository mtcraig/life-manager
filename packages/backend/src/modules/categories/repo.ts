import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories } from '../../db/schema/categories';

export interface CategoryRow {
  id: number;
  name: string;
  isTransfer: boolean;
  kind: string | null;
  color: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CategoryWriteFields {
  name: string;
  isTransfer: boolean;
  kind: string | null;
  color: string | null;
}

export function listCategories(): CategoryRow[] {
  return db.select().from(categories).orderBy(asc(categories.name)).all();
}

export function getCategoryById(id: number): CategoryRow | undefined {
  return db.select().from(categories).where(eq(categories.id, id)).get();
}

export function getCategoryByName(name: string): CategoryRow | undefined {
  return db.select().from(categories).where(eq(categories.name, name)).get();
}

export function insertCategory(fields: CategoryWriteFields): CategoryRow {
  const now = Date.now();
  return db
    .insert(categories)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}
