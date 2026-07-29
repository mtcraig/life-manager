import { useState } from 'react';
import type { CreateLiabilityInput, CreatePropertyInput } from '@life-manager/shared';
import { useWealthSummary } from '../../hooks/useWealth.js';
import {
  useArchiveProperty,
  useAddPropertyValuation,
  useCreateProperty,
  useProperties,
  usePropertyValuations,
} from '../../hooks/useProperties.js';
import {
  useArchiveLiability,
  useAddLiabilityValuation,
  useCreateLiability,
  useLiabilities,
  useLiabilityValuations,
} from '../../hooks/useLiabilities.js';
import { ValuationHistoryPanel } from '../../components/ValuationHistoryPanel.js';
import { formatMoney } from '../../lib/formatMoney.js';

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'negative' }) {
  const color = tone === 'negative' ? 'text-red-600' : tone === 'positive' ? 'text-green-700' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{formatMoney(value)}</div>
    </div>
  );
}

function PropertiesSection() {
  const { data: properties, isPending, isError } = useProperties();
  const createProperty = useCreateProperty();
  const archiveProperty = useArchiveProperty();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: valuations, isPending: isValuationsPending } = usePropertyValuations(expandedId);
  const addValuation = useAddPropertyValuation(expandedId ?? -1);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

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
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Properties</h2>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={createProperty.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {createProperty.isPending ? 'Adding…' : 'Add property'}
        </button>
      </form>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load properties.</p>}
      {properties && properties.length === 0 && (
        <p className="text-sm text-slate-500">No properties yet — add one above.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {properties?.map((property) => (
          <li key={property.id} className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpandedId(expandedId === property.id ? null : property.id)}
                className="text-left"
              >
                <span className="font-medium text-slate-900">{property.name}</span>
                {property.address && <span className="ml-2 text-xs text-slate-500">{property.address}</span>}
              </button>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">
                  {property.currentValue !== null ? formatMoney(property.currentValue) : '—'}
                </span>
                <button
                  onClick={() => archiveProperty.mutate(property.id)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Archive
                </button>
              </div>
            </div>
            {expandedId === property.id && (
              <ValuationHistoryPanel
                valuations={valuations}
                isPending={isValuationsPending}
                onAddValuation={(input) => addValuation.mutate(input)}
                isAdding={addValuation.isPending}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LiabilitiesSection() {
  const { data: liabilities, isPending, isError } = useLiabilities();
  const createLiability = useCreateLiability();
  const archiveLiability = useArchiveLiability();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: valuations, isPending: isValuationsPending } = useLiabilityValuations(expandedId);
  const addValuation = useAddLiabilityValuation(expandedId ?? -1);

  const [name, setName] = useState('');
  const [kind, setKind] = useState('');

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

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Liabilities</h2>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Kind
          <input
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="e.g. mortgage, loan"
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={createLiability.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {createLiability.isPending ? 'Adding…' : 'Add liability'}
        </button>
      </form>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load liabilities.</p>}
      {liabilities && liabilities.length === 0 && (
        <p className="text-sm text-slate-500">No liabilities yet — add one above.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {liabilities?.map((liability) => (
          <li key={liability.id} className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpandedId(expandedId === liability.id ? null : liability.id)}
                className="text-left"
              >
                <span className="font-medium text-slate-900">{liability.name}</span>
                {liability.kind && <span className="ml-2 text-xs text-slate-500">{liability.kind}</span>}
              </button>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">
                  {liability.currentValue !== null ? formatMoney(liability.currentValue) : '—'}
                </span>
                <button
                  onClick={() => archiveLiability.mutate(liability.id)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Archive
                </button>
              </div>
            </div>
            {expandedId === liability.id && (
              <ValuationHistoryPanel
                valuations={valuations}
                isPending={isValuationsPending}
                onAddValuation={(input) => addValuation.mutate(input)}
                isAdding={addValuation.isPending}
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
      <h1 className="text-2xl font-semibold text-slate-900">Wealth</h1>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load the wealth summary.</p>}
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryTile label="Net wealth" value={summary.netWealth} tone={summary.netWealth >= 0 ? 'positive' : 'negative'} />
            <SummaryTile label="Liquid assets" value={summary.liquidAssets.total} />
            <SummaryTile label="Non-liquid assets" value={summary.nonLiquidAssets.total} />
            <SummaryTile label="Accounts" value={summary.liquidAssets.accountsTotal} />
            <SummaryTile label="Investments" value={summary.liquidAssets.investmentsTotal} />
            <SummaryTile label="Properties" value={summary.nonLiquidAssets.propertiesTotal} />
            <SummaryTile label="Contents" value={summary.nonLiquidAssets.contentsTotal} />
            <SummaryTile label="Liabilities" value={summary.liabilitiesTotal} tone="negative" />
          </div>
        </>
      )}

      <PropertiesSection />
      <LiabilitiesSection />
    </div>
  );
}
