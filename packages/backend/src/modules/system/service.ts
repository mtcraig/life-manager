import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Set by start.bat before launching this process; points at the directory
// holding backend.pid/frontend.pid written by scripts/start-server.ps1.
const RUN_DIR = process.env.LIFE_MANAGER_RUN_DIR;

function killByPidFile(fileName: string): void {
  if (!RUN_DIR) return;
  let pid: string;
  try {
    pid = readFileSync(path.join(RUN_DIR, fileName), 'utf8').trim();
  } catch {
    return;
  }
  if (pid) exec(`taskkill /F /T /PID ${pid}`);
}

/**
 * Kills both server console windows (and their whole process tree) by PID,
 * via the files start.bat's launcher script writes. First delay lets the
 * HTTP response flush before anything is torn down. Frontend is killed
 * first, backend (self) last, since nothing after the self-kill runs - but
 * the two kills can't fire back-to-back: the backend kill targets this
 * process's own ancestor tree, which also contains the still-running
 * `taskkill` child process spawned for the frontend, so an immediate
 * self-kill can reap it mid-flight before it reaches the frontend. The
 * second delay gives that child time to finish first. Outside of start.bat
 * (no LIFE_MANAGER_RUN_DIR), there's nothing to taskkill, so just exit.
 */
export function shutdown(): void {
  setTimeout(() => {
    killByPidFile('frontend.pid');
    setTimeout(() => {
      killByPidFile('backend.pid');
      if (!RUN_DIR) process.exit(0);
    }, 500);
  }, 300);
}
