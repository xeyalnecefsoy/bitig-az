'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveWebPushSubscription(input: {
  endpoint: string
  p256dh: string
  auth: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('web_push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' },
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeWebPushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('web_push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) return { error: error.message }
  return { success: true }
}

