import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logApi } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  let supabaseOk = false
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    supabaseOk = !error
  } catch (e) {
    logApi('error', 'health_supabase_ping_failed', { err: String(e) })
  }

  const durationMs = Date.now() - started
  const healthy = supabaseOk

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      checks: {
        supabase: supabaseOk ? 'ok' : 'error',
      },
      durationMs,
    },
    { status: healthy ? 200 : 503 },
  )
}
