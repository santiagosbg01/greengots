#!/usr/bin/env node

// Generate a secure JWT secret for Greengotts
const crypto = require('crypto');

const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('🔐 Generated JWT Secret for Greengotts:');
console.log('');
console.log(jwtSecret);
console.log('');
console.log('📋 Copy this value and use it as your JWT_SECRET environment variable in Railway.');
console.log('');
console.log('⚠️  Keep this secret secure and never commit it to version control!');
