import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { getPool, closePool } from './db/connection';
import { registerGoogleAuth } from './auth/google';
import { registerAdminRoutes } from './admin/allowlist';
import { registerTeamRoutes } from './teams/index';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

async function build() {
  // Register plugins
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
  });

  await fastify.register(cookie, {
    secret: process.env.GREENGOTTS_SESSION_SECRET || 'default-secret'
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: (parseInt(process.env.GREENGOTTS_MAX_UPLOAD_MB || '10') * 1024 * 1024)
    }
  });

  // Register database connection
  fastify.register(async function (fastify) {
    fastify.decorate('pg', getPool());
  });

  // Register routes
  await fastify.register(registerGoogleAuth);
  await fastify.register(registerAdminRoutes);
  await fastify.register(registerTeamRoutes);

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      reply.code(503);
      return { status: 'unhealthy', error: error.message };
    }
  });

  // Database test endpoint
  fastify.get('/api/test/db', async (request, reply) => {
    try {
      const pool = getPool();
      const result = await pool.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\' AND table_name LIKE \'gg_%\'');
      return { 
        message: 'Database connection successful',
        tables: result.rows[0].table_count
      };
    } catch (error) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await closePool();
  });

  return fastify;
}

async function start() {
  try {
    const server = await build();
    
    const port = parseInt(process.env.GREENGOTTS_PORT || '8080');
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    await server.listen({ port, host });
    console.log(`🚀 Greengotts API server running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🔍 DB test: http://${host}:${port}/api/test/db`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { build };
