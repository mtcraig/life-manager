import { and, eq, isNull, isNotNull, sql } from 'drizzle-orm';
import { db } from './client';
import { accounts } from './schema/accounts';
import { transactions } from './schema/transactions';

export interface CreditCardBalanceSignBackfillResult {
  accountsFixed: { id: number; name: string; transactionsFixed: number }[];
}

/**
 * One-time correction for `balanceAfter` on credit_card accounts, mirroring
 * backfillCreditCardSign but for `balanceAfter` instead of `amount` (see
 * csvParser.ts's `accountType` param, which now negates both going forward).
 * Uses its own tracking column rather than `creditCardSignFixedAt`, since
 * that flag was already consumed by the original amount-only backfill for
 * some accounts and re-triggering it would double-negate their `amount`.
 */
export function backfillCreditCardBalanceSign(): CreditCardBalanceSignBackfillResult {
  const pendingAccounts = db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(and(eq(accounts.type, 'credit_card'), isNull(accounts.creditCardBalanceSignFixedAt)))
    .all();

  const accountsFixed = pendingAccounts.map(({ id, name }) => {
    const result = db
      .update(transactions)
      .set({ balanceAfter: sql`-${transactions.balanceAfter}` })
      .where(and(eq(transactions.accountId, id), isNotNull(transactions.balanceAfter)))
      .run();

    db.update(accounts).set({ creditCardBalanceSignFixedAt: Date.now() }).where(eq(accounts.id, id)).run();

    return { id, name, transactionsFixed: result.changes };
  });

  return { accountsFixed };
}
