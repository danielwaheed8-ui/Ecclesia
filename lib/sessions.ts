import { createClient } from '@/lib/supabase/server'

export async function getSessionParticipants(
  session_id: string
): Promise<{ agent_a_id: string | null; agent_b_id: string | null } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('agent_a_id, agent_b_id')
    .eq('id', session_id)
    .single()

  if (error || !data) return null

  return {
    agent_a_id: data.agent_a_id,
    agent_b_id: data.agent_b_id,
  }
}
