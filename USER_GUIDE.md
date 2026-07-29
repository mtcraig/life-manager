# Life Manager — How to Use

Life Manager is a personal finance dashboard that runs entirely on your own computer.
It replaces a spreadsheet/Power BI setup with one place to track bank accounts,
investments, property, insurance, household contents, and energy usage, and to see how
they all add up to your net wealth. Nothing you enter ever leaves your machine.

This guide covers day-to-day use. For installing dependencies and running the dev
servers for the first time, see [README.md](README.md) — the short version is:

```bash
npm install
npm run db:migrate --workspace=@life-manager/backend
npm run db:seed --workspace=@life-manager/backend
```

Then, each time you want to use the app, open two terminals and run:

```bash
npm run dev:backend
npm run dev:frontend
```

Open **http://127.0.0.1:5173** in your browser. Leave both terminals running while you
use the app; closing them (or your computer sleeping) just means you'll restart them
next time — nothing is lost, since everything is saved to the database as you go.

---

## 1. The navigation

Every page shares the same left-hand sidebar:

**Home · Accounts · Detail · Wealth · Investments · Insurance · Energy · Contents ·
Settings**

There's no login and no separate "save" step anywhere — every form submits directly to
the local database, and every list you see reflects the current database contents.

---

## 2. First-time setup order

The app is easiest to use if you set things up roughly in this order, because a few
pages depend on data existing elsewhere:

1. **Settings → Accounts** — add your bank/savings/credit card accounts first.
2. **Settings → Categorisation Rules** — optionally add rules before you import
   transactions, so new transactions get categorised automatically as they arrive.
3. **Accounts (Settings) → Ingest now**, or set up a watched folder — bring in your
   transaction history.
4. Everything else (Wealth, Investments, Insurance, Energy, Contents) can be filled in
   any time, independently of the above.

---

## 3. Accounts & transactions

### Adding an account

Go to **Settings → Accounts → Add account**. Fill in:

- **Name** — whatever you want to call it (e.g. "Joint Current Account").
- **Type** — `current`, `savings`, `credit_card`, or `other`. This is descriptive only;
  it doesn't change how the account behaves.
- **Institution** (optional) — the bank name, for your own reference.
- **Ingestion mode** — `manual` or `watched` (see below).
- **CSV folder path** — leave blank if you're not ready to import transactions yet. Once
  you fill this in, a "CSV column mapping" section appears (see next section).

### Importing transactions (CSV)

Every account's transactions come from a CSV file exported from your bank, dropped into
a folder on your computer. Because every bank's export format is different, each account
has its own **column mapping** telling the app which columns mean what:

- **Date column header** and **date format** (`YYYY-MM-DD`, `DD/MM/YYYY`, or
  `MM/DD/YYYY`) — must match your bank's export exactly.
- **Description column header**.
- **Amount**: either a single **signed amount column** (positive = money in, negative =
  money out), or **separate debit/credit columns** if your bank exports those instead.

Once an account has a folder and column mapping configured, there are two ways to bring
transactions in:

- **Manual mode**: export a CSV from your bank, save it into the account's configured
  folder, then click **Ingest now** next to the account in Settings. The app reads every
  CSV file currently sitting in that folder.
- **Watched mode**: the same, except the app watches the folder continuously — as soon
  as you save a new CSV file into it, it's picked up automatically within about half a
  second. No button click needed.

Either way, importing is **safe to repeat**: each transaction is fingerprinted (date +
description + amount + account), so re-importing a CSV you've already ingested — or one
that overlaps with a previous export — skips rows it's already seen instead of
duplicating them.

Every import (successful or failed) is logged under **Settings → Ingestion**, so you can
see what was imported and when, and diagnose a failed import (e.g. wrong column mapping)
without re-running it blind.

### Categorising transactions

New transactions land as **Uncategorised** until a rule matches them, or you categorise
them by hand.

**Rules** live under **Settings → Categorisation Rules**. Each rule has:

- **Pattern** — text to match against the transaction description (e.g. `tesco`).
- **Category** — what to assign when it matches. You can create a new category inline.
- **Match type** — `exact` (the pattern must appear literally in the description) or
  `fuzzy` (typo-tolerant matching, for descriptions with extra reference numbers or
  slightly different spellings). Exact rules always take priority over fuzzy ones.
- **Priority** — when more than one rule could match, the highest priority wins.

You can also **bulk import rules** from a CSV (e.g. a spreadsheet lookup you already
keep), telling the app which columns hold the pattern, category, and (optionally) match
type.

Rules only apply automatically **as transactions are imported**. If you add or change
rules after transactions already exist, click **Recategorise Uncategorised transactions**
to re-run matching against everything still sitting as Uncategorised — it won't touch
transactions you've already categorised (by rule or by hand).

To categorise (or re-categorise) a transaction by hand, go to the **Detail** page and use
the category dropdown directly in the table — changes save immediately.

One category is special: **Transfer**, seeded by default. Mark a category as a transfer
(when creating it) if it represents money moving between your own accounts (e.g. current
→ savings) rather than real income or spending — see [Key concepts](#5-key-concepts)
below for why this matters.

### Detail page

The **Detail** page is a filterable, paginated table of every transaction across every
account — filter by account, date range, or "Uncategorised only", and adjust a
transaction's category directly from the table.

### Accounts page

The **Accounts** page shows, per account, the running balance over time as a line chart,
plus the current balance. Switch between accounts using the buttons at the top.

### Home page

The **Home** page shows money in / money out / net for the current month, plus a
12-month calendar heatmap of daily net cash flow — both **exclude Transfer-categorised
transactions**, but deliberately still include Uncategorised ones (see
[Key concepts](#5-key-concepts)).

---

## 4. Wealth, Investments, Insurance, Contents, Energy

### Investments

Go to the **Investments** page to add holdings (pensions, ISAs, stocks — whatever you
want to track). Each investment can have **multiple valuations over time** — click a
holding to expand its valuation history and add a new one (date + value). The most recent
valuation is what counts toward its current value everywhere else in the app.

The same page also has **retirement projection scenarios**: give a scenario a name,
assumed annual growth rate, monthly contribution, and a retirement date (retirement age
is stored for your reference but isn't used in the calculation — only the date is), and
it projects your **total current investment value** forward using monthly-compounded
growth. Add as many scenarios as you want to compare assumptions side by side.

### Wealth page

The **Wealth** page is a read-only summary (net wealth, liquid vs non-liquid assets,
liabilities) plus the ability to add **Properties** and **Liabilities** — both work the
same way as Investments: add one, then expand it to record valuations over time (a
property's value, a mortgage's outstanding balance, etc).

The net wealth formula:

```
Liquid assets     = all account balances + investments (latest valuation each)
Non-liquid assets = properties (latest valuation each) + contents (total item value)
Net wealth         = liquid + non-liquid − liabilities (latest valuation each)
```

Archived accounts, investments, properties, and liabilities are excluded from these
totals — archiving something (rather than deleting it) keeps its history for reference
without it counting toward current wealth.

### Insurance

The **Insurance** page tracks policies — name, type, provider, coverage amount, premium
and frequency, and renewal date. This is purely informational: insurance plans do **not**
feed into the Wealth totals.

### Contents

The **Contents** page tracks household item values, each tagged with an **Area** (room).
Manage areas (add/delete) at the top of the page, then add items against them. The sum
of every item's value feeds directly into Wealth's non-liquid assets — you'll see the
Wealth page update as soon as you add or remove an item.

You can't delete an area that still has items assigned to it — you'll need to
reassign or delete those items first.

### Energy

The **Energy** page tracks electricity, gas, and water meter readings, each with a value
and unit (kWh, m³, litres). Two ways to add readings:

- **One at a time** via the "Add reading" form.
- **In bulk**, by pasting CSV text with the headers `meterType,readingDate,value,unit,notes`
  into the "Bulk import" box. This is the app's own fixed format (not a bank-style
  configurable mapping), so the headers must match exactly. Re-pasting the same CSV is
  safe — rows matching an existing reading (same meter + date) are skipped rather than
  duplicated.

Once you have at least two readings for a meter, a usage trend chart appears at the top
of the page.

---

## 5. Key concepts

A few rules apply consistently across the app and are worth understanding:

- **Money is always shown in pounds and pence**, but you generally just type whole
  pounds or pounds-and-pence into forms (e.g. `35.50`) — the app handles the conversion.
- **Transfer vs Uncategorised are different things.** Transfer means "money moving
  between my own accounts" and is excluded from money-in/out figures so it doesn't look
  like income or spending. Uncategorised means "hasn't been sorted into a category yet"
  and is deliberately *included* in money-in/out — otherwise your totals would silently
  under-count until you got around to categorising everything.
- **Archiving vs deleting.** Accounts, investments, properties, and liabilities can be
  archived rather than deleted — archived items keep their full history but stop
  counting toward current totals (Wealth, balances, etc). There's no "delete" for these;
  archiving is the intended way to retire something you no longer hold.
- **"Latest valuation" drives current value.** For investments, properties, and
  liabilities, whatever you enter as the most recent valuation (by date) is what's used
  everywhere — Wealth totals, the holding's displayed current value, and projections.
  There's no separate "current value" field to keep in sync by hand.
- **Imports are idempotent.** Re-importing the same transactions CSV or the same energy
  readings CSV will not create duplicates — it's always safe to re-run an import if
  you're unsure whether it went through.

---

## 6. Backing up your data

Everything you enter lives in a single SQLite file at
`packages/backend/data/life-manager.db`. This is the **only** copy of your data — back
it up the same way you'd back up any other important personal file (copy it into your
regular backup routine or a synced folder). See the **Data storage** section of
[README.md](README.md) for how to reset to a clean database if you ever need to start
over.

---

## 7. Troubleshooting

- **A page shows "Failed to load…"** — the backend server probably isn't running, or has
  crashed. Check the terminal running `npm run dev:backend` for an error, restart it if
  needed, then refresh the page.
- **An "Ingest now" click reports an error** — check the account's configured folder
  path exists and its column mapping headers exactly match your CSV's actual column
  names (case-sensitive). The error message names the missing column.
- **A watched folder isn't picking up new files** — confirm the account's ingestion mode
  is set to `watched` (not `manual`) and the folder path is correct; only files saved
  *after* watching starts are picked up automatically. Files already sitting in the
  folder beforehand (e.g. from before you switched the account to watched mode) won't be
  auto-ingested — click **Ingest now** once to pick those up (it works regardless of
  ingestion mode); anything saved into the folder after that is automatic.
- **A transaction stays Uncategorised after adding a matching rule** — rules only apply
  automatically to new imports. Go to Settings → Categorisation Rules and click
  "Recategorise Uncategorised transactions" to apply rules retroactively.
