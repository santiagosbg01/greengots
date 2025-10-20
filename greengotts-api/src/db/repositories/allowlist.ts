import { BaseRepository } from './base';
import { AccessAllowlist } from '../types';

export class AccessAllowlistRepository extends BaseRepository {
  async findByEmail(email: string): Promise<AccessAllowlist | null> {
    return this.queryOne<AccessAllowlist>('SELECT * FROM gg_access_allowlist WHERE email = $1', [email]);
  }

  async create(allowlist: Omit<AccessAllowlist, 'invited_at'>): Promise<AccessAllowlist> {
    const { text, params } = this.buildInsertQuery('gg_access_allowlist', {
      ...allowlist,
      invited_at: new Date()
    });
    return this.queryOne<AccessAllowlist>(text, params)!;
  }

  async update(email: string, updates: Partial<AccessAllowlist>): Promise<AccessAllowlist | null> {
    const { text, params } = this.buildUpdateQuery('gg_access_allowlist', updates, { email });
    return this.queryOne<AccessAllowlist>(text, params);
  }

  async delete(email: string): Promise<void> {
    await this.execute('DELETE FROM gg_access_allowlist WHERE email = $1', [email]);
  }

  async list(filters?: {
    status?: string;
    invitedBy?: string;
  }): Promise<AccessAllowlist[]> {
    let query = 'SELECT * FROM gg_access_allowlist WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.invitedBy) {
      query += ` AND invited_by = $${paramIndex}`;
      params.push(filters.invitedBy);
      paramIndex++;
    }

    query += ' ORDER BY invited_at DESC';

    return this.query<AccessAllowlist>(query, params);
  }

  async approve(email: string, approvedBy: string): Promise<AccessAllowlist | null> {
    return this.update(email, {
      status: 'approved',
      invited_by: approvedBy
    });
  }

  async revoke(email: string): Promise<AccessAllowlist | null> {
    return this.update(email, {
      status: 'revoked'
    });
  }

  async getPendingCount(): Promise<number> {
    const result = await this.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM gg_access_allowlist WHERE status = $1',
      ['pending']
    );
    return parseInt(result?.count || '0');
  }
}
