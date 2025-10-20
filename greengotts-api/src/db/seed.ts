#!/usr/bin/env tsx

import { runSeed } from './connection';

async function main() {
  try {
    console.log('Running database seed...');
    await runSeed('seed.sql');
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
