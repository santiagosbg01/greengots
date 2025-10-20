import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTransaction } from '../db/connection';
import { TeamRepository } from '../db/repositories/team';
import { UserRepository } from '../db/repositories/user';
import { requireAdmin, requireManager } from '../middleware/rbac';

interface CreateTeamRequest {
  name: string;
  owner_user_id: string;
  cost_center_default_id?: string;
}

interface CreateCostCenterRequest {
  team_id: string;
  code: string;
  name: string;
  active?: boolean;
}

export async function registerTeamRoutes(fastify: FastifyInstance) {
  // Get all teams (admin only)
  fastify.get('/api/teams', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const teamRepo = new TeamRepository(fastify.pg);
    const teams = await teamRepo.query(`
      SELECT t.*, 
             u.display_name as owner_name,
             cc.code as default_cost_center_code,
             cc.name as default_cost_center_name
      FROM gg_team t
      LEFT JOIN gg_user u ON t.owner_user_id = u.id
      LEFT JOIN gg_cost_center cc ON t.cost_center_default_id = cc.id
      ORDER BY t.created_at DESC
    `);

    return reply.send(teams);
  });

  // Get team by ID
  fastify.get('/api/teams/:teamId', {
    preHandler: requireManager
  }, async (request: FastifyRequest<{ Params: { teamId: string } }>, reply: FastifyReply) => {
    const { teamId } = request.params;
    const userId = request.session.get('user_id');

    const teamRepo = new TeamRepository(fastify.pg);
    const team = await teamRepo.findById(teamId);

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    // Check if user has access to this team
    const userRepo = new UserRepository(fastify.pg);
    const hasAccess = await userRepo.hasRole(userId, 'MANAGER', teamId) || 
                     await userRepo.hasRole(userId, 'ADMIN');

    if (!hasAccess) {
      return reply.code(403).send({ error: 'Access denied to this team' });
    }

    // Get cost centers for this team
    const costCenters = await teamRepo.getCostCenters(teamId);

    return reply.send({
      ...team,
      cost_centers: costCenters
    });
  });

  // Create team
  fastify.post('/api/teams', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'owner_user_id'],
        properties: {
          name: { type: 'string', minLength: 1 },
          owner_user_id: { type: 'string' },
          cost_center_default_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateTeamRequest }>, reply: FastifyReply) => {
    const { name, owner_user_id, cost_center_default_id } = request.body;

    await withTransaction(async (client) => {
      const teamRepo = new TeamRepository(client);
      const userRepo = new UserRepository(client);

      // Verify owner exists
      const owner = await userRepo.findById(owner_user_id);
      if (!owner) {
        throw new Error('Owner user not found');
      }

      // Create team
      const team = await teamRepo.create({
        name,
        owner_user_id,
        cost_center_default_id
      });

      // Assign MANAGER role to owner
      await userRepo.addUserRole(owner_user_id, 2, team.id); // Assuming MANAGER role has ID 2

      return team;
    });

    return reply.code(201).send({ success: true });
  });

  // Update team
  fastify.patch('/api/teams/:teamId', {
    preHandler: requireManager
  }, async (request: FastifyRequest<{ 
    Params: { teamId: string }; 
    Body: Partial<CreateTeamRequest> 
  }>, reply: FastifyReply) => {
    const { teamId } = request.params;
    const updates = request.body;

    const teamRepo = new TeamRepository(fastify.pg);
    const team = await teamRepo.update(teamId, updates);

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return reply.send(team);
  });

  // Delete team
  fastify.delete('/api/teams/:teamId', {
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{ Params: { teamId: string } }>, reply: FastifyReply) => {
    const { teamId } = request.params;

    const teamRepo = new TeamRepository(fastify.pg);
    await teamRepo.delete(teamId);

    return reply.send({ success: true });
  });

  // Get cost centers for team
  fastify.get('/api/teams/:teamId/cost-centers', {
    preHandler: requireManager
  }, async (request: FastifyRequest<{ Params: { teamId: string } }>, reply: FastifyReply) => {
    const { teamId } = request.params;

    const teamRepo = new TeamRepository(fastify.pg);
    const costCenters = await teamRepo.getCostCenters(teamId);

    return reply.send(costCenters);
  });

  // Create cost center
  fastify.post('/api/teams/:teamId/cost-centers', {
    preHandler: requireManager,
    schema: {
      body: {
        type: 'object',
        required: ['code', 'name'],
        properties: {
          code: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          active: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { teamId: string }; 
    Body: CreateCostCenterRequest 
  }>, reply: FastifyReply) => {
    const { teamId } = request.params;
    const { code, name, active = true } = request.body;

    const teamRepo = new TeamRepository(fastify.pg);
    const costCenter = await teamRepo.createCostCenter({
      team_id: teamId,
      code,
      name,
      active
    });

    return reply.code(201).send(costCenter);
  });

  // Update cost center
  fastify.patch('/api/cost-centers/:costCenterId', {
    preHandler: requireManager
  }, async (request: FastifyRequest<{ 
    Params: { costCenterId: string }; 
    Body: Partial<CreateCostCenterRequest> 
  }>, reply: FastifyReply) => {
    const { costCenterId } = request.params;
    const updates = request.body;

    const teamRepo = new TeamRepository(fastify.pg);
    const costCenter = await teamRepo.updateCostCenter(costCenterId, updates);

    if (!costCenter) {
      return reply.code(404).send({ error: 'Cost center not found' });
    }

    return reply.send(costCenter);
  });

  // Set default cost center for team
  fastify.patch('/api/teams/:teamId/default-cost-center', {
    preHandler: requireManager,
    schema: {
      body: {
        type: 'object',
        required: ['cost_center_id'],
        properties: {
          cost_center_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { teamId: string }; 
    Body: { cost_center_id: string } 
  }>, reply: FastifyReply) => {
    const { teamId } = request.params;
    const { cost_center_id } = request.body;

    const teamRepo = new TeamRepository(fastify.pg);
    await teamRepo.setDefaultCostCenter(teamId, cost_center_id);

    return reply.send({ success: true });
  });
}
