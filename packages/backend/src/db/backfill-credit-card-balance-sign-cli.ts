import { backfillCreditCardBalanceSign } from './backfillCreditCardBalanceSign';

const { accountsFixed } = backfillCreditCardBalanceSign();

if (accountsFixed.length === 0) {
  console.log('No credit_card accounts needed a balance sign backfill (already applied or none configured).');
} else {
  for (const account of accountsFixed) {
    console.log(`${account.name}: negated ${account.transactionsFixed} balanceAfter value(s).`);
  }
}
