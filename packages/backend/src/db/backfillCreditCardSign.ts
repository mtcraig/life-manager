import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './client';
import { accounts } from './schema/accounts';
import { transactions } from './schema/transactions';

export interface CreditCardSignBackfillResult {
  accountsFixed: { id: number; name: string; transactionsFixed: number }[];
}

/**
 * One-time correction for accounts ingested before credit-card transactions
 * negated their amount at parse time (see csvParser.ts's `accountType`
 * param). Negates `amount` (not `balanceAfter`, which isn't part of this
 * fix) for every transaction on a `credit_card` account, then marks the
 * account so re-running this is a no-op — running it twice would flip an
 * already-corrected account straight back to the wrong sign.
 */
export function backfillCreditCardSign(): CreditCardSignBackfillResult {
  const pendingAccounts = db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(and(eq(accounts.type, 'credit_card'), isNull(accounts.creditCardSignFixedAt)))
    .all();

  const accountsFixed = pendingAccounts.map(({ id, name }) => {
    const result = db
      .update(transactions)
      .set({ amount: sql`-${transactions.amount}` })
      .where(eq(transactions.accountId, id))
      .run();

    db.update(accounts).set({ creditCardSignFixedAt: Date.now() }).where(eq(accounts.id, id)).run();

    return { id, name, transactionsFixed: result.changes };
  });

  return { accountsFixed };
}
