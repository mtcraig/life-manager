import { useState } from 'react';
import type { CreateLiabilityInput, CreatePropertyInput } from '@life-manager/shared';
import { useWealthSummary } from '../../hooks/useWealth.js';
import {
  useArchiveProperty,
  useAddPropertyValuation,
  useBulkImportPropertyValuations,
  useCreateProperty,
  useDeleteProperty,
  useDeletePropertyValuation,
  useProperties,
  usePropertyValuations,
  useUpdateProperty,
  useUpdatePropertyValuation,
} from '../../hooks/useProperties.js';
import {
  useArchiveLiability,
  useAddLiabilityValuation,
  useBulkImportLiabilityValuations,
  useCreateLiability,
  useDeleteLiability,
  useDeleteLiabilityValuation,
  useLiabilities,
  useLiabilityValuations,
  useUnarchiveLiability,
  useUpdateLiability,
  useUpdateLiabilityValuation,
} from '../../hooks/useLiabilities.js';
import { ValuationHistoryPanel } from '../../components/ValuationHistoryPanel.js';
import { BulkImportCsvForm } from '../../components/BulkImportCsvForm.js';
import { PropertyMap } from '../../components/PropertyMap.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { renderValuationImportResult } from '../../lib/bulkImportMessages.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'positive' | 'negative' | 'asset';
}) {
  const color =
    tone === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'positive'
        ? 'text-green-700 dark:text-green-400'
        : tone === 'asset'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-slate-900 dark:text-slate-100';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{formatMoney(value)}</div>
    </div>
  );
}

function PropertiesSection() {
  const { data: properties, isPending, isError } = useProperties();
  const createProperty = useCreateProperty();
  const archiveProperty = useArchiveProperty();
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();
  const bulkImportValuations = useBulkImportPropertyValuations();
  const [showImport, setShowImport] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const { data: valuations, isPending: isValuationsPending } = usePropertyValuations(expandedId);
  const addValuation = useAddPropertyValuation(expandedId ?? -1);
  const updateValuation = useUpdatePropertyValuation(expandedId ?? -1);
  const deleteValuation = useDeletePropertyValuation(expandedId ?? -1);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rowError, setRowError] = useState<string | null>(null);

  function startEditing(property: { id: number; name: string; address: string | null }) {
    setEditingId(property.id);
    setEditName(property.name);
    setEditAddress(property.address ?? '');
  }

  function handleArchive(propertyId: number) {
    setRowError(null);
    archiveProperty.mutate(propertyId, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleDelete(property: { id: number; name: string }) {
    const confirmed = window.confirm(
      `Permanently delete "${property.name}" and all its valuations? This cannot be undone.`,
    );
    if (!confirmed) return;
    setRowError(null);
    deleteProperty.mutate(property.id, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleEditSubmit(event: React.FormEvent, propertyId: number) {
    event.preventDefault();
    updateProperty.mutate(
      { id: propertyId, input: { name: editName, address: editAddress.trim() || undefined } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input: CreatePropertyInput = { name, address: address.trim() || undefined };
    createProperty.mutate(input, {
      onSuccess: () => {
        setName('');
        setAddress('');
      },
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Properties</h2>
        <button onClick={() => setShowImport((v) => !v)} className={BTN_ROW_ACTION}>
          {showImport ? 'Hide import' : 'Import'}
        </button>
      </div>
      {showImport && (
        <div className="mb-4">
          <BulkImportCsvForm
            mutation={bulkImportValuations}
            headerHint="entityName,asOfDate,value,notes"
            helpText="A name that doesn't already exist is created automatically. Rows matching an existing valuation (same name + date) are skipped, so it's safe to re-paste."
            renderResult={renderValuationImportResult}
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button type="submit" disabled={createProperty.isPending} className={BTN_PRIMARY}>
          {createProperty.isPending ? 'Adding…' : 'Add property'}
        </button>
      </form>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load properties.</p>}
      {rowError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{rowError}</p>}
      {properties && properties.length === 0 && (
        <p className="text-sm text-slate-500">No properties yet — add one above.</p>
      )}
      {properties && properties.length > 0 && (
        <div className="mb-4">
          <PropertyMap properties={properties} />
        </div>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {properties?.map((property) => (
          <li key={property.id} className="py-3">
            {editingId === property.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, property.id)} className="flex flex-wrap items-end gap-3">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Name
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Address
                  <input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <button type="submit" disabled={updateProperty.isPending} className={BTN_PRIMARY}>
                  {updateProperty.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={BTN_ROW_ACTION}>
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(expandedId === property.id ? null : property.id)}
                  className="text-left"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{property.name}</span>
                  {property.address && <span className="ml-2 text-xs text-slate-500">{property.address}</span>}
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {property.currentValue !== null ? formatMoney(property.currentValue) : '—'}
                  </span>
                  <button onClick={() => startEditing(property)} className={BTN_ROW_ACTION}>
                    Edit
                  </button>
                  <button onClick={() => handleArchive(property.id)} className={BTN_ROW_ACTION}>
                    Archive
                  </button>
                  <button onClick={() => handleDelete(property)} className={BTN_ROW_ACTION}>
                    Delete
                  </button>
                </div>
              </div>
            )}
            {expandedId === property.id && editingId !== property.id && (
              <ValuationHistoryPanel
                valuations={valuations}
                isPending={isValuationsPending}
                onAddValuation={(input) => addValuation.mutate(input)}
                isAdding={addValuation.isPending}
                onUpdateValuation={(valuationId, input) => updateValuation.mutate({ valuationId, input })}
                onDeleteValuation={(valuationId) => deleteValuation.mutate(valuationId)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LiabilitiesSection() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: liabilities, isPending, isError } = useLiabilities(showArchived);
  const createLiability = useCreateLiability();
  const archiveLiability = useArchiveLiability();
  const unarchiveLiability = useUnarchiveLiability();
  const deleteLiability = useDeleteLiability();
  const updateLiability = useUpdateLiability();
  const bulkImportValuations = useBulkImportLiabilityValuations();
  const [showImport, setShowImport] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editKind, setEditKind] = useState('');
  const [rowError, setRowError] = useState<string | null>(null);
  const { data: valuations, isPending: isValuationsPending } = useLiabilityValuations(expandedId);
  const addValuation = useAddLiabilityValuation(expandedId ?? -1);
  const updateValuation = useUpdateLiabilityValuation(expandedId ?? -1);
  const deleteValuation = useDeleteLiabilityValuation(expandedId ?? -1);

  const [name, setName] = useState('');
  const [kind, setKind] = useState('');

  function startEditing(liability: { id: number; name: string; kind: string | null }) {
    setEditingId(liability.id);
    setEditName(liability.name);
    setEditKind(liability.kind ?? '');
  }

  function handleEditSubmit(event: React.FormEvent, liabilityId: number) {
    event.preventDefault();
    updateLiability.mutate(
      { id: liabilityId, input: { name: editName, kind: editKind.trim() || undefined } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input: CreateLiabilityInput = { name, kind: kind.trim() || undefined };
    createLiability.mutate(input, {
      onSuccess: () => {
        setName('');
        setKind('');
      },
    });
  }

  function handleArchive(liabilityId: number) {
    setRowError(null);
    archiveLiability.mutate(liabilityId, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleUnarchive(liabilityId: number) {
    setRowError(null);
    unarchiveLiability.mutate(liabilityId, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  function handleDelete(liability: { id: number; name: string }) {
    const confirmed = window.confirm(
      `Permanently delete "${liability.name}" and all its valuations? This cannot be undone.`,
    );
    if (!confirmed) return;
    setRowError(null);
    deleteLiability.mutate(liability.id, {
      onError: (error) => setRowError(error instanceof Error ? error.message : String(error)),
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Liabilities</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button onClick={() => setShowImport((v) => !v)} className={BTN_ROW_ACTION}>
            {showImport ? 'Hide import' : 'Import'}
          </button>
        </div>
      </div>
      {showImport && (
        <div className="mb-4">
          <BulkImportCsvForm
            mutation={bulkImportValuations}
            headerHint="entityName,asOfDate,value,notes"
            helpText="A name that doesn't already exist is created automatically. Rows matching an existing valuation (same name + date) are skipped, so it's safe to re-paste."
            renderResult={renderValuationImportResult}
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Kind
          <input
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="e.g. mortgage, loan"
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button type="submit" disabled={createLiability.isPending} className={BTN_PRIMARY}>
          {createLiability.isPending ? 'Adding…' : 'Add liability'}
        </button>
      </form>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load liabilities.</p>}
      {rowError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{rowError}</p>}
      {liabilities && liabilities.length === 0 && (
        <p className="text-sm text-slate-500">No liabilities yet — add one above.</p>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {liabilities?.map((liability) => (
          <li key={liability.id} className="py-3">
            {editingId === liability.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, liability.id)} className="flex flex-wrap items-end gap-3">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Name
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Kind
                  <input
                    value={editKind}
                    onChange={(e) => setEditKind(e.target.value)}
                    placeholder="e.g. mortgage, loan"
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <button type="submit" disabled={updateLiability.isPending} className={BTN_PRIMARY}>
                  {updateLiability.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={BTN_ROW_ACTION}>
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(expandedId === liability.id ? null : liability.id)}
                  className="text-left"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{liability.name}</span>
                  {liability.kind && <span className="ml-2 text-xs text-slate-500">{liability.kind}</span>}
                </button>
                <div className="flex items-center gap-3">
                  {liability.archivedAt && (
                    <span className="text-xs text-slate-500">Archived</span>
                  )}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {liability.currentValue !== null ? formatMoney(liability.currentValue) : '—'}
                  </span>
                  <button onClick={() => startEditing(liability)} className={BTN_ROW_ACTION}>
                    Edit
                  </button>
                  {liability.archivedAt ? (
                    <button onClick={() => handleUnarchive(liability.id)} className={BTN_ROW_ACTION}>
                      Unarchive
                    </button>
                  ) : (
                    <button onClick={() => handleArchive(liability.id)} className={BTN_ROW_ACTION}>
                      Archive
                    </button>
                  )}
                  <button onClick={() => handleDelete(liability)} className={BTN_ROW_ACTION}>
                    Delete
                  </button>
                </div>
              </div>
            )}
            {expandedId === liability.id && editingId !== liability.id && (
              <ValuationHistoryPanel
                valuations={valuations}
                isPending={isValuationsPending}
                onAddValuation={(input) => addValuation.mutate(input)}
                isAdding={addValuation.isPending}
                onUpdateValuation={(valuationId, input) => updateValuation.mutate({ valuationId, input })}
                onDeleteValuation={(valuationId) => deleteValuation.mutate(valuationId)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WealthPage() {
  const { data: summary, isPending, isError } = useWealthSummary();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Wealth</h1>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to load the wealth summary.</p>}
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Net wealth" value={summary.netWealth} tone={summary.netWealth >= 0 ? 'positive' : 'negative'} />
            <SummaryTile label="Liquid assets" value={summary.liquidAssets.total} tone="asset" />
            <SummaryTile label="Non-liquid assets" value={summary.nonLiquidAssets.total} tone="asset" />
            <SummaryTile label="Liabilities" value={summary.liabilitiesTotal} tone="negative" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Accounts" value={summary.liquidAssets.accountsTotal} />
            <SummaryTile label="Investments" value={summary.liquidAssets.investmentsTotal} />
            <SummaryTile label="Properties" value={summary.nonLiquidAssets.propertiesTotal} />
            <SummaryTile label="Contents" value={summary.nonLiquidAssets.contentsTotal} />
          </div>
        </div>
      )}

      <PropertiesSection />
      <LiabilitiesSection />
    </div>
  );
}
