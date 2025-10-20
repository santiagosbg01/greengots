import { PoolClient } from 'pg';

export abstract class BaseRepository {
  constructor(protected client: PoolClient) {}

  protected async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.client.query(text, params);
    return result.rows;
  }

  protected async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.client.query(text, params);
    return result.rows[0] || null;
  }

  protected async execute(text: string, params?: any[]): Promise<void> {
    await this.client.query(text, params);
  }

  protected buildWhereClause(conditions: Record<string, any>): { where: string; params: any[] } {
    const keys = Object.keys(conditions).filter(key => conditions[key] !== undefined);
    if (keys.length === 0) {
      return { where: '', params: [] };
    }

    const where = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const params = keys.map(key => conditions[key]);

    return { where, params };
  }

  protected buildInsertQuery(table: string, data: Record<string, any>): { text: string; params: any[] } {
    const keys = Object.keys(data);
    const values = keys.map((_, index) => `$${index + 1}`);
    const params = keys.map(key => data[key]);

    const text = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `;

    return { text, params };
  }

  protected buildUpdateQuery(
    table: string, 
    data: Record<string, any>, 
    conditions: Record<string, any>
  ): { text: string; params: any[] } {
    const dataKeys = Object.keys(data);
    const conditionKeys = Object.keys(conditions);
    
    const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const whereClause = conditionKeys.map((key, index) => `${key} = $${dataKeys.length + index + 1}`).join(' AND ');
    
    const params = [
      ...dataKeys.map(key => data[key]),
      ...conditionKeys.map(key => conditions[key])
    ];

    const text = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    return { text, params };
  }
}
