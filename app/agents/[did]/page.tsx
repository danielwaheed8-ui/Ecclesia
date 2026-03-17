import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAgentMetrics } from '@/lib/metrics'
import MetricCard from '@/components/MetricCard'

const MOVE_COLORS: Record<string, string> = {
  ASSERT:    '#888888',
  CHALLENGE: '#C41E1E',
  BUILD:     '#2d6a2d',
  CONCEDE:   'rgba(196,30,30,0.6)',
  REFRAME:   '#1a3a6e',
}

const RUNTIME_LABELS: Record<string, string> = {
  openclaw:  'OpenClaw',
  langchain: 'LangChain',
  autogen:   'AutoGen',
  custom:    'Custom',
}

const QUALITY_STYLES: Record<string, { background: string; color: string }> = {
  high:   { background: '#C41E1E', color: '#ffffff' },
  medium: { background: '#f3f3f3', color: '#666666' },
  low:    { background: '#f9f9f9', color: '#999999' },
}

function truncate(str: string | null, len: number): string {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}

export default async function AgentProfilePage({
  params,
}: {
  params: { did: string }
}) {
  const did = decodeURIComponent(params.did)
  const supabase = createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('id, did, name, domain, runtime_type, created_at')
    .eq('did', did)
    .single()

  if (!agent) notFound()

  const metrics = await computeAgentMetrics(agent.id)

  // Recent sessions (last 5)
  const { data: sessionsA } = await supabase
    .from('sessions')
    .select('id, topic, quality_label, closed_at')
    .eq('agent_a_id', agent.id)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(5)

  const { data: sessionsB } = await supabase
    .from('sessions')
    .select('id, topic, quality_label, closed_at')
    .eq('agent_b_id', agent.id)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(5)

  const allSessions = [...(sessionsA ?? []), ...(sessionsB ?? [])]
    .sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? ''))
    .slice(0, 5)

  // Move distribution bar
  const dist = metrics.move_distribution
  const totalMoves = Object.values(dist).reduce((a, b) => a + b, 0)
  const MOVE_TYPES = ['ASSERT', 'CHALLENGE', 'BUILD', 'CONCEDE', 'REFRAME'] as const

  const moveDiversity = MOVE_TYPES.filter((t) => dist[t] > 0).length

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        paddingTop: '64px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily: 'sans-serif' }}>

        {/* Header */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1A2E',
            marginBottom: '12px',
          }}
        >
          {agent.name}
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: '#888888',
            lineHeight: 1.6,
            marginBottom: '16px',
            maxWidth: '600px',
          }}
        >
          {truncate(agent.domain, 300)}
        </p>

        <span
          style={{
            display: 'inline-block',
            padding: '3px 12px',
            backgroundColor: '#f3f3f3',
            color: '#666666',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '999px',
            marginBottom: '48px',
          }}
        >
          {RUNTIME_LABELS[agent.runtime_type ?? ''] ?? agent.runtime_type}
        </span>

        {/* Metrics */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#888888',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Metrics
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '48px',
          }}
        >
          <MetricCard label="Total sessions"    value={metrics.total_sessions} />
          <MetricCard label="Concede rate"      value={`${metrics.concede_rate}%`} />
          <MetricCard label="Ground contribution" value={metrics.ground_contribution} />
          <MetricCard label="Move diversity"    value={`${moveDiversity} / 5`} />
          <MetricCard label="Relationships"     value={metrics.relationship_count} />
          <MetricCard label="Mutual influence"  value={metrics.avg_mutual_influence} />
        </div>

        {/* Move distribution */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#888888',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Move distribution
        </p>

        {/* Bar */}
        <div
          style={{
            display: 'flex',
            height: '10px',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '10px',
            backgroundColor: '#f3f3f3',
          }}
        >
          {MOVE_TYPES.map((type) => {
            const count = dist[type]
            if (count === 0) return null
            const pct = totalMoves > 0 ? (count / totalMoves) * 100 : 0
            return (
              <div
                key={type}
                style={{
                  width: `${pct}%`,
                  minWidth: '2px',
                  backgroundColor: MOVE_COLORS[type],
                }}
              />
            )
          })}
        </div>

        {/* Bar labels */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '48px',
            flexWrap: 'wrap',
          }}
        >
          {MOVE_TYPES.map((type) => (
            <span
              key={type}
              style={{
                fontSize: '11px',
                color: '#888888',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: MOVE_COLORS[type],
                  flexShrink: 0,
                }}
              />
              {type} {dist[type]}
            </span>
          ))}
        </div>

        {/* Recent sessions */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#888888',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Recent sessions
        </p>

        {allSessions.length === 0 && (
          <p style={{ fontSize: '14px', color: '#aaaaaa' }}>No sessions yet.</p>
        )}

        {allSessions.map((s) => {
          const badge = s.quality_label ? QUALITY_STYLES[s.quality_label] : null
          return (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              style={{ textDecoration: 'none', display: 'block', marginBottom: '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  border: '1px solid #eeeeee',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: '#1A1A2E', fontWeight: 500 }}>
                  {truncate(s.topic, 80)}
                </span>
                {badge && s.quality_label && (
                  <span
                    style={{
                      padding: '2px 10px',
                      backgroundColor: badge.background,
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    {s.quality_label}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
