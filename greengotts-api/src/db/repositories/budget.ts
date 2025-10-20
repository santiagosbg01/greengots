import { BaseRepository } from './base';
import { Budget, BudgetSection, BudgetItem } from '../types';

export class BudgetRepository extends BaseRepository {
  async findById(id: string): Promise<Budget | null> {
    return this.queryOne<Budget>('SELECT * FROM gg_budget WHERE id = $1', [id]);
  }

  async findByTeam(teamId: string): Promise<Budget[]> {
    return this.query<Budget>('SELECT * FROM gg_budget WHERE team_id = $1 ORDER BY fiscal_year DESC, created_at DESC', [teamId]);
  }

  async create(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const now = new Date();
    const { text, params } = this.buildInsertQuery('gg_budget', {
      ...budget,
      created_at: now,
      updated_at: now
    });
    return this.queryOne<Budget>(text, params)!;
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const { text, params } = this.buildUpdateQuery('gg_budget', {
      ...updates,
      updated_at: new Date()
    }, { id });
    return this.queryOne<Budget>(text, params);
  }

  async delete(id: string): Promise<void> {
    await this.execute('DELETE FROM gg_budget WHERE id = $1', [id]);
  }

  // Budget Sections
  async getSections(budgetId: string): Promise<BudgetSection[]> {
    return this.query<BudgetSection>('SELECT * FROM gg_budget_section WHERE budget_id = $1 ORDER BY sort_order', [budgetId]);
  }

  async createSection(section: Omit<BudgetSection, 'id'>): Promise<BudgetSection> {
    const { text, params } = this.buildInsertQuery('gg_budget_section', section);
    return this.queryOne<BudgetSection>(text, params)!;
  }

  async updateSection(id: string, updates: Partial<BudgetSection>): Promise<BudgetSection | null> {
    const { text, params } = this.buildUpdateQuery('gg_budget_section', updates, { id });
    return this.queryOne<BudgetSection>(text, params);
  }

  async deleteSection(id: string): Promise<void> {
    // Set section_id to NULL for items in this section
    await this.execute('UPDATE gg_budget_item SET section_id = NULL WHERE section_id = $1', [id]);
    await this.execute('DELETE FROM gg_budget_section WHERE id = $1', [id]);
  }

  async reorderSections(budgetId: string, sectionOrders: { id: string; sort_order: number }[]): Promise<void> {
    for (const { id, sort_order } of sectionOrders) {
      await this.execute('UPDATE gg_budget_section SET sort_order = $1 WHERE id = $2', [sort_order, id]);
    }
  }

  // Budget Items
  async getItems(budgetId: string, filters?: {
    type?: string;
    status?: string;
    costCenterId?: string;
    month?: string;
  }): Promise<BudgetItem[]> {
    let query = 'SELECT * FROM gg_budget_item WHERE budget_id = $1 AND soft_deleted_at IS NULL';
    const params: any[] = [budgetId];
    let paramIndex = 2;

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.costCenterId) {
      query += ` AND cost_center_id = $${paramIndex}`;
      params.push(filters.costCenterId);
      paramIndex++;
    }

    if (filters?.month) {
      query += ` AND (start_month <= $${paramIndex} AND (end_month IS NULL OR end_month >= $${paramIndex}))`;
      params.push(filters.month);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    return this.query<BudgetItem>(query, params);
  }

  async createItem(item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    const now = new Date();
    const { text, params } = this.buildInsertQuery('gg_budget_item', {
      ...item,
      created_at: now,
      updated_at: now
    });
    return this.queryOne<BudgetItem>(text, params)!;
  }

  async updateItem(id: string, updates: Partial<BudgetItem>): Promise<BudgetItem | null> {
    const { text, params } = this.buildUpdateQuery('gg_budget_item', {
      ...updates,
      updated_at: new Date()
    }, { id });
    return this.queryOne<BudgetItem>(text, params);
  }

  async softDeleteItem(id: string): Promise<void> {
    await this.execute('UPDATE gg_budget_item SET soft_deleted_at = $1 WHERE id = $2', [new Date(), id]);
  }

  async restoreItem(id: string): Promise<void> {
    await this.execute('UPDATE gg_budget_item SET soft_deleted_at = NULL WHERE id = $1', [id]);
  }
}
