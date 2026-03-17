import { createClient } from '@/lib/supabase/server'

type MoveDistribution = {
  ASSERT: number
  CHALLENGE: number
  BUILD: number
  CONCEDE: number
  REFRAME: number
}

export type AgentMetrics = {
  total_sessions: number
  concede_rate: number
  ground_contribution: number
  move_distribution: MoveDistribution
  relationship_count: number
  avg_mutual_influence: number
}

export async function computeAgentMetrics(agent_id: string): Promise<AgentMetrics> {
  const supabase = createClient()

  // 1. Total closed sessions
  const { count: sessionCountA } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed')
    .eq('agent_a_id', agent_id)

  const { count: sessionCountB } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed')
    .eq('agent_b_id', agent_id)

  const total_sessions = (sessionCountA ?? 0) + (sessionCountB ?? 0)

  // 2. Move counts for concede_rate and move_distribution
  const { data: movesData } = await supabase
    .from('moves')
    .select('move_type')
    .eq('agent_id', agent_id)

  const move_distribution: MoveDistribution = {
    ASSERT: 0,
    CHALLENGE: 0,
    BUILD: 0,
    CONCEDE: 0,
    REFRAME: 0,
  }

  for (const m of movesData ?? []) {
    const t = m.move_type as keyof MoveDistribution
    if (t in move_distribution) move_distribution[t] += 1
  }

  const total_moves = (movesData ?? []).length
  const concede_moves = move_distribution.CONCEDE
  const concede_rate =
    total_moves > 0
      ? parseFloat(((concede_moves / total_moves) * 100).toFixed(1))
      : 0

  // 3. Ground contribution — average ground_delta from dataset_records for this agent's sessions
  const { data: sessionIds } = await supabase
    .from('sessions')
    .select('id')
    .eq('status', 'closed')
    .or(`agent_a_id.eq.${agent_id},agent_b_id.eq.${agent_id}`)

  const ids = (sessionIds ?? []).map((s) => s.id)

  let ground_contribution = 0
  if (ids.length > 0) {
    const { data: groundData } = await supabase
      .from('dataset_records')
      .select('ground_delta')
      .in('session_id', ids)

    const deltas = (groundData ?? [])
      .map((r) => r.ground_delta ?? 0)
      .filter((d) => d !== null)

    if (deltas.length > 0) {
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
      ground_contribution = parseFloat(avg.toFixed(4))
    }
  }

  // 4. Relationship count + avg mutual influence
  const { data: relA } = await supabase
    .from('relationship_store')
    .select('pair_id, mutual_influence_score')
    .eq('agent_a_id', agent_id)

  const { data: relB } = await supabase
    .from('relationship_store')
    .select('pair_id, mutual_influence_score')
    .eq('agent_b_id', agent_id)

  const allRels = [...(relA ?? []), ...(relB ?? [])]
  const uniquePairs = Array.from(new Set(allRels.map((r) => r.pair_id)))
  const relationship_count = uniquePairs.length

  const scores = allRels.map((r) => r.mutual_influence_score ?? 0)
  const avg_mutual_influence =
    scores.length > 0
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(4))
      : 0

  return {
    total_sessions,
    concede_rate,
    ground_contribution,
    move_distribution,
    relationship_count,
    avg_mutual_influence,
  }
}
