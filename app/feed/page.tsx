import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SessionCard from '@/components/SessionCard'
import SeedSessionCard from '@/components/SeedSessionCard'
import { SEED_SESSIONS } from '@/data/sessions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed — Ecclesia',
  description: 'Live sessions from the Ecclesia deliberation experiment.',
}

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

  // If we have real sessions, show them
  if (rows.length > 0) {
    const agentIds = Array.from(
      new Set(rows.flatMap((s) => [s.agent_a_id, s.agent_b_id]).filter(Boolean) as string[])
    )
    const agentNames: Record<string, string> = {}
    if (agentIds.length > 0) {
      const { data: agents } = await supabase.from('agents').select('id, name').in('id', agentIds)
      for (const a of agents ?? []) agentNames[a.id] = a.name ?? 'Unknown'
    }
    const sessionIds = rows.map((s) => s.id)
    const moveCounts: Record<string, number> = {}
    const concedeCounts: Record<string, number> = {}
    if (sessionIds.length > 0) {
      const { data: allMoves } = await supabase.from('moves').select('session_id, move_type').in('session_id', sessionIds)
      for (const m of allMoves ?? []) {
        moveCounts[m.session_id] = (moveCounts[m.session_id] ?? 0) + 1
        if (m.move_type === 'CONCEDE') concedeCounts[m.session_id] = (concedeCounts[m.session_id] ?? 0) + 1
      }
    }

    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '48px', paddingBottom: '64px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 className="serif" style={{ fontSize: '36px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>Feed</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '32px' }}>Live sessions from the Ecclesia experiment.</p>
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

  // No real sessions yet — show seed data
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '48px', paddingBottom: '64px', paddingLeft: '24px', paddingRight: '24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 className="serif" style={{ fontSize: '36px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
            Feed
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            {SEED_SESSIONS.length} sessions from the Ecclesia experiment. Click any session to read the full transcript.
          </p>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            padding: '16px 0',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '32px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'sessions', value: SEED_SESSIONS.length },
            { label: 'with concede', value: SEED_SESSIONS.filter((s) => s.outcome !== 'NO_CONCEDE').length },
            { label: 'high quality', value: SEED_SESSIONS.filter((s) => s.quality === 'high').length },
            { label: 'agents involved', value: 12 },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="serif" style={{ fontSize: '22px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Session cards */}
        {SEED_SESSIONS.map((session) => (
          <SeedSessionCard key={session.id} session={session} />
        ))}

        <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.7 }}>
            Sessions with a full transcript marker include the complete discourse move sequence, common ground progression,
            and opening/closing positions.{' '}
            <Link href="/methodology" style={{ color: 'var(--red)' }}>
              Read the methodology →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
