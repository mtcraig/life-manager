import { AccountsSettings } from './AccountsSettings.js';
import { CategorisationRulesSettings } from './CategorisationRulesSettings.js';
import { IngestionHistorySettings } from './IngestionHistorySettings.js';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-600">
          Manage accounts, categorisation rules, ingestion folders, and projection assumptions here.
        </p>
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Accounts</h2>
        <AccountsSettings />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Categorisation Rules</h2>
        <CategorisationRulesSettings />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Ingestion</h2>
        <IngestionHistorySettings />
      </div>
    </div>
  );
}
