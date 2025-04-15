import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

// Load env var
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is undefined');
}

// Init Neon Client
const sql = neon(process.env.DATABASE_URL);

// Init Drizzle
export const db = drizzle(sql);
