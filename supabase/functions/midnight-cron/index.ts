// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Midnight Cron Function starting up...')

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const todayDate = new Date().toISOString().split('T')[0]

    // 1. Mark incomplete topics as overdue globally
    // We let the client RescheduleEngine handle moving them the next time they open the app,
    // but we update the topic status here to reflect accurate state if webhooks/other services run
    const { data: plansToMark, error: planFetchErr } = await supabaseAdmin
      .from('daily_plans')
      .select('topic_id')
      .eq('is_completed', false)
      .lt('assigned_date', todayDate)

    if (planFetchErr) throw planFetchErr

    if (plansToMark && plansToMark.length > 0) {
      const topicIds = plansToMark.map((p: any) => p.topic_id)
      const { error: updateErr } = await supabaseAdmin
        .from('topics')
        .update({ status: 'overdue' })
        .in('id', topicIds)
        .eq('status', 'pending')

      if (updateErr) throw updateErr
      console.log(`Marked ${topicIds.length} topics as overdue.`)
    } else {
      console.log('No overdue topics found.')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Cron error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
