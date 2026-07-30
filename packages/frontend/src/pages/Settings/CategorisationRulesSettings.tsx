import { useState } from 'react';
import { MATCH_TYPES } from '@life-manager/shared';
import type { CategorisationRuleDto, CreateCategorisationRuleInput } from '@life-manager/shared';
import { PagedListFooter } from '../../components/PagedListFooter.js';
import { useCategories, useCreateCategory } from '../../hooks/useCategories.js';
import { useCreateVendor, useVendors } from '../../hooks/useVendors.js';
import { usePagedList } from '../../hooks/usePagedList.js';
import {
  useBulkImportCategorisationRules,
  useCategorisationRules,
  useCreateCategorisationRule,
  useDeleteCategorisationRule,
  useRecategoriseUncategorised,
  useUpdateCategorisationRule,
} from '../../hooks/useCategorisationRules.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

const NEW_CATEGORY_VALUE = '__new__';
const NEW_VENDOR_VALUE = '__new__';

export function CategorisationRulesSettings() {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const { data: vendors } = useVendors();
  const createVendor = useCreateVendor();
  const { data: rules, isPending, isError } = useCategorisationRules();
  const createRule = useCreateCategorisationRule();
  const updateRule = useUpdateCategorisationRule();
  const deleteRule = useDeleteCategorisationRule();
  const bulkImport = useBulkImportCategorisationRules();
  const recategorise = useRecategoriseUncategorised();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPattern, setEditPattern] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editNewCategoryName, setEditNewCategoryName] = useState('');
  const [editVendorId, setEditVendorId] = useState('');
  const [editNewVendorName, setEditNewVendorName] = useState('');
  const [editMatchType, setEditMatchType] = useState<CreateCategorisationRuleInput['matchType']>('fuzzy');
  const [editPriority, setEditPriority] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);

  function startEditing(rule: CategorisationRuleDto) {
    setEditingId(rule.id);
    setEditPattern(rule.pattern);
    setEditCategoryId(String(rule.categoryId));
    setEditNewCategoryName('');
    setEditVendorId(String(rule.vendorId));
    setEditNewVendorName('');
    setEditMatchType(rule.matchType);
    setEditPriority(rule.priority);
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent, ruleId: number) {
    event.preventDefault();
    setEditError(null);

    let resolvedCategoryId: number;
    if (editCategoryId === NEW_CATEGORY_VALUE) {
      if (!editNewCategoryName.trim()) {
        setEditError('Enter a name for the new category.');
        return;
      }
      try {
        const category = await createCategory.mutateAsync({
          name: editNewCategoryName.trim(),
          isTransfer: false,
        });
        resolvedCategoryId = category.id;
      } catch (error) {
        setEditError(error instanceof Error ? error.message : String(error));
        return;
      }
    } else {
      resolvedCategoryId = Number(editCategoryId);
    }

    let resolvedVendorId: number;
    if (editVendorId === NEW_VENDOR_VALUE) {
      if (!editNewVendorName.trim()) {
        setEditError('Enter a name for the new vendor.');
        return;
      }
      try {
        const vendor = await createVendor.mutateAsync({ name: editNewVendorName.trim() });
        resolvedVendorId = vendor.id;
      } catch (error) {
        setEditError(error instanceof Error ? error.message : String(error));
        return;
      }
    } else if (editVendorId) {
      resolvedVendorId = Number(editVendorId);
    } else {
      setEditError('Choose a vendor.');
      return;
    }

    updateRule.mutate(
      {
        id: ruleId,
        input: {
          pattern: editPattern,
          categoryId: resolvedCategoryId,
          vendorId: resolvedVendorId,
          matchType: editMatchType,
          priority: editPriority,
        },
      },
      {
        onSuccess: () => setEditingId(null),
        onError: (error) => setEditError(error instanceof Error ? error.message : String(error)),
      },
    );
  }

  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [matchType, setMatchType] = useState<CreateCategorisationRuleInput['matchType']>('fuzzy');
  const [priority, setPriority] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [csvContent, setCsvContent] = useState('');
  const [patternColumn, setPatternColumn] = useState('Pattern');
  const [categoryColumn, setCategoryColumn] = useState('Category');
  const [vendorColumn, setVendorColumn] = useState('Vendor');
  const [matchTypeColumn, setMatchTypeColumn] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [recategoriseMessage, setRecategoriseMessage] = useState<string | null>(null);

  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]));
  const vendorNameById = new Map(vendors?.map((v) => [v.id, v.name]));
  const pagedRules = usePagedList(rules);

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

    let resolvedVendorId: number;
    if (vendorId === NEW_VENDOR_VALUE) {
      if (!newVendorName.trim()) {
        setFormError('Enter a name for the new vendor.');
        return;
      }
      try {
        const vendor = await createVendor.mutateAsync({ name: newVendorName.trim() });
        resolvedVendorId = vendor.id;
      } catch (error) {
        setFormError(error instanceof Error ? error.message : String(error));
        return;
      }
    } else if (vendorId) {
      resolvedVendorId = Number(vendorId);
    } else {
      setFormError('Choose a vendor.');
      return;
    }

    createRule.mutate(
      { pattern, categoryId: resolvedCategoryId, vendorId: resolvedVendorId, matchType, priority },
      {
        onSuccess: () => {
          setPattern('');
          setCategoryId('');
          setNewCategoryName('');
          setVendorId('');
          setNewVendorName('');
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
          vendor: vendorColumn,
          matchType: matchTypeColumn || undefined,
        },
      },
      {
        onSuccess: (result) => {
          setImportMessage(
            `Imported ${result.rulesCreated} rule(s), created ${result.categoriesCreated} new category(ies) ` +
              `and ${result.vendorsCreated} new vendor(s).`,
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
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add categorisation rule</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Pattern
              <input
                required
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. tesco"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              <label className="text-sm text-slate-700 dark:text-slate-300">
                New category name
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            )}
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Vendor
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Select a vendor</option>
                {vendors?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
                <option value={NEW_VENDOR_VALUE}>+ New vendor…</option>
              </select>
            </label>
            {vendorId === NEW_VENDOR_VALUE && (
              <label className="text-sm text-slate-700 dark:text-slate-300">
                New vendor name
                <input
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            )}
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Match type
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as CreateCategorisationRuleInput['matchType'])}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {MATCH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Priority (higher wins ties)
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

          <button type="submit" disabled={createRule.isPending} className={BTN_PRIMARY}>
            {createRule.isPending ? 'Adding…' : 'Add rule'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Bulk import from spreadsheet CSV
        </h2>
        <form onSubmit={handleBulkImport} className="space-y-3">
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            CSV content
            <textarea
              required
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              placeholder="Pattern,Category,Vendor&#10;tesco,Groceries,Tesco&#10;..."
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Pattern column header
              <input
                value={patternColumn}
                onChange={(e) => setPatternColumn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Category column header
              <input
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Vendor column header
              <input
                value={vendorColumn}
                onChange={(e) => setVendorColumn(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Match type column header (optional)
              <input
                value={matchTypeColumn}
                onChange={(e) => setMatchTypeColumn(e.target.value)}
                placeholder="defaults to fuzzy"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
          {importMessage && <p className="text-sm text-slate-600 dark:text-slate-400">{importMessage}</p>}
          <button
            type="submit"
            disabled={bulkImport.isPending}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {bulkImport.isPending ? 'Importing…' : 'Import rules'}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rules</h2>
          <button
            onClick={handleRecategorise}
            disabled={recategorise.isPending}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {recategorise.isPending ? 'Recategorising…' : 'Recategorise Uncategorised transactions'}
          </button>
        </div>
        {recategoriseMessage && (
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">{recategoriseMessage}</p>
        )}
        {isPending && <p className="text-sm text-slate-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load categorisation rules.</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {pagedRules.visible.map((rule: CategorisationRuleDto) =>
            editingId === rule.id ? (
              <li key={rule.id} className="py-2">
                <form onSubmit={(e) => handleEditSubmit(e, rule.id)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Pattern
                      <input
                        required
                        value={editPattern}
                        onChange={(e) => setEditPattern(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Category
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
                      </select>
                    </label>
                    {editCategoryId === NEW_CATEGORY_VALUE && (
                      <label className="text-sm text-slate-700 dark:text-slate-300">
                        New category name
                        <input
                          value={editNewCategoryName}
                          onChange={(e) => setEditNewCategoryName(e.target.value)}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </label>
                    )}
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Vendor
                      <select
                        value={editVendorId}
                        onChange={(e) => setEditVendorId(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Select a vendor</option>
                        {vendors?.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                        <option value={NEW_VENDOR_VALUE}>+ New vendor…</option>
                      </select>
                    </label>
                    {editVendorId === NEW_VENDOR_VALUE && (
                      <label className="text-sm text-slate-700 dark:text-slate-300">
                        New vendor name
                        <input
                          value={editNewVendorName}
                          onChange={(e) => setEditNewVendorName(e.target.value)}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </label>
                    )}
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Match type
                      <select
                        value={editMatchType}
                        onChange={(e) =>
                          setEditMatchType(e.target.value as CreateCategorisationRuleInput['matchType'])
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {MATCH_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Priority (higher wins ties)
                      <input
                        type="number"
                        value={editPriority}
                        onChange={(e) => setEditPriority(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </label>
                  </div>
                  {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={updateRule.isPending} className={BTN_PRIMARY}>
                      {updateRule.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className={BTN_ROW_ACTION}>
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={rule.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{rule.pattern}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    → {categoryNameById.get(rule.categoryId) ?? rule.categoryId} ·{' '}
                    {vendorNameById.get(rule.vendorId) ?? rule.vendorId} ·{' '}
                    {rule.matchType} · priority {rule.priority} · {rule.source}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEditing(rule)} className={BTN_ROW_ACTION}>
                    Edit
                  </button>
                  <button onClick={() => deleteRule.mutate(rule.id)} className={BTN_ROW_ACTION}>
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
          {rules?.length === 0 && <li className="py-2 text-sm text-slate-500">No rules yet.</li>}
        </ul>
        <PagedListFooter state={pagedRules} />
      </section>
    </div>
  );
}
