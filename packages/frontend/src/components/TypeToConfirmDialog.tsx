import { useState } from 'react';

interface TypeToConfirmDialogProps {
  message: string;
  confirmWord: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * An in-page "type X to confirm" modal, used instead of window.prompt() for
 * destructive actions - Electron doesn't implement window.prompt() (it
 * returns null with no dialog shown at all), so this needs to work without
 * relying on any native browser dialog API.
 */
export function TypeToConfirmDialog({
  message,
  confirmWord,
  confirmLabel,
  onConfirm,
  onCancel,
}: TypeToConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-surface w-full max-w-md p-5">
        <p className="mb-4 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{message}</p>
        <input
          autoFocus
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={`Type ${confirmWord} to confirm`}
          className="mb-4 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== confirmWord}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
