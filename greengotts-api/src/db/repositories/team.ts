import { BaseRepository } from './base';
import { Team, CostCenter } from '../types';

export class TeamRepository extends BaseRepository {
  async findById(id: string): Promise<Team | null> {
    return this.queryOne<Team>('SELECT * FROM gg_team WHERE id = $1', [id]);
  }

  async findByOwner(ownerId: string): Promise<Team[]> {
    return this.query<Team>('SELECT * FROM gg_team WHERE owner_user_id = $1 ORDER BY created_at DESC', [ownerId]);
  }

  async create(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const { text, params } = this.buildInsertQuery('gg_team', {
      ...team,
      created_at: new Date()
    });
    return this.queryOne<Team>(text, params)!;
  }

  async update(id: string, updates: Partial<Team>): Promise<Team | null> {
    const { text, params } = this.buildUpdateQuery('gg_team', updates, { id });
    return this.queryOne<Team>(text, params);
  }

  async delete(id: string): Promise<void> {
    await this.execute('DELETE FROM gg_team WHERE id = $1', [id]);
  }

  async getCostCenters(teamId: string): Promise<CostCenter[]> {
    return this.query<CostCenter>('SELECT * FROM gg_cost_center WHERE team_id = $1 ORDER BY code', [teamId]);
  }

  async createCostCenter(costCenter: Omit<CostCenter, 'id'>): Promise<CostCenter> {
    const { text, params } = this.buildInsertQuery('gg_cost_center', costCenter);
    return this.queryOne<CostCenter>(text, params)!;
  }

  async updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter | null> {
    const { text, params } = this.buildUpdateQuery('gg_cost_center', updates, { id });
    return this.queryOne<CostCenter>(text, params);
  }

  async setDefaultCostCenter(teamId: string, costCenterId: string): Promise<void> {
    await this.execute(
      'UPDATE gg_team SET cost_center_default_id = $1 WHERE id = $2',
      [costCenterId, teamId]
    );
  }
}
