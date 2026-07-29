export interface MoneyFlowInput {
  amount: number; // integer pence; positive = money in, negative = money out
  isTransfer: boolean; // true when the transaction's category has is_transfer set
}

export interface MoneyInOutResult {
  moneyIn: number;
  moneyOut: number;
  net: number;
}

/**
 * Sums money in/out across a set of transactions. Excludes only is_transfer
 * rows — Uncategorised transactions are deliberately included, since
 * Uncategorised and Transfer are separate, orthogonal states in the domain model.
 */
export function computeMoneyInOut(transactions: MoneyFlowInput[]): MoneyInOutResult {
  let moneyIn = 0;
  let moneyOut = 0;

  for (const txn of transactions) {
    if (txn.isTransfer) continue;
    if (txn.amount >= 0) {
      moneyIn += txn.amount;
    } else {
      moneyOut += txn.amount;
    }
  }

  return { moneyIn, moneyOut, net: moneyIn + moneyOut };
}
