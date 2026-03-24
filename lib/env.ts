import { z } from 'zod'

/**
 * Validates public Supabase env in production so misconfiguration fails fast.
 * Set SKIP_ENV_VALIDATION=1 locally if you intentionally omit vars.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'anon key too short'),
})

export function validateProductionEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === '1') return
  if (process.env.NODE_ENV !== 'production') return

  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!result.success) {
    const msg = result.error.flatten().fieldErrors
    console.error('[env] Invalid NEXT_PUBLIC_* configuration:', msg)
    throw new Error('Invalid environment: check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}
