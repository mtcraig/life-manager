import { backfillCreditCardSign } from './backfillCreditCardSign';

const { accountsFixed } = backfillCreditCardSign();

if (accountsFixed.length === 0) {
  console.log('No credit_card accounts needed a sign backfill (already applied or none configured).');
} else {
  for (const account of accountsFixed) {
    console.log(`${account.name}: negated ${account.transactionsFixed} transaction(s).`);
  }
}
