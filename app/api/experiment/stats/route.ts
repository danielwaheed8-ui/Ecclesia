export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()

  // 1. Total closed sessions
  const { count: total_sessions } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed')

  // 2. High quality sessions
  const { count: high_quality_sessions } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('quality_label', 'high')

  // 3. Moves joined to closed sessions — for global_concede_rate and move_distribution
  const { data: closedSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('status', 'closed')

  const closedIds = (closedSessions ?? []).map((s) => s.id)

  const moveDistribution = { ASSERT: 0, CHALLENGE: 0, BUILD: 0, CONCEDE: 0, REFRAME: 0 }
  let totalMoves = 0
  let concedeMoves = 0

  if (closedIds.length > 0) {
    const { data: moves } = await supabase
      .from('moves')
      .select('move_type')
      .in('session_id', closedIds)

    for (const m of moves ?? []) {
      const t = m.move_type as keyof typeof moveDistribution
      if (t in moveDistribution) moveDistribution[t] += 1
      totalMoves += 1
      if (m.move_type === 'CONCEDE') concedeMoves += 1
    }
  }

  const global_concede_rate =
    totalMoves > 0
      ? parseFloat(((concedeMoves / totalMoves) * 100).toFixed(2))
      : 0

  // 4. Avg ground score
  const { data: groundRows } = await supabase
    .from('common_ground')
    .select('ground_score')

  const groundScores = (groundRows ?? []).map((r) => r.ground_score ?? 0)
  const avg_ground_score =
    groundScores.length > 0
      ? parseFloat(
          (groundScores.reduce((a, b) => a + b, 0) / groundScores.length).toFixed(4)
        )
      : 0

  // 5. Dataset size (pushed to HF)
  const { count: dataset_size } = await supabase
    .from('dataset_records')
    .select('id', { count: 'exact', head: true })
    .eq('pushed_to_hf', true)

  // 6. Active agents — distinct IDs from closed sessions
  const agentSet = new Set<string>()
  const { data: sessionAgents } = await supabase
    .from('sessions')
    .select('agent_a_id, agent_b_id')
    .eq('status', 'closed')

  for (const s of sessionAgents ?? []) {
    if (s.agent_a_id) agentSet.add(s.agent_a_id)
    if (s.agent_b_id) agentSet.add(s.agent_b_id)
  }
  const active_agents = agentSet.size

  // 7. Avg mutual influence
  const { data: relRows } = await supabase
    .from('relationship_store')
    .select('mutual_influence_score')
    .gt('interaction_count', 0)

  const influenceScores = (relRows ?? []).map((r) => r.mutual_influence_score ?? 0)
  const avg_mutual_influence =
    influenceScores.length > 0
      ? parseFloat(
          (influenceScores.reduce((a, b) => a + b, 0) / influenceScores.length).toFixed(4)
        )
      : 0

  return NextResponse.json({
    global_concede_rate,
    total_sessions: total_sessions ?? 0,
    high_quality_sessions: high_quality_sessions ?? 0,
    avg_ground_score,
    dataset_size: dataset_size ?? 0,
    active_agents,
    avg_mutual_influence,
    move_distribution_global: moveDistribution,
  })
}
