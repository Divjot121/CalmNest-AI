import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16).default('calmnest_super_secret_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('calmnest_super_secret_refresh_key_2026'),
  GEMINI_API_KEY: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  // In non-production or test, fallback gracefully with parsed defaults when possible
}

export const env = _env.success ? _env.data : envSchema.parse({});
