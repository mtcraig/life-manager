import { useState } from 'react';
import { MATCH_TYPES } from '@life-manager/shared';
import type { CategorisationRuleDto, CreateCategorisationRuleInput } from '@life-manager/shared';
import { useCategories, useCreateCategory } from '../../hooks/useCategories.js';
import {
  useBulkImportCategorisationRules,
  useCategorisationRules,
  useCreateCategorisationRule,
  useDeleteCategorisationRule,
  useRecategoriseUncategorised,
} from '../../hooks/useCategorisationRules.js';

const NEW_CATEGORY_VALUE = '__new__';

export function CategorisationRulesSettings() {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const { data: rules, isPending, isError } = useCategorisationRules();
  const createRule = useCreateCategorisationRule();
  const deleteRule = useDeleteCategorisationRule();
  const bulkImport = useBulkImportCategorisationRules();
  const recategorise = useRecategoriseUncategorised();

  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [matchType, setMatchType] = useState<CreateCategorisationRuleInput['matchType']>('fuzzy');
  const [priority, setPriority] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [csvContent, setCsvContent] = useState('');
  const [patternColumn, setPatternColumn] = useState('Pattern');
  const [categoryColumn, setCategoryColumn] = useState('Category');
  const [matchTypeColumn, setMatchTypeColumn] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [recategoriseMessage, setRecategoriseMessage] = useState<string | null>(null);

  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    let resolvedCategoryId: number;
    if (categoryId === NEW_CATEGORY_VALUE) {
      if (!newCategoryName.trim()) {
        setFormError('Enter a name for the new category.');
        return;
      }
      try {
        const category = await createCategory.mutateAsync({
          name: newCategoryName.trim(),
          isTransfer: false,
        });
        resolvedCategoryId = category.id;
      } catch (error) {
        setFormError(error instanceof Error ? error.message : String(error));
        return;
      }
    } else if (categoryId) {
      resolvedCategoryId = Number(categoryId);
    } else {
      setFormError('Choose a category.');
      return;
    }

    createRule.mutate(
      { pattern, categoryId: resolvedCategoryId, matchType, priority },
      {
        onSuccess: () => {
          setPattern('');
          setCategoryId('');
          setNewCategoryName('');
          setMatchType('fuzzy');
          setPriority(0);
        },
        onError: (error) => setFormError(error instanceof Error ? error.message : String(error)),
      },
    );
  }

  function handleBulkImport(event: React.FormEvent) {
    event.preventDefault();
    setImportMessage(null);
    bulkImport.mutate(
      {
        csvContent,
        columnMapping: {
          pattern: patternColumn,
          category: categoryColumn,
          matchType: matchTypeColumn || undefined,
        },
      },
      {
        onSuccess: (result) => {
          setImportMessage(
            `Imported ${result.rulesCreated} rule(s), created ${result.categoriesCreated} new category(ies).`,
          );
          setCsvContent('');
        },
        onError: (error) => setImportMessage(error instanceof Error ? error.message : String(error)),
      },
    );
  }

  function handleRecategorise() {
    setRecategoriseMessage(null);
    recategorise.mutate(undefined, {
      onSuccess: (result) => setRecategoriseMessage(`Categorised ${result.updated} transaction(s).`),
      onError: (error) => setRecategoriseMessage(error instanceof Error ? error.message : String(error)),
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Add categorisation rule</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Pattern
              <input
                required
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. tesco"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">Select a category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
              </select>
            </label>
            {categoryId === NEW_CATEGORY_VALUE && (
              <label className="text-sm text-slate-700">
                New category name
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </label>
            )}
            <label className="text-sm text-slate-700">
              Match type
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as CreateCategorisationRuleInput['matchType'])}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {MATCH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Priority (higher wins ties)
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={createRule.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {createRule.isPending ? 'Adding…' : 'Add rule'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Bulk import from spreadsheet CSV</h2>
        <form onSubmit={handleBulkImport} className="space-y-3">
          <label className="block text-sm text-slate-700">
            CSV content
            <textarea
              required
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              placeholder="Pattern,Category&#10;tesco,Groceries&#10;..."
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm text-slate-700">
              Pattern column header
              <input
                value={patternColumn}
                onChange={(e) => setPatternColumn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Category column header
              <input
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Match type column header (optional)
              <input
                value={matchTypeColumn}
                onChange={(e) => setMatchTypeColumn(e.target.value)}
                placeholder="defaults to fuzzy"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          {importMessage && <p className="text-sm text-slate-600">{importMessage}</p>}
          <button
            type="submit"
            disabled={bulkImport.isPending}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {bulkImport.isPending ? 'Importing…' : 'Import rules'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Rules</h2>
          <button
            onClick={handleRecategorise}
            disabled={recategorise.isPending}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {recategorise.isPending ? 'Recategorising…' : 'Recategorise Uncategorised transactions'}
          </button>
        </div>
        {recategoriseMessage && <p className="mb-2 text-sm text-slate-600">{recategoriseMessage}</p>}
        {isPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to load categorisation rules.</p>}
        <ul className="divide-y divide-slate-100">
          {rules?.map((rule: CategorisationRuleDto) => (
            <li key={rule.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-slate-900">{rule.pattern}</span>
                <span className="ml-2 text-xs text-slate-500">
                  → {categoryNameById.get(rule.categoryId) ?? rule.categoryId} · {rule.matchType} · priority{' '}
                  {rule.priority} · {rule.source}
                </span>
              </div>
              <button
                onClick={() => deleteRule.mutate(rule.id)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Delete
              </button>
            </li>
          ))}
          {rules?.length === 0 && <li className="py-2 text-sm text-slate-500">No rules yet.</li>}
        </ul>
      </section>
    </div>
  );
}
