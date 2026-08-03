import { useState } from 'react';
import type { CreateContentsItemInput } from '@life-manager/shared';
import { useAreas, useCreateArea, useDeleteArea } from '../../hooks/useAreas.js';
import {
  useBulkImportContentsItems,
  useContentsItems,
  useCreateContentsItem,
  useDeleteContentsItem,
} from '../../hooks/useContents.js';
import { BulkImportCsvForm } from '../../components/BulkImportCsvForm.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { BTN_PRIMARY, BTN_ROW_ACTION } from '../../theme/tokens.js';

function AreaManager() {
  const { data: areas, isPending, isError } = useAreas();
  const createArea = useCreateArea();
  const deleteArea = useDeleteArea();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createArea.mutate(
      { name },
      {
        onSuccess: () => setName(''),
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      },
    );
  }

  function handleDelete(id: number) {
    deleteArea.mutate(id, {
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <section className="card-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Areas</h2>
      <form onSubmit={handleSubmit} className="mb-3 flex items-end gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          New area name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button type="submit" disabled={createArea.isPending} className={BTN_PRIMARY}>
          {createArea.isPending ? 'Adding…' : 'Add area'}
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {isError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">Failed to load areas.</p>}
      {isPending ? (
        <SkeletonRows rows={2} />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {areas?.map((area) => (
            <li
              key={area.id}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              {area.name}
              <button
                onClick={() => handleDelete(area.id)}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label={`Delete ${area.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddContentsItemForm() {
  const { data: areas } = useAreas();
  const createItem = useCreateContentsItem();
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [value, setValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateContentsItemInput = {
      name,
      areaId: Number(areaId),
      value: Math.round(Number(value) * 100),
      purchaseDate: purchaseDate || undefined,
      notes: notes.trim() || undefined,
    };
    createItem.mutate(input, {
      onSuccess: () => {
        setName('');
        setAreaId('');
        setValue('');
        setPurchaseDate('');
        setNotes('');
      },
      onError: (err) => setError(err instanceof Error ? err.message : String(err)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Area
        <select
          required
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="" disabled>
            Select an area
          </option>
          {areas?.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Value (£)
        <input
          required
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Purchase date (optional)
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
        Notes (optional)
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={createItem.isPending} className={BTN_PRIMARY}>
          {createItem.isPending ? 'Adding…' : 'Add item'}
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function ContentsItemsList() {
  const { data: areas } = useAreas();
  const { data: items, isPending, isError } = useContentsItems();
  const deleteItem = useDeleteContentsItem();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  const areaNameById = new Map((areas ?? []).map((area) => [area.id, area.name]));

  if (isPending) return <SkeletonRows rows={4} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load contents items.</p>;
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">No contents items yet — add one above.</p>;
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesArea = areaFilter === '' || item.areaId === Number(areaFilter);
    return matchesSearch && matchesArea;
  });
  const total = filteredItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Item name"
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Room
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All rooms</option>
            {areas?.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filteredItems.length === 0 && (
        <p className="text-sm text-slate-500">No items match these filters.</p>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
              <div className="text-xs text-slate-500">
                {areaNameById.get(item.areaId) ?? 'Unknown area'}
                {item.purchaseDate ? ` · purchased ${item.purchaseDate}` : ''}
                {item.notes ? ` · ${item.notes}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatMoney(item.value)}</span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
        Total: {formatMoney(total)}
      </p>
    </div>
  );
}

export function ContentsPage() {
  const [showImport, setShowImport] = useState(false);
  const bulkImport = useBulkImportContentsItems();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contents</h1>

      <AreaManager />

      <section className="card-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add item</h2>
        <AddContentsItemForm />
      </section>

      <section className="card-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Items</h2>
          <button onClick={() => setShowImport((v) => !v)} className={BTN_ROW_ACTION}>
            {showImport ? 'Hide import' : 'Import'}
          </button>
        </div>
        {showImport && (
          <div className="mb-4">
            <BulkImportCsvForm
              mutation={bulkImport}
              headerHint="name,area,value,purchaseDate,notes"
              helpText="A room that doesn't already exist is created automatically."
              renderResult={(r) =>
                `Imported ${r.itemsCreated} item${r.itemsCreated === 1 ? '' : 's'}${
                  r.areasCreated > 0 ? `, creating ${r.areasCreated} new ${r.areasCreated === 1 ? 'room' : 'rooms'}` : ''
                }.`
              }
            />
          </div>
        )}
        <ContentsItemsList />
      </section>
    </div>
  );
}
