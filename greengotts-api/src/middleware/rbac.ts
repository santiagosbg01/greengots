import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRepository } from '../db/repositories/user';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    display_name?: string;
    status: string;
  };
}

export interface RBACOptions {
  requiredRoles?: string[];
  requireGlobalRole?: boolean;
  teamIdParam?: string;
  allowSelfAccess?: boolean;
}

export function requireAuth(options: RBACOptions = {}) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const userId = request.session.get('user_id');
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Get user from database
    const userRepo = new UserRepository(request.server.pg);
    const user = await userRepo.findById(userId);
    
    if (!user) {
      request.session.delete();
      return reply.code(401).send({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return reply.code(403).send({ error: 'Account is inactive' });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      status: user.status
    };

    // Check role requirements
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const hasRequiredRole = await checkUserRoles(
        userRepo,
        user.id,
        options.requiredRoles,
        options.requireGlobalRole,
        options.teamIdParam ? request.params[options.teamIdParam] as string : undefined
      );

      if (!hasRequiredRole) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions',
          required: options.requiredRoles
        });
      }
    }

    // Check team access if teamIdParam is specified
    if (options.teamIdParam) {
      const teamId = request.params[options.teamIdParam] as string;
      if (teamId && !options.allowSelfAccess) {
        const hasTeamAccess = await checkTeamAccess(userRepo, user.id, teamId);
        if (!hasTeamAccess) {
          return reply.code(403).send({ error: 'Access denied to this team' });
        }
      }
    }
  };
}

async function checkUserRoles(
  userRepo: UserRepository,
  userId: string,
  requiredRoles: string[],
  requireGlobalRole: boolean = false,
  teamId?: string
): Promise<boolean> {
  if (requireGlobalRole) {
    // Check if user has any of the required roles globally
    for (const role of requiredRoles) {
      if (await userRepo.hasGlobalRole(userId, role)) {
        return true;
      }
    }
    return false;
  } else {
    // Check if user has any of the required roles (global or team-scoped)
    for (const role of requiredRoles) {
      if (await userRepo.hasRole(userId, role, teamId)) {
        return true;
      }
    }
    return false;
  }
}

async function checkTeamAccess(
  userRepo: UserRepository,
  userId: string,
  teamId: string
): Promise<boolean> {
  // Check if user has any role for this team
  const userRoles = await userRepo.getUserRoles(userId);
  return userRoles.some(role => role.team_id === teamId);
}

// Convenience middleware functions
export const requireAdmin = requireAuth({ 
  requiredRoles: ['ADMIN'], 
  requireGlobalRole: true 
});

export const requireManager = requireAuth({ 
  requiredRoles: ['MANAGER', 'ADMIN'] 
});

export const requireContributor = requireAuth({ 
  requiredRoles: ['CONTRIBUTOR', 'MANAGER', 'ADMIN'] 
});

export const requireFinance = requireAuth({ 
  requiredRoles: ['FINANCE', 'ADMIN'] 
});

export const requireTeamAccess = (teamIdParam: string = 'teamId') => 
  requireAuth({ 
    requiredRoles: ['CONTRIBUTOR', 'MANAGER', 'ADMIN'],
    teamIdParam,
    allowSelfAccess: true
  });

// Middleware to check if user can access a specific team
export function requireTeamManager(teamIdParam: string = 'teamId') {
  return requireAuth({
    requiredRoles: ['MANAGER', 'ADMIN'],
    teamIdParam
  });
}

// Middleware to check if user can access budget items
export function requireBudgetAccess(budgetIdParam: string = 'budgetId') {
  return requireAuth({
    requiredRoles: ['CONTRIBUTOR', 'MANAGER', 'ADMIN'],
    teamIdParam: budgetIdParam
  });
}
