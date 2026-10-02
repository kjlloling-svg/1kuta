import { env } from '@/lib/local-env';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
export function getDb(){return drizzle(env.DB as unknown as D1Database,{schema});}
