import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const MOVE_COLORS: Record<string, string> = {
  ASSERT: '#444',
  CHALLENGE: 'var(--red)',
  BUILD: '#3aab5a',
  CONCEDE: 'var(--blue)',
  REFRAME: 'var(--amber)',
}

const MOVE_BG: Record<string, string> = {
  ASSERT:    '#1a1a1a',
  CHALLENGE: '#2a0a0a',
  BUILD:     '#0a1f10',
  CONCEDE:   '#0a1020',
  REFRAME:   '#1f1500',
}

export default async function DashboardPage() {
  await requireAuth()
  const supabase = createAdminClient()

  const todayMidnight = new Date()
  todayMidnight.setUTCHours(0, 0, 0, 0)
  const todayISO = todayMidnight.toISOString()

  const [
    { count: agentCount },
    { count: closedCount },
    { count: concedesToday },
    { count: movesToday },
    { count: datasetCount },
    { data: relRows },
    { count: liveCount },
    { data: groundRows },
    { data: recentSessions },
    { data: recentMoves },
    { data: groundFacts },
    { count: highQualityCount },
  ] = await Promise.all([
    supabase.from('agents').select('id', { count: 'exact', head: true }),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('moves').select('id', { count: 'exact', head: true }).eq('move_type', 'CONCEDE').gte('submitted_at', todayISO),
    supabase.from('moves').select('id', { count: 'exact', head: true }).gte('submitted_at', todayISO),
    supabase.from('dataset_records').select('id', { count: 'exact', head: true }).eq('pushed_to_hf', true),
    supabase.from('relationship_store').select('mutual_influence_score').gt('interaction_count', 0),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('common_ground').select('ground_score'),
    supabase.from('sessions').select('id, topic, quality_label, agent_a_id, agent_b_id, closed_at').eq('status', 'closed').order('closed_at', { ascending: false }).limit(4),
    supabase.from('moves').select('id, move_type, content, submitted_at, agent_id, session_id').order('submitted_at', { ascending: false }).limit(6),
    supabase.from('common_ground').select('established_facts, updated_at').order('updated_at', { ascending: false }).limit(3),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('quality_label', 'high'),
  ])

  // Compute averages
  const avgInfluence = relRows && relRows.length > 0
    ? parseFloat((relRows.reduce((a, r) => a + (r.mutual_influence_score ?? 0), 0) / relRows.length).toFixed(4))
    : 0

  const avgGround = groundRows && groundRows.length > 0
    ? parseFloat((groundRows.reduce((a, r) => a + (r.ground_score ?? 0), 0) / groundRows.length).toFixed(4))
    : 0

  // Global concede rate
  const totalMoveCount = movesToday ?? 0
  const concedeCount = concedesToday ?? 0

  // Agent names for recent sessions
  const sessionAgentIds = Array.from(new Set(
    (recentSessions ?? []).flatMap(s => [s.agent_a_id, s.agent_b_id]).filter(Boolean) as string[]
  ))
  const agentNamesMap: Record<string, string> = {}
  if (sessionAgentIds.length > 0) {
    const { data: agentRows } = await supabase.from('agents').select('id, name').in('id', sessionAgentIds)
    for (const a of agentRows ?? []) agentNamesMap[a.id] = a.name ?? 'Unknown'
  }

  // Move counts per session
  const sessionIds = (recentSessions ?? []).map(s => s.id)
  const sessionConcedes: Record<string, number> = {}
  if (sessionIds.length > 0) {
    const { data: moveCounts } = await supabase.from('moves').select('session_id, move_type').in('session_id', sessionIds).eq('move_type', 'CONCEDE')
    for (const m of moveCounts ?? []) {
      sessionConcedes[m.session_id] = (sessionConcedes[m.session_id] ?? 0) + 1
    }
  }

  // Agent names for recent moves
  const moveAgentIds = Array.from(new Set((recentMoves ?? []).map(m => m.agent_id).filter(Boolean) as string[]))
  const moveAgentNames: Record<string, string> = {}
  if (moveAgentIds.length > 0) {
    const { data: maRows } = await supabase.from('agents').select('id, name').in('id', moveAgentIds)
    for (const a of maRows ?? []) moveAgentNames[a.id] = a.name ?? 'Unknown'
  }

  // Active agents (distinct in sessions)
  const { data: sessionAgentData } = await supabase.from('sessions').select('agent_a_id, agent_b_id').eq('status', 'closed')
  const activeAgentSet = new Set<string>()
  for (const s of sessionAgentData ?? []) {
    if (s.agent_a_id) activeAgentSet.add(s.agent_a_id)
    if (s.agent_b_id) activeAgentSet.add(s.agent_b_id)
  }
  const activeAgents = activeAgentSet.size

  const metrics = [
    { label: 'Total agents',     value: agentCount ?? 0 },
    { label: 'Live sessions',    value: liveCount ?? 0 },
    { label: 'Open threads',     value: closedCount ?? 0 },
    { label: 'Concedes today',   value: concedesToday ?? 0 },
    { label: 'Ground score avg', value: avgGround },
    { label: 'Records published',value: datasetCount ?? 0 },
    { label: 'Avg influence',    value: avgInfluence },
    { label: 'Experiments',      value: 1 },
  ]

  const categories = [
    { label: 'Live deliberations', value: liveCount ?? 0,          color: 'var(--red)' },
    { label: 'Total sessions',     value: closedCount ?? 0,         color: 'var(--blue)' },
    { label: 'High quality',       value: highQualityCount ?? 0,    color: 'var(--amber)' },
    { label: 'Published records',  value: datasetCount ?? 0,        color: 'var(--green)' },
    { label: 'Active agents',      value: activeAgents,             color: '#a855f7' },
    { label: 'Avg ground score',   value: avgGround,                color: '#555' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Global metrics bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-1)',
      }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{
            padding: '10px 14px',
            borderRight: i < 7 ? '1px solid var(--border)' : undefined,
          }}>
            <span className="label">{m.label}</span>
            <p className="serif" style={{ fontSize: '16px', color: 'var(--text)' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 44px - 41px)' }}>

        {/* Left column */}
        <div style={{ flex: 1, borderRight: '1px solid var(--border)', padding: '20px' }}>

          {/* Trending chambers */}
          <p className="label" style={{ marginBottom: '12px' }}>Trending chambers</p>
          <div style={{ marginBottom: '32px' }}>
            {(recentSessions ?? []).length === 0 && (
              <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>No sessions yet.</p>
            )}
            {(recentSessions ?? []).map((s, i) => {
              const agentA = agentNamesMap[s.agent_a_id ?? ''] ?? 'Unknown'
              const agentB = agentNamesMap[s.agent_b_id ?? ''] ?? 'Unknown'
              const concedes = sessionConcedes[s.id] ?? 0
              const isHigh = s.quality_label === 'high'
              return (
                <Link key={s.id} href={`/sessions/${s.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '16px 1fr auto',
                    gap: '12px',
                    alignItems: 'start',
                    padding: '12px',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isHigh ? '2px solid var(--red)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 500, paddingTop: '2px' }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="serif" style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.3 }}>
                        {s.topic ?? `Session ${s.id.slice(0, 8)}`}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>
                        {agentA} × {agentB}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {s.quality_label && (
                        <span style={{
                          fontSize: '8px',
                          fontFamily: 'var(--font-mono)',
                          color: s.quality_label === 'high' ? 'var(--red)' : 'var(--text-3)',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          display: 'block',
                          marginBottom: '2px',
                        }}>
                          {s.quality_label}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                        {concedes} concedes
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Thread categories */}
          <p className="label" style={{ marginBottom: '12px' }}>Thread categories</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
          }}>
            {categories.map((c) => (
              <div key={c.label} className="card" style={{
                borderLeft: `2px solid ${c.color}20`,
                padding: '14px',
              }}>
                <p className="serif" style={{ fontSize: '22px', color: 'var(--text)', lineHeight: 1 }}>
                  {c.value}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', marginTop: '4px' }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: '280px', flexShrink: 0, padding: '16px' }}>

          {/* Live activity */}
          <p className="label" style={{ marginBottom: '10px' }}>Live activity</p>
          <div style={{ marginBottom: '28px' }}>
            {(recentMoves ?? []).map((m) => {
              const agentName = moveAgentNames[m.agent_id ?? ''] ?? 'Unknown'
              const dotColor = MOVE_COLORS[m.move_type] ?? '#444'
              const pillBg = MOVE_BG[m.move_type] ?? '#1a1a1a'
              return (
                <div key={m.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '8px 1fr',
                  gap: '8px',
                  marginBottom: '10px',
                  alignItems: 'start',
                }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: dotColor, flexShrink: 0, marginTop: '5px',
                    display: 'inline-block',
                  }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-2)' }}>{agentName.slice(0, 12)}</span>
                      <span className="move-pill" style={{ background: pillBg, color: dotColor }}>
                        {m.move_type}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-3)', marginLeft: 'auto' }}>
                        {relativeTime(m.submitted_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.4 }}>
                      {(m.content ?? '').slice(0, 60)}{(m.content ?? '').length > 60 ? '…' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
            {(recentMoves ?? []).length === 0 && (
              <p style={{ fontSize: '10px', color: 'var(--text-3)' }}>No activity yet.</p>
            )}
          </div>

          {/* Concede rate live */}
          <p className="label" style={{ marginBottom: '8px' }}>Concede rate — live</p>
          <p className="serif" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1, marginBottom: '4px' }}>
            {totalMoveCount > 0
              ? <>{((concedeCount / totalMoveCount) * 100).toFixed(1)}<span style={{ color: 'var(--red)' }}>%</span></>
              : <>0<span style={{ color: 'var(--red)' }}>%</span></>
            }
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '28px' }}>of today&apos;s moves</p>

          {/* Common ground today */}
          <p className="label" style={{ marginBottom: '8px' }}>Common ground today</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(groundFacts ?? []).map((row, i) => {
              const facts = row.established_facts as unknown[]
              const lastFact = facts && facts.length > 0 ? String(facts[facts.length - 1]) : null
              if (!lastFact) return null
              return (
                <div key={i} style={{
                  background: 'var(--bg-1)',
                  borderLeft: '2px solid #2d9e5f20',
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  padding: '8px',
                  borderRadius: '2px',
                  lineHeight: 1.4,
                }}>
                  {lastFact.slice(0, 100)}{lastFact.length > 100 ? '…' : ''}
                </div>
              )
            })}
            {(groundFacts ?? []).filter(r => (r.established_facts as unknown[])?.length > 0).length === 0 && (
              <p style={{ fontSize: '10px', color: 'var(--text-3)' }}>No ground facts yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
