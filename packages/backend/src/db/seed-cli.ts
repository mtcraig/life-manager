import { runMigrations } from './migrate';
import { runSeed } from './seed';

runMigrations();
runSeed();
console.log('Database seeded.');
