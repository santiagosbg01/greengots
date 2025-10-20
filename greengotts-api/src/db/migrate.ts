#!/usr/bin/env tsx

import { runMigration } from './connection';

async function main() {
  try {
    console.log('Running database migrations...');
    await runMigration('0001_init.sql');
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
