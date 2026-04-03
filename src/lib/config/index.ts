import { z } from 'zod';
import type { Env } from '../types';

const schema = z.object({
  SPEC_POST_URL: z.string().url(),
  SPEC_API_KEY: z.string().min(1),
  TARGET_API_BASE_URL: z.string().url(),
  SPEC_API_KEY_HEADER: z.string().optional(),
  SPEC_AUTH_HEADER: z.string().optional(),
  SPEC_POST_BODY: z.string().optional(),
  SPEC_POST_HEADERS: z.string().optional(),
  SPEC_RESPONSE_PATH: z.string().optional()
});

export const loadConfig = (env: Env) => schema.parse(env);
