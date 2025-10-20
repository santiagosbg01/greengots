import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTransaction } from '../db/connection';
import { AccessAllowlistRepository } from '../db/repositories/allowlist';
import { UserRepository } from '../db/repositories/user';
import { TeamRepository } from '../db/repositories/team';
import { requireAdmin } from '../middleware/rbac';

interface AllowlistRequest {
  email: string;
  status?: 'pending' | 'approved' | 'revoked';
}

interface RoleAssignmentRequest {
  userId: string;
  roleId: number;
  teamId?: string;
}

export async function registerAdminRoutes(fastify: FastifyInstance) {
  // Get allowlist
  fastify.get('/api/admin/allowlist', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status } = request.query as { status?: string };
    
    const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
    const entries = await allowlistRepo.list({ status });
    
    return reply.send(entries);
  });

  // Add to allowlist
  fastify.post('/api/admin/allowlist', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['pending', 'approved', 'revoked'] }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: AllowlistRequest }>, reply: FastifyReply) => {
    const { email, status = 'pending' } = request.body;
    const userId = request.session.get('user_id');

    const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
    
    // Check if email already exists
    const existing = await allowlistRepo.findByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: 'Email already in allowlist' });
    }

    const entry = await allowlistRepo.create({
      email,
      invited_by: userId,
      status: status as 'pending' | 'approved' | 'revoked'
    });

    return reply.code(201).send(entry);
  });

  // Update allowlist entry
  fastify.patch('/api/admin/allowlist/:email', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'approved', 'revoked'] }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { email: string }; Body: { status: string } }>, reply: FastifyReply) => {
    const { email } = request.params;
    const { status } = request.body;

    const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
    const entry = await allowlistRepo.update(email, { status: status as any });

    if (!entry) {
      return reply.code(404).send({ error: 'Allowlist entry not found' });
    }

    return reply.send(entry);
  });

  // Delete from allowlist
  fastify.delete('/api/admin/allowlist/:email', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{ Params: { email: string } }>, reply: FastifyReply) => {
    const { email } = request.params;

    const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
    await allowlistRepo.delete(email);

    return reply.send({ success: true });
  });

  // Get all users
  fastify.get('/api/admin/users', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userRepo = new UserRepository(fastify.pg);
    const users = await userRepo.query(`
      SELECT u.*, 
             array_agg(
               json_build_object(
                 'role_id', ur.role_id,
                 'role_code', r.code,
                 'team_id', ur.team_id
               )
             ) as roles
      FROM gg_user u
      LEFT JOIN gg_user_role ur ON u.id = ur.user_id
      LEFT JOIN gg_role r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return reply.send(users);
  });

  // Assign role to user
  fastify.post('/api/admin/users/:userId/roles', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['roleId'],
        properties: {
          roleId: { type: 'number' },
          teamId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { userId: string }; 
    Body: RoleAssignmentRequest 
  }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const { roleId, teamId } = request.body;

    await withTransaction(async (client) => {
      const userRepo = new UserRepository(client);
      const teamRepo = new TeamRepository(client);

      // Verify user exists
      const user = await userRepo.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify team exists if teamId provided
      if (teamId) {
        const team = await teamRepo.findById(teamId);
        if (!team) {
          throw new Error('Team not found');
        }
      }

      // Add role
      await userRepo.addUserRole(userId, roleId, teamId);
    });

    return reply.send({ success: true });
  });

  // Remove role from user
  fastify.delete('/api/admin/users/:userId/roles', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['roleId'],
        properties: {
          roleId: { type: 'number' },
          teamId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { userId: string }; 
    Body: RoleAssignmentRequest 
  }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const { roleId, teamId } = request.body;

    const userRepo = new UserRepository(fastify.pg);
    await userRepo.removeUserRole(userId, roleId, teamId);

    return reply.send({ success: true });
  });

  // Get pending allowlist count
  fastify.get('/api/admin/allowlist/pending-count', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
    const count = await allowlistRepo.getPendingCount();

    return reply.send({ count });
  });
}
