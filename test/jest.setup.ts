import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
const envPath = resolve(__dirname, '.env.test');
config({ path: envPath });

// Set test environment
process.env.NODE_ENV = 'test';

// Log loaded configuration for debugging
console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET);
console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);
console.log('Loaded ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

// Ensure ALLOWED_ORIGINS is set for tests
if (!process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS =
    'http://localhost:3000,http://localhost:4000,http://localhost:19006';
}
