import { BaseRepository } from './base';
import { User, UserRole } from '../types';

export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<User | null> {
    return this.queryOne<User>('SELECT * FROM gg_user WHERE id = $1', [id]);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.queryOne<User>('SELECT * FROM gg_user WHERE email = $1', [email]);
  }

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { text, params } = this.buildInsertQuery('gg_user', {
      ...user,
      created_at: new Date()
    });
    return this.queryOne<User>(text, params)!;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const { text, params } = this.buildUpdateQuery('gg_user', updates, { id });
    return this.queryOne<User>(text, params);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.query<UserRole>(`
      SELECT ur.*, r.code as role_code
      FROM gg_user_role ur
      JOIN gg_role r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [userId]);
  }

  async addUserRole(userId: string, roleId: number, teamId?: string): Promise<void> {
    await this.execute(`
      INSERT INTO gg_user_role (user_id, role_id, team_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id, team_id) DO NOTHING
    `, [userId, roleId, teamId]);
  }

  async removeUserRole(userId: string, roleId: number, teamId?: string): Promise<void> {
    await this.execute(`
      DELETE FROM gg_user_role 
      WHERE user_id = $1 AND role_id = $2 AND (team_id = $3 OR (team_id IS NULL AND $3 IS NULL))
    `, [userId, roleId, teamId]);
  }

  async hasRole(userId: string, roleCode: string, teamId?: string): Promise<boolean> {
    const result = await this.queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM gg_user_role ur
      JOIN gg_role r ON ur.role_id = r.id
      WHERE ur.user_id = $1 
        AND r.code = $2 
        AND (ur.team_id = $3 OR (ur.team_id IS NULL AND $3 IS NULL))
    `, [userId, roleCode, teamId]);
    
    return parseInt(result?.count || '0') > 0;
  }

  async hasGlobalRole(userId: string, roleCode: string): Promise<boolean> {
    const result = await this.queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM gg_user_role ur
      JOIN gg_role r ON ur.role_id = r.id
      WHERE ur.user_id = $1 
        AND r.code = $2 
        AND ur.team_id IS NULL
    `, [userId, roleCode]);
    
    return parseInt(result?.count || '0') > 0;
  }
}
