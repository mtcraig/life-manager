import { AccountsSettings } from './AccountsSettings.js';
import { CategorisationRulesSettings } from './CategorisationRulesSettings.js';
import { IngestionHistorySettings } from './IngestionHistorySettings.js';
import { DatabaseSettings } from './DatabaseSettings.js';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage accounts, categorisation rules, ingestion folders, projection assumptions, and
          database backup/reset here.
        </p>
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Accounts</h2>
        <AccountsSettings />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Categorisation Rules</h2>
        <CategorisationRulesSettings />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Ingestion</h2>
        <IngestionHistorySettings />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Database</h2>
        <DatabaseSettings />
      </div>
    </div>
  );
}
