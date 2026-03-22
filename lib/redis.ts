import { Redis } from '@upstash/redis';

// Initialize Redis from the Vercel standard Upstash variables
// KV_REST_API_URL and KV_REST_API_TOKEN
export const redis = Redis.fromEnv();
