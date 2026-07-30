import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { vendors } from '../../db/schema/vendors';

export interface VendorRow {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface VendorWriteFields {
  name: string;
}

export function listVendors(): VendorRow[] {
  return db.select().from(vendors).all();
}

export function getVendorById(id: number): VendorRow | undefined {
  return db.select().from(vendors).where(eq(vendors.id, id)).get();
}

export function getVendorByName(name: string): VendorRow | undefined {
  return db.select().from(vendors).where(eq(vendors.name, name)).get();
}

export function insertVendor(fields: VendorWriteFields): VendorRow {
  const now = Date.now();
  return db
    .insert(vendors)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}
