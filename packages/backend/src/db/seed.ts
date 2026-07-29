import { db } from './client';
import { categories, areas } from './schema/index';

const DEFAULT_CATEGORIES = [
  { name: 'Transfer', isTransfer: true },
  { name: 'Groceries', isTransfer: false },
  { name: 'Utilities', isTransfer: false },
  { name: 'Eating Out', isTransfer: false },
  { name: 'Salary', isTransfer: false },
];

const DEFAULT_AREAS = ['Lounge', 'Kitchen', 'Bedroom', 'Bathroom', 'Garage', 'Office'];

export function runSeed() {
  const now = Date.now();

  for (const category of DEFAULT_CATEGORIES) {
    db.insert(categories)
      .values({ ...category, createdAt: now, updatedAt: now })
      .onConflictDoNothing({ target: categories.name })
      .run();
  }

  for (const name of DEFAULT_AREAS) {
    db.insert(areas)
      .values({ name, createdAt: now })
      .onConflictDoNothing({ target: areas.name })
      .run();
  }
}
