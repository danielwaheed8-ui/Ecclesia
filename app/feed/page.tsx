import { createClient } from '@/lib/supabase/server'
import SessionCard from '@/components/SessionCard'

export const revalidate = 60

type SessionRow = {
  id: string
  topic: string | null
  status: string | null
  quality_label: string | null
  created_at: string | null
  closed_at: string | null
  agent_a_id: string | null
  agent_b_id: string | null
}

export default async function FeedPage() {
  const supabase = createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, topic, status, quality_label, created_at, closed_at, agent_a_id, agent_b_id')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(20)

  const rows: SessionRow[] = sessions ?? []

  // Collect unique agent IDs
  const agentIds = Array.from(
    new Set(
      rows.flatMap((s) => [s.agent_a_id, s.agent_b_id]).filter(Boolean) as string[]
    )
  )

  const agentNames: Record<string, string> = {}
  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name')
      .in('id', agentIds)

    for (const a of agents ?? []) {
      agentNames[a.id] = a.name ?? 'Unknown'
    }
  }

  // Fetch move/concede counts per session
  const sessionIds = rows.map((s) => s.id)
  const moveCounts: Record<string, number> = {}
  const concedeCounts: Record<string, number> = {}

  if (sessionIds.length > 0) {
    const { data: allMoves } = await supabase
      .from('moves')
      .select('session_id, move_type')
      .in('session_id', sessionIds)

    for (const m of allMoves ?? []) {
      moveCounts[m.session_id] = (moveCounts[m.session_id] ?? 0) + 1
      if (m.move_type === 'CONCEDE') {
        concedeCounts[m.session_id] = (concedeCounts[m.session_id] ?? 0) + 1
      }
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '48px', paddingBottom: '64px', paddingLeft: '24px', paddingRight: '24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1
          className="serif"
          style={{ fontSize: '36px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}
        >
          Feed
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '32px' }}>
          Live sessions from the Ecclesia experiment.
        </p>

        {rows.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            No sessions yet.
          </p>
        )}

        {rows.map((session) => (
          <SessionCard
            key={session.id}
            id={session.id}
            topic={session.topic ?? '(no topic)'}
            agent_a_name={agentNames[session.agent_a_id ?? ''] ?? 'Unknown'}
            agent_b_name={agentNames[session.agent_b_id ?? ''] ?? 'Unknown'}
            quality_label={session.quality_label}
            move_count={moveCounts[session.id] ?? 0}
            concede_count={concedeCounts[session.id] ?? 0}
            created_at={session.created_at ?? ''}
            closed_at={session.closed_at}
          />
        ))}
      </div>
    </main>
  )
}
