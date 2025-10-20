import { BaseRepository } from './base';
import { FxRate } from '../types';

export class FxRepository extends BaseRepository {
  async findById(id: string): Promise<FxRate | null> {
    return this.queryOne<FxRate>('SELECT * FROM gg_fx_rate WHERE id = $1', [id]);
  }

  async findByDateAndPair(asOfDate: Date, fromCcy: string, toCcy: string): Promise<FxRate | null> {
    return this.queryOne<FxRate>(
      'SELECT * FROM gg_fx_rate WHERE as_of_date = $1 AND from_ccy = $2 AND to_ccy = $3',
      [asOfDate, fromCcy, toCcy]
    );
  }

  async findLatestRate(fromCcy: string, toCcy: string, asOfDate?: Date): Promise<FxRate | null> {
    let query = `
      SELECT * FROM gg_fx_rate 
      WHERE from_ccy = $1 AND to_ccy = $2
    `;
    const params: any[] = [fromCcy, toCcy];

    if (asOfDate) {
      query += ' AND as_of_date <= $3';
      params.push(asOfDate);
    }

    query += ' ORDER BY as_of_date DESC LIMIT 1';

    return this.queryOne<FxRate>(query, params);
  }

  async create(rate: Omit<FxRate, 'id' | 'created_at'>): Promise<FxRate> {
    const { text, params } = this.buildInsertQuery('gg_fx_rate', {
      ...rate,
      created_at: new Date()
    });
    return this.queryOne<FxRate>(text, params)!;
  }

  async update(id: string, updates: Partial<FxRate>): Promise<FxRate | null> {
    const { text, params } = this.buildUpdateQuery('gg_fx_rate', updates, { id });
    return this.queryOne<FxRate>(text, params);
  }

  async delete(id: string): Promise<void> {
    await this.execute('DELETE FROM gg_fx_rate WHERE id = $1', [id]);
  }

  async listRates(filters?: {
    fromCcy?: string;
    toCcy?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FxRate[]> {
    let query = 'SELECT * FROM gg_fx_rate WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.fromCcy) {
      query += ` AND from_ccy = $${paramIndex}`;
      params.push(filters.fromCcy);
      paramIndex++;
    }

    if (filters?.toCcy) {
      query += ` AND to_ccy = $${paramIndex}`;
      params.push(filters.toCcy);
      paramIndex++;
    }

    if (filters?.startDate) {
      query += ` AND as_of_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      query += ` AND as_of_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ' ORDER BY as_of_date DESC, from_ccy, to_ccy';

    return this.query<FxRate>(query, params);
  }

  async getCurrencyPairs(): Promise<{ from_ccy: string; to_ccy: string }[]> {
    return this.query<{ from_ccy: string; to_ccy: string }>(`
      SELECT DISTINCT from_ccy, to_ccy 
      FROM gg_fx_rate 
      ORDER BY from_ccy, to_ccy
    `);
  }
}
