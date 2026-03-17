import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { RelationshipStore } from '@/types/database'

export function getPairId(agent_a_id: string, agent_b_id: string): string {
  const sorted = [agent_a_id, agent_b_id].sort().join(':')
  return crypto.createHash('sha256').update(sorted).digest('hex')
}

export async function getRelationship(
  agent_a_id: string,
  agent_b_id: string
): Promise<RelationshipStore | null> {
  const pair_id = getPairId(agent_a_id, agent_b_id)
  const supabase = createClient()

  const { data, error } = await supabase
    .from('relationship_store')
    .select('*')
    .eq('pair_id', pair_id)
    .single()

  if (error || !data) return null
  return data
}

export async function updateRelationship(
  pair_id: string,
  agent_a_id: string,
  agent_b_id: string,
  concede_count: number,
  move_count: number
): Promise<void> {
  const supabase = createClient()

  // Fetch existing row to calculate increments
  const { data: existing } = await supabase
    .from('relationship_store')
    .select('interaction_count, mutual_influence_score')
    .eq('pair_id', pair_id)
    .single()

  const isNew = !existing
  const existingScore = existing?.mutual_influence_score ?? 0
  const existingCount = existing?.interaction_count ?? 0

  // Recalculate mutual_influence_score
  let newScore = existingScore
  if (move_count > 0) {
    const sessionConcedeRate = concede_count / move_count
    newScore = existingScore * 0.8 + sessionConcedeRate * 0.2
  }

  const now = new Date().toISOString()

  await supabase.from('relationship_store').upsert(
    {
      pair_id,
      agent_a_id,
      agent_b_id,
      interaction_count: isNew ? 1 : existingCount + 1,
      mutual_influence_score: newScore,
      last_exchange_at: now,
      ...(isNew ? { context_summary: 'Summary pending' } : {}),
    },
    { onConflict: 'pair_id' }
  )
}
