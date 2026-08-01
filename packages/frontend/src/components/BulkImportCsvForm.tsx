import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { BTN_PRIMARY } from '../theme/tokens.js';

interface BulkImportCsvFormProps<T> {
  mutation: UseMutationResult<T, Error, string>;
  /** e.g. "entityName,asOfDate,value,notes" — shown above the textarea. */
  headerHint: string;
  /** Extra sentence(s) after the header hint, e.g. explaining dedupe/lookup-or-create behavior. */
  helpText: string;
  renderResult: (result: T) => string;
}

/**
 * Shared bulk-paste-CSV form — the same fixed-format pattern Energy's own
 * bulk import uses, reused for "mass import" across Investments/Properties/
 * Liabilities valuation history and Contents items, since all four are a
 * one-shot paste of the app's own domain data rather than a variable-format
 * bank export.
 */
export function BulkImportCsvForm<T>({ mutation, headerHint, helpText, renderResult }: BulkImportCsvFormProps<T>) {
  const [csvContent, setCsvContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResultMessage(null);
    mutation.mutate(csvContent, {
      onSuccess: (res) => {
        setResultMessage(renderResult(res));
        setCsvContent('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-slate-500">
        Paste CSV with headers: <code>{headerHint}</code>. {helpText}
      </p>
      <textarea
        value={csvContent}
        onChange={(e) => setCsvContent(e.target.value)}
        rows={6}
        placeholder={headerHint}
        className="w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={mutation.isPending || csvContent.trim().length === 0}
        className={BTN_PRIMARY}
      >
        {mutation.isPending ? 'Importing…' : 'Import CSV'}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {resultMessage && <p className="text-sm text-slate-600 dark:text-slate-400">{resultMessage}</p>}
    </form>
  );
}
