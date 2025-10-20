import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTransaction } from '../db/connection';
import { UserRepository } from '../db/repositories/user';
import { AccessAllowlistRepository } from '../db/repositories/allowlist';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export async function registerGoogleAuth(fastify: FastifyInstance) {
  const clientId = process.env.GREENGOTTS_OIDC_CLIENT_ID;
  const clientSecret = process.env.GREENGOTTS_OIDC_CLIENT_SECRET;
  const redirectUrl = process.env.GREENGOTTS_OIDC_REDIRECT_URL;
  const allowedDomain = process.env.GREENGOTTS_ALLOWED_DOMAIN;

  if (!clientId || !clientSecret || !redirectUrl) {
    throw new Error('Google OIDC credentials not configured');
  }

  // Google OAuth2 login endpoint
  fastify.get('/api/auth/google/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in session for CSRF protection
    request.session.set('oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return reply.redirect(authUrl.toString());
  });

  // Google OAuth2 callback
  fastify.get('/api/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, state } = request.query as { code?: string; state?: string };
    const sessionState = request.session.get('oauth_state');

    if (!code || !state || state !== sessionState) {
      return reply.code(400).send({ error: 'Invalid OAuth callback' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUrl,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData;

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info from Google');
      }

      const googleUser: GoogleUser = await userResponse.json();

      // Validate email domain if configured
      if (allowedDomain && !googleUser.email.endsWith(`@${allowedDomain}`)) {
        return reply.redirect('/login?error=domain_not_allowed');
      }

      // Check allowlist
      const allowlistRepo = new AccessAllowlistRepository(fastify.pg);
      const allowlistEntry = await allowlistRepo.findByEmail(googleUser.email);
      
      if (!allowlistEntry || allowlistEntry.status !== 'approved') {
        return reply.redirect('/login?error=not_approved');
      }

      // Create or update user
      const userRepo = new UserRepository(fastify.pg);
      let user = await userRepo.findByEmail(googleUser.email);

      if (!user) {
        user = await userRepo.create({
          email: googleUser.email,
          display_name: googleUser.name,
          status: 'active'
        });
      } else {
        // Update user info
        user = await userRepo.update(user.id, {
          display_name: googleUser.name,
          status: 'active'
        });
      }

      // Set session
      request.session.set('user_id', user.id);
      request.session.set('user_email', user.email);
      request.session.set('authenticated', true);

      return reply.redirect('/dashboard');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return reply.redirect('/login?error=auth_failed');
    }
  });

  // Logout endpoint
  fastify.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    request.session.delete();
    return reply.send({ success: true });
  });

  // Get current user
  fastify.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.session.get('user_id');
    
    if (!userId) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    const userRepo = new UserRepository(fastify.pg);
    const user = await userRepo.findById(userId);
    
    if (!user) {
      request.session.delete();
      return reply.code(401).send({ error: 'User not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      status: user.status
    });
  });
}
