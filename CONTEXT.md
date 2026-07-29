# Personal Finance Dashboard

A local, single-user application replacing a Power BI dashboard, giving a unified view of finances, investments, insurance, energy usage, and household contents.

## Language

**Account**:
A single financial account (bank, credit card, etc.), represented by one folder of transaction-detail CSVs. Each account is independent and the app must scale to any number of them.
_Avoid_: Using "account" for investment holdings or energy records — those are separate concepts.

**Investment**:
A holding (fund, pension, stock, etc.) tracked as periodic as-of-date valuations entered directly in the app, not as a list of transactions.
_Avoid_: Treating an investment as an "Account" — it has no transaction detail, only point-in-time values.

**Energy Usage**:
Metered consumption records (electricity, gas, water), tracked as their own independent series — not tied to, or filed under, a financial Account.

## Wealth

**Wealth** (Net Worth):
The total financial position, calculated as Liquid Assets + Non-liquid Assets − Liabilities.
_Avoid_: Using "wealth" to mean just account balances, or just investments — it's the full net-worth amalgamation.

**Liquid Assets**:
Value that is readily accessible as cash — financial Account balances and Investment valuations.

**Non-liquid Assets**:
Value that cannot be quickly converted to cash — Property (home value) and Contents (insured household possessions), each tracked as manually-entered, periodic as-of-date valuations.

**Liability**:
A debt (e.g. mortgage, loan) tracked as a manually-entered, periodic as-of-date value, subtracted from assets to calculate Wealth.
_Avoid_: Modelling liabilities as a financial Account — they have no transaction detail, only a periodic balance.

## Categorisation

**Category**:
A label assigned to a Transaction via fuzzy-matching against the Categorisation Rules, used to summarise spending/income across the app.

**Transfer** (Category):
The specific Category marking a Transaction as movement between the user's own Accounts, rather than real income or spending. Transfer-categorised transactions are excluded from money in/out delta calculations (e.g. the Home page calendar) to avoid double-counting.

**Categorisation Rule**:
A lookup entry mapping a transaction description/merchant pattern to a Category, matched via fuzzy string matching. Bulk-loadable from a CSV export of the user's existing spreadsheet lookup, and extendable with new entries directly in the app.

**Uncategorised**:
The explicit state of a Transaction with no confident Categorisation Rule match, kept visible and filterable rather than folded into a generic "Other" category, so gaps in the rule set can be found and fixed.

## Investments

**Projection Scenario**:
A named set of assumptions (growth rate %, monthly ongoing contribution, retirement age/date) used to compound current Investment valuations forward. Multiple named scenarios (e.g. pessimistic/expected/optimistic) are shown side by side rather than a single deterministic line or a full probabilistic simulation.

## Insurance

**Insurance Plan**:
A tracked policy (home, contents, etc.) with coverage amount, premium, and renewal date. Purely informational — coverage amounts are a reimbursement ceiling, not an owned value, so Insurance Plans make no contribution to the Wealth calculation. Actual asset value comes from Property valuations and the Contents inventory instead.

## Contents

**Contents Item**:
A single household possession tracked with its own value and an Area tag (e.g. lounge, kitchen), for insurance-claim purposes. The sum of all Contents Items forms the Non-liquid Asset value contributed to Wealth.

**Area**:
A room/location tag (e.g. lounge, kitchen) attached to a Contents Item, so its physical location is known in the event of an insurance claim.

## Energy

**Energy Reading**:
A metered usage-volume record (electricity in kWh, gas in kWh/m³, water in m³/litres) for the single tracked property. Volume only, no cost/tariff modelling — utility spend is already captured via normal Transactions categorised as "Utilities." Tariff-based cost tracking and multi-property support are explicitly deferred, not in scope for the initial build.

## Data Ingestion

**Ingestion Mode**:
Per Account (or Energy series), a choice between manual ("Ingest now" button, scans the folder on demand) and watched (the backend monitors a configured folder and ingests new/changed CSVs automatically). Both modes read from the same folder/file convention — the difference is only what triggers the scan.
