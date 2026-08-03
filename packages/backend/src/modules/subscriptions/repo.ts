import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { subscriptions } from '../../db/schema/subscriptions';

export interface SubscriptionRow {
  id: number;
  name: string;
  provider: string | null;
  amount: number;
  frequency: string;
  categoryId: number | null;
  startDate: string;
  nextRenewalDate: string;
  cancelledAt: number | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionWriteFields {
  name: string;
  provider: string | null;
  amount: number;
  frequency: string;
  categoryId: number | null;
  startDate: string;
  nextRenewalDate: string;
  notes: string | null;
}

export function listSubscriptions(): SubscriptionRow[] {
  return db.select().from(subscriptions).all();
}

export function getSubscriptionById(id: number): SubscriptionRow | undefined {
  return db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
}

export function insertSubscription(fields: SubscriptionWriteFields): SubscriptionRow {
  const now = Date.now();
  return db
    .insert(subscriptions)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateSubscription(
  id: number,
  fields: Partial<SubscriptionWriteFields>,
): SubscriptionRow | undefined {
  return db
    .update(subscriptions)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(subscriptions.id, id))
    .returning()
    .get();
}

export function deleteSubscription(id: number): boolean {
  const result = db.delete(subscriptions).where(eq(subscriptions.id, id)).run();
  return result.changes > 0;
}

export function cancelSubscription(id: number): SubscriptionRow | undefined {
  return db
    .update(subscriptions)
    .set({ cancelledAt: Date.now(), updatedAt: Date.now() })
    .where(eq(subscriptions.id, id))
    .returning()
    .get();
}
