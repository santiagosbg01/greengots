import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getPool } from '../db/connection';
import { UserRepository } from '../db/repositories/user';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
function generateToken(userId: string, email: string) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Register new user
async function registerUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password, name } = RegisterSchema.parse(request.body);
    
    const pool = getPool();
    const userRepo = new UserRepository(pool);
    
    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return reply.status(400).send({
        error: 'User already exists with this email'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await userRepo.create({
      email,
      name,
      password_hash: hashedPassword,
      role_id: 3 // Default to CONTRIBUTOR role
    });
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    return reply.send({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(400).send({
      error: 'Invalid registration data'
    });
  }
}

// Login user
async function loginUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = LoginSchema.parse(request.body);
    
    const pool = getPool();
    const userRepo = new UserRepository(pool);
    
    // Find user by email
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return reply.status(401).send({
        error: 'Invalid email or password'
      });
    }
    
    // Check if user has a password (not OAuth user)
    if (!user.password_hash) {
      return reply.status(401).send({
        error: 'Please use Google login for this account'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(400).send({
      error: 'Invalid login data'
    });
  }
}

// Change password
async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(request.body);
    const userId = (request as any).user?.id;
    
    if (!userId) {
      return reply.status(401).send({
        error: 'Authentication required'
      });
    }
    
    const pool = getPool();
    const userRepo = new UserRepository(pool);
    
    // Get current user
    const user = await userRepo.findById(userId);
    if (!user || !user.password_hash) {
      return reply.status(400).send({
        error: 'User not found or no password set'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await userRepo.update(userId, { password_hash: hashedPassword });
    
    return reply.send({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return reply.status(400).send({
      error: 'Invalid data'
    });
  }
}

// Get current user
async function getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request as any).user?.id;
    
    if (!userId) {
      return reply.status(401).send({
        error: 'Authentication required'
      });
    }
    
    const pool = getPool();
    const userRepo = new UserRepository(pool);
    
    const user = await userRepo.findById(userId);
    if (!user) {
      return reply.status(404).send({
        error: 'User not found'
      });
    }
    
    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return reply.status(500).send({
      error: 'Internal server error'
    });
  }
}

// Logout (client-side token removal)
async function logout(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    message: 'Logout successful'
  });
}

// Middleware to verify JWT token
async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return reply.status(401).send({
        error: 'Invalid token'
      });
    }
    
    // Add user info to request
    (request as any).user = decoded;
  } catch (error) {
    return reply.status(401).send({
      error: 'Invalid token'
    });
  }
}

// Register auth routes
export async function registerPasswordAuth(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/api/auth/register', registerUser);
  fastify.post('/api/auth/login', loginUser);
  fastify.post('/api/auth/logout', logout);
  
  // Protected routes
  fastify.get('/api/auth/me', { preHandler: verifyAuth }, getCurrentUser);
  fastify.post('/api/auth/change-password', { preHandler: verifyAuth }, changePassword);
}

export { verifyAuth };
