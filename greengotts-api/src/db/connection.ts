import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.GREENGOTTS_DB_URL;
    if (!dbUrl) {
      throw new Error('GREENGOTTS_DB_URL environment variable is required');
    }

    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigration(migrationFile: string): Promise<void> {
  const client = await getPool().connect();
  
  try {
    const sql = readFileSync(join(__dirname, 'migrations', migrationFile), 'utf8');
    await client.query(sql);
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`Migration ${migrationFile} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function runSeed(seedFile: string): Promise<void> {
  const client = await getPool().connect();
  
  try {
    const sql = readFileSync(join(__dirname, 'seed', seedFile), 'utf8');
    await client.query(sql);
    console.log(`Seed ${seedFile} completed successfully`);
  } catch (error) {
    console.error(`Seed ${seedFile} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
