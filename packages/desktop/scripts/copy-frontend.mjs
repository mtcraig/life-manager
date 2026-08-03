import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rimrafSync } from 'rimraf';

const here = dirname(fileURLToPath(import.meta.url));
const desktopRoot = join(here, '..');
const frontendDist = join(desktopRoot, '..', 'frontend', 'dist');
const outDir = join(desktopRoot, 'resources', 'frontend');

if (!existsSync(frontendDist)) {
  throw new Error(
    `Frontend build output not found at ${frontendDist} - run "npm run build --workspace=@life-manager/frontend" first.`,
  );
}

rimrafSync(outDir);
mkdirSync(outDir, { recursive: true });
cpSync(frontendDist, outDir, { recursive: true });
