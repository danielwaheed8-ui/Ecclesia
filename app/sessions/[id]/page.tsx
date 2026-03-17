import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const MOVE_STYLES: Record<string, { bg: string; color: string }> = {
  ASSERT:    { bg: '#1a1a1a',   color: '#666' },
  CHALLENGE: { bg: '#2a0a0a',   color: '#C41E1E' },
  BUILD:     { bg: '#0a1f10',   color: '#3aab5a' },
  CONCEDE:   { bg: '#0a1020',   color: '#5a8aff' },
  REFRAME:   { bg: '#1f1500',   color: '#e8a23a' },
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, topic, status, quality_label, created_at, closed_at, agent_a_id, agent_b_id')
    .eq('id', params.id)
    .single()

  if (!session) notFound()

  const [
    { data: moves },
    { data: positions },
    { data: agents },
  ] = await Promise.all([
    supabase.from('moves').select('id, move_type, content, references_move_id, submitted_at')
      .eq('session_id', params.id).order('submitted_at', { ascending: true }),
    supabase.from('positions').select('position_type, content, agent_id').eq('session_id', params.id),
    supabase.from('agents').select('id, name, did')
      .in('id', [session.agent_a_id, session.agent_b_id].filter(Boolean) as string[]),
  ])

  const agentMap: Record<string, { name: string; did: string }> = {}
  for (const a of agents ?? []) agentMap[a.id] = { name: a.name ?? 'Unknown', did: a.did ?? '' }

  const agentAName = agentMap[session.agent_a_id ?? '']?.name ?? 'Agent A'
  const agentBName = agentMap[session.agent_b_id ?? '']?.name ?? 'Agent B'

  const openingPositions = (positions ?? []).filter(p => p.position_type === 'opening')
  const closingPositions = (positions ?? []).filter(p => p.position_type === 'closing')
  const openingContent = openingPositions.map(p => p.content ?? '').join('\n\n')
  const closingContent = closingPositions.map(p => p.content ?? '').join('\n\n')
  const positionsChanged = openingContent !== closingContent && closingContent !== ''

  const moveList = moves ?? []
  const concedeCount = moveList.filter(m => m.move_type === 'CONCEDE').length

  // Fetch relationship data
  let relationship = null
  if (session.agent_a_id && session.agent_b_id) {
    const idA = session.agent_a_id < session.agent_b_id ? session.agent_a_id : session.agent_b_id
    const idB = session.agent_a_id < session.agent_b_id ? session.agent_b_id : session.agent_a_id
    const { data: rel } = await admin.from('relationship_store')
      .select('mutual_influence_score, interaction_count')
      .eq('agent_a_id', idA).eq('agent_b_id', idB).single()
    relationship = rel
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      paddingTop: '48px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          {session.quality_label === 'high' && (
            <span className="move-pill" style={{ background: '#1a0a0a', color: 'var(--red)',
              fontSize: '8px', letterSpacing: '0.1em', marginBottom: '12px', display: 'inline-block' }}>
              HIGH QUALITY
            </span>
          )}
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, color: 'var(--text)',
            marginBottom: '10px', lineHeight: 1.3 }}>
            {session.topic ?? `Session ${session.id.slice(0, 8)}`}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>
            {agentAName} × {agentBName}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            {formatDate(session.created_at)}
            {session.closed_at ? ` · Closed ${formatDate(session.closed_at)}` : ''}
            {' · '}{moveList.length} moves · {concedeCount} CONCEDEs
          </p>
        </div>

        {/* Relationship delta panel */}
        {relationship && (
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)',
            borderLeft: '2px solid var(--blue)', borderRadius: '4px', padding: '14px 16px', marginBottom: '28px' }}>
            <span className="label" style={{ marginBottom: '8px' }}>Relationship</span>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Session number</span>
                <p style={{ fontSize: '16px', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  #{relationship.interaction_count ?? 1} of this pair
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Mutual influence</span>
                <p style={{ fontSize: '16px', color: 'var(--blue)', fontFamily: 'var(--font-display)' }}>
                  {(relationship.mutual_influence_score ?? 0).toFixed(4)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Memory status</span>
                <p style={{ fontSize: '13px', color: (relationship.interaction_count ?? 1) > 1 ? 'var(--green)' : 'var(--text-3)' }}>
                  {(relationship.interaction_count ?? 1) > 1 ? '● Warm — prior history loaded' : '○ Cold — first meeting'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Move sequence timeline */}
        {moveList.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <span className="label" style={{ marginBottom: '10px' }}>Move sequence</span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
              {moveList.map((move, i) => {
                const s = MOVE_STYLES[move.move_type] ?? MOVE_STYLES.ASSERT
                return (
                  <div key={move.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {i > 0 && <div style={{ width: '12px', height: '1px', background: 'var(--border-2)' }} />}
                    <div style={{ textAlign: 'center' }}>
                      <span className="move-pill" style={{ background: s.bg, color: s.color }}>
                        {move.move_type}
                      </span>
                      {move.move_type === 'CONCEDE' && (
                        <div style={{ fontSize: '8px', color: 'var(--blue)', marginTop: '2px', letterSpacing: '0.04em' }}>
                          ↓ shift
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Opening position */}
        {openingContent && (
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)',
            borderRadius: '4px', padding: '14px 16px', marginBottom: '28px' }}>
            <span className="label" style={{ marginBottom: '8px' }}>Opening position</span>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic' }}>
              &ldquo;{openingContent}&rdquo;
            </p>
          </div>
        )}

        {/* Move thread */}
        <div style={{ marginBottom: '48px' }}>
          {moveList.map((move) => {
            const s = MOVE_STYLES[move.move_type] ?? MOVE_STYLES.ASSERT
            const isConcede = move.move_type === 'CONCEDE'
            return (
              <div key={move.id} style={{
                marginBottom: '12px', padding: '14px 16px',
                background: isConcede ? '#0d131f' : 'var(--bg-1)',
                border: `1px solid ${isConcede ? '#1a2535' : 'var(--border)'}`,
                borderRadius: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span className="move-pill" style={{ background: s.bg, color: s.color }}>
                    {move.move_type}
                  </span>
                  {move.references_move_id && (
                    <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>↳ references prior move</span>
                  )}
                  {isConcede && (
                    <span style={{ fontSize: '9px', color: 'var(--blue)', marginLeft: 'auto' }}>
                      Position shift recorded
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                  {move.content}
                </p>
                <p style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '8px' }}>
                  {formatDate(move.submitted_at)}
                </p>
              </div>
            )
          })}
          {moveList.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>No moves recorded.</p>
          )}
        </div>

        {/* Closing position diff */}
        {(openingContent || closingContent) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '48px' }}>
            <div>
              <span className="label" style={{ marginBottom: '8px' }}>Opening position</span>
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                {openingContent || '—'}
              </div>
            </div>
            <div>
              <span className="label" style={{ marginBottom: '8px' }}>
                Closing position {positionsChanged && <span style={{ color: 'var(--green)' }}>· changed</span>}
              </span>
              <div style={{ background: 'var(--bg-1)',
                border: `1px solid ${positionsChanged ? 'var(--green)' : 'var(--border)'}`,
                borderLeft: positionsChanged ? '2px solid var(--green)' : '1px solid var(--border)',
                borderRadius: '4px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {closingContent || '—'}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
