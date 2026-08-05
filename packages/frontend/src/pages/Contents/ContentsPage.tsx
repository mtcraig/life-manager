import { useEffect, useState } from 'react';
import type { ContentsItemDto, CreateContentsItemInput, PropertyDto } from '@life-manager/shared';
import { useAreas, useCreateArea, useDeleteArea } from '../../hooks/useAreas.js';
import {
  useBulkImportContentsItems,
  useContentsItems,
  useCreateContentsItem,
  useDeleteContentsItem,
  useUpdateContentsItem,
} from '../../hooks/useContents.js';
import { useProperties } from '../../hooks/useProperties.js';
import { BulkImportCsvForm } from '../../components/BulkImportCsvForm.js';
import { SkeletonRows } from '../../components/Skeleton.js';
import { formatMoney } from '../../lib/formatMoney.js';
import { BTN_PRIMARY, BTN_ROW_ACTION, BTN_ROW_ACTION_DANGER } from '../../theme/tokens.js';

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
  const { data: properties } = useProperties();
  const createItem = useCreateContentsItem();
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [value, setValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Default to the top active property so most users (one property) never have to pick —
  // only sets it while the field is still blank, so it won't clobber a later user change.
  useEffect(() => {
    if (propertyId === '' && properties && properties.length > 0) {
      setPropertyId(String(properties[0]!.id));
    }
  }, [properties, propertyId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: CreateContentsItemInput = {
      name,
      areaId: Number(areaId),
      propertyId: Number(propertyId),
      value: Math.round(Number(value) * 100),
      purchaseDate: purchaseDate || undefined,
      notes: notes.trim() || undefined,
    };
    createItem.mutate(input, {
      onSuccess: () => {
        setName('');
        setAreaId('');
        setPropertyId('');
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
        Property
        <select
          required
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="" disabled>
            Select a property
          </option>
          {properties?.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
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

function EditContentsItemForm({ item, onDone }: { item: ContentsItemDto; onDone: () => void }) {
  const { data: areas } = useAreas();
  const { data: activeProperties } = useProperties();
  const { data: allProperties } = useProperties(true);
  const updateItem = useUpdateContentsItem();
  const [name, setName] = useState(item.name);
  const [areaId, setAreaId] = useState(String(item.areaId));
  const [propertyId, setPropertyId] = useState(item.propertyId !== null ? String(item.propertyId) : '');
  const [value, setValue] = useState((item.value / 100).toString());
  const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  // The item's current property must remain a selectable/valid option even if it's since
  // been archived, so editing other fields never silently forces a valid assignment off.
  const currentProperty = allProperties?.find((property) => property.id === item.propertyId);
  const isCurrentArchived =
    currentProperty !== undefined && !activeProperties?.some((property) => property.id === currentProperty.id);
  const propertyOptions: PropertyDto[] =
    isCurrentArchived && currentProperty ? [...(activeProperties ?? []), currentProperty] : activeProperties ?? [];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    updateItem.mutate(
      {
        id: item.id,
        input: {
          name,
          areaId: Number(areaId),
          propertyId: Number(propertyId),
          value: Math.round(Number(value) * 100),
          purchaseDate: purchaseDate || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => onDone(),
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      },
    );
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
        Property
        <select
          required
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="" disabled>
            Select a property
          </option>
          {propertyOptions.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
              {property.archivedAt ? ' (archived)' : ''}
            </option>
          ))}
        </select>
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
      <div className="flex items-end gap-2">
        <button type="submit" disabled={updateItem.isPending} className={BTN_PRIMARY}>
          {updateItem.isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDone} className={BTN_ROW_ACTION}>
          Cancel
        </button>
      </div>
      {error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

interface AreaGroup {
  areaId: number;
  areaName: string;
  items: ContentsItemDto[];
}

interface PropertyGroup {
  key: string;
  label: string;
  areaGroups: AreaGroup[];
}

function buildGroups(
  filteredItems: ContentsItemDto[],
  propertyById: Map<number, PropertyDto>,
  areaNameById: Map<number, string>,
): PropertyGroup[] {
  const byProperty = new Map<string, ContentsItemDto[]>();
  for (const item of filteredItems) {
    const key = item.propertyId !== null ? String(item.propertyId) : 'unassigned';
    if (!byProperty.has(key)) byProperty.set(key, []);
    byProperty.get(key)!.push(item);
  }

  const groups: PropertyGroup[] = [...byProperty.entries()].map(([key, groupItems]) => {
    const property = key !== 'unassigned' ? propertyById.get(Number(key)) : undefined;
    const label =
      key === 'unassigned'
        ? 'Unassigned'
        : `${property?.name ?? 'Unknown property'}${property?.archivedAt ? ' (archived)' : ''}`;

    const byArea = new Map<number, ContentsItemDto[]>();
    for (const item of groupItems) {
      if (!byArea.has(item.areaId)) byArea.set(item.areaId, []);
      byArea.get(item.areaId)!.push(item);
    }
    const areaGroups = [...byArea.entries()]
      .map(([areaId, areaItems]) => ({
        areaId,
        areaName: areaNameById.get(areaId) ?? 'Unknown area',
        items: areaItems,
      }))
      .sort((a, b) => a.areaName.localeCompare(b.areaName));

    return { key, label, areaGroups };
  });

  groups.sort((a, b) => {
    if (a.key === 'unassigned') return 1;
    if (b.key === 'unassigned') return -1;
    return a.label.localeCompare(b.label);
  });
  return groups;
}

function ContentsItemsList() {
  const { data: areas } = useAreas();
  const { data: allProperties } = useProperties(true);
  const { data: items, isPending, isError } = useContentsItems();
  const deleteItem = useDeleteContentsItem();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const areaNameById = new Map((areas ?? []).map((area) => [area.id, area.name]));
  const propertyById = new Map((allProperties ?? []).map((property) => [property.id, property]));

  if (isPending) return <SkeletonRows rows={4} />;
  if (isError) return <p className="text-sm text-red-600 dark:text-red-400">Failed to load contents items.</p>;
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">No contents items yet — add one above.</p>;
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesArea = areaFilter === '' || item.areaId === Number(areaFilter);
    const matchesProperty =
      propertyFilter === '' ||
      (propertyFilter === 'unassigned' ? item.propertyId === null : item.propertyId === Number(propertyFilter));
    return matchesSearch && matchesArea && matchesProperty;
  });
  const total = filteredItems.reduce((sum, item) => sum + item.value, 0);
  const groups = buildGroups(filteredItems, propertyById, areaNameById);

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
          Property
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All properties</option>
            {allProperties?.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
                {property.archivedAt ? ' (archived)' : ''}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
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
      {groups.length === 0 && <p className="text-sm text-slate-500">No items match these filters.</p>}
      {groups.map((group) => (
        <details key={group.key} open className="mb-2 rounded-md border border-slate-200 dark:border-slate-800">
          <summary className="cursor-pointer select-none bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800/50 dark:text-slate-100">
            {group.label}{' '}
            <span className="font-normal text-slate-500">
              ({group.areaGroups.reduce((n, a) => n + a.items.length, 0)})
            </span>
          </summary>
          <div className="px-3 pb-2">
            {group.areaGroups.map((areaGroup) => (
              <details key={areaGroup.areaId} open className="mb-1 ml-2">
                <summary className="cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-400">
                  {areaGroup.areaName} ({areaGroup.items.length})
                </summary>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {areaGroup.items.map((item) =>
                    editingId === item.id ? (
                      <li key={item.id} className="py-3">
                        <EditContentsItemForm item={item} onDone={() => setEditingId(null)} />
                      </li>
                    ) : (
                      <li key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                          <div className="text-xs text-slate-500">
                            {item.purchaseDate ? `purchased ${item.purchaseDate}` : ''}
                            {item.notes ? ` · ${item.notes}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {formatMoney(item.value)}
                          </span>
                          <button onClick={() => setEditingId(item.id)} className={BTN_ROW_ACTION}>
                            Edit
                          </button>
                          <button onClick={() => deleteItem.mutate(item.id)} className={BTN_ROW_ACTION_DANGER}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </details>
            ))}
          </div>
        </details>
      ))}
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
              headerHint="name,area,property,value,purchaseDate,notes"
              helpText="A room that doesn't already exist is created automatically. A blank or omitted property column defaults to your top active property; an unrecognized property name is rejected."
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
