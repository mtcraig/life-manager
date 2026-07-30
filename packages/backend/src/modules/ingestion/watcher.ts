import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import * as accountsRepo from '../accounts/repo';
import { ingestAccountFolder } from './ingestService';

/** Multiple files landing in the same folder at once should only trigger one ingest pass. */
const DEBOUNCE_MS = 500;

interface WatcherEntry {
  watcher: FSWatcher;
  folderPath: string;
}

const activeWatchers = new Map<number, WatcherEntry>();
const debounceTimers = new Map<number, NodeJS.Timeout>();

function scheduleIngest(accountId: number) {
  const existingTimer = debounceTimers.get(accountId);
  if (existingTimer) clearTimeout(existingTimer);

  debounceTimers.set(
    accountId,
    setTimeout(() => {
      debounceTimers.delete(accountId);
      try {
        ingestAccountFolder(accountId, 'watch');
      } catch (error) {
        // ingestAccountFolder already logs per-file failures to ingestion_events;
        // reaching here means the account/folder itself is misconfigured.
        console.error(`Watched ingestion failed for account ${accountId}:`, error);
      }
    }, DEBOUNCE_MS),
  );
}

function startWatcher(accountId: number, folderPath: string) {
  const watcher = chokidar.watch(folderPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });
  watcher.on('add', (filePath) => {
    if (filePath.toLowerCase().endsWith('.csv')) {
      scheduleIngest(accountId);
    }
  });
  activeWatchers.set(accountId, { watcher, folderPath });
}

function stopWatcher(accountId: number) {
  const entry = activeWatchers.get(accountId);
  if (entry) {
    entry.watcher.close();
    activeWatchers.delete(accountId);
  }
  const timer = debounceTimers.get(accountId);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(accountId);
  }
}

/**
 * Rebuilds the active watcher set from current account configuration. Called
 * at boot and after any account change that could affect watched folders, so
 * Settings changes (switching ingestion mode, editing the folder path,
 * archiving an account) take effect immediately without a server restart.
 */
export function syncWatchers() {
  const accounts = accountsRepo.listAccounts();
  const shouldWatch = new Map(
    accounts
      .filter((account) => account.ingestionMode === 'watched' && account.folderPath)
      .map((account) => [account.id, account.folderPath as string]),
  );

  for (const [accountId, entry] of activeWatchers) {
    const desiredFolder = shouldWatch.get(accountId);
    if (desiredFolder === undefined || desiredFolder !== entry.folderPath) {
      stopWatcher(accountId);
    }
  }

  for (const [accountId, folderPath] of shouldWatch) {
    if (!activeWatchers.has(accountId)) {
      startWatcher(accountId, folderPath);
    }
  }
}

export function stopAllWatchers() {
  for (const accountId of [...activeWatchers.keys()]) {
    stopWatcher(accountId);
  }
}
