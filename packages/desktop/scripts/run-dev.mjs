import { spawn } from 'node:child_process';
import { join } from 'node:path';

// Launches the already-packaged --dir build directly, rather than `electron .`
// against source: standalone native-module rebuild commands (electron-rebuild,
// electron-builder install-app-deps) proved unreliable in practice - they can
// silently no-op instead of actually retargeting better-sqlite3 for Electron's
// ABI. electron-builder's own packaging pipeline is the one mechanism that
// reliably rebuilds it correctly, so dev mode goes through that too (via the
// fast --dir target, which skips installer generation).
const exePath = join(process.cwd(), 'release', 'win-unpacked', 'Life Manager.exe');
const child = spawn(exePath, [], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
