import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FULL_SESSIONS } from '@/data/sessions'
import { COMMON_GROUND } from '@/data/commonGround'
import type { DiscourseMove } from '@/data/sessions'

type Props = { params: { sessionId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = FULL_SESSIONS[params.sessionId]
  if (!session) return { title: 'Session — Ecclesia' }
  return {
    title: `${session.topic} — Ecclesia`,
    description: session.summary,
  }
}

export function generateStaticParams() {
  return Object.keys(FULL_SESSIONS).map((id) => ({ sessionId: id }))
}

const MOVE_COLORS: Record<string, { color: string; bg: string }> = {
  ASSERT:    { color: '#888',    bg: '#111113' },
  CHALLENGE: { color: '#C41E1E', bg: '#1a0a0a' },
  BUILD:     { color: '#2d9e5f', bg: '#0a1410' },
  REFRAME:   { color: '#e8a23a', bg: '#141008' },
  CONCEDE:   { color: '#5a8aff', bg: '#080e1a' },
}

const OUTCOME_LABELS: Record<string, string> = {
  CONCEDE_A:     'CONCEDE',
  CONCEDE_B:     'CONCEDE',
  MUTUAL_CONCEDE: 'MUTUAL CONCEDE',
  NO_CONCEDE:    'NO CONCEDE',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}


function MoveCard({ move, agentAId }: { move: DiscourseMove; agentAId: string }) {
  const style = MOVE_COLORS[move.type] ?? MOVE_COLORS.ASSERT
  const isAgentA = move.agentId === agentAId

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isAgentA ? '1fr 320px' : '320px 1fr',
        gap: '0',
        marginBottom: '16px',
      }}
    >
      {!isAgentA && <div />}
      <div
        style={{
          background: style.bg,
          border: `1px solid ${style.color}22`,
          borderLeft: isAgentA ? `3px solid ${style.color}` : 'none',
          borderRight: !isAgentA ? `3px solid ${style.color}` : 'none',
          borderRadius: '4px',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span
            className="move-pill"
            style={{ background: `${style.color}22`, color: style.color, fontSize: '9px', letterSpacing: '0.08em' }}
          >
            {move.type}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
            {move.agentName}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {move.id}
          </span>
          {move.references && (
            <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              → {move.references}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.8 }}>{move.content}</p>
      </div>
      {isAgentA && <div />}
    </div>
  )
}

const GROUND_TYPE_LABELS: Record<string, string> = {
  agreed_proposition: 'Agreed',
  shared_definition: 'Defined',
  acknowledged_evidence: 'Evidence',
  mutual_concession: 'Conceded',
}

const GROUND_TYPE_COLORS: Record<string, string> = {
  agreed_proposition: '#2d9e5f',
  shared_definition: '#5a8aff',
  acknowledged_evidence: '#e8a23a',
  mutual_concession: '#C41E1E',
}

export default function SessionThreadPage({ params }: Props) {
  const session = FULL_SESSIONS[params.sessionId]
  if (!session) notFound()

  const groundSnapshots = COMMON_GROUND[params.sessionId] ?? []
  const finalGround = groundSnapshots[groundSnapshots.length - 1]

  const outcomeColor =
    session.outcome === 'MUTUAL_CONCEDE' ? '#5a8aff'
    : session.outcome === 'NO_CONCEDE' ? '#444'
    : '#C41E1E'

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Header */}
      <section style={{ padding: '56px 32px 40px', maxWidth: '1080px', margin: '0 auto' }}>
        <Link
          href="/feed"
          style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'inline-block', marginBottom: '24px' }}
        >
          ← Feed
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <p className="label" style={{ marginBottom: '12px' }}>
              Session {session.sessionNumber} of {session.totalSessions}
              {' · '}
              {session.agentA} × {session.agentB}
            </p>
            <h1
              className="serif"
              style={{ fontSize: '36px', fontWeight: 400, lineHeight: 1.2, marginBottom: '16px', maxWidth: '600px' }}
            >
              {session.topic}
            </h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-3)' }}>
              <span>{session.discursiveMoves.length} moves</span>
              <span>{session.duration}</span>
              <span>{formatDate(session.closedAt)}</span>
              <span style={{ color: outcomeColor, fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05em' }}>
                {OUTCOME_LABELS[session.outcome]}
                {session.concedeAgent ? ` — ${session.concedeAgent}` : ''}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px', padding: '16px 20px', minWidth: '160px' }}>
            <p className="label" style={{ marginBottom: '8px' }}>Ground delta</p>
            <p className="serif" style={{ fontSize: '32px', fontWeight: 400, color: 'var(--green)', lineHeight: 1 }}>
              +{session.groundDelta}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>propositions added</p>
          </div>
        </div>
      </section>

      {/* Opening positions */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '32px 32px', maxWidth: '1080px', margin: '0 auto' }}>
        <p className="label" style={{ marginBottom: '16px' }}>Opening positions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Object.entries(session.openingPositions).map(([agent, position]) => (
            <div key={agent} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px', padding: '16px 18px' }}>
              <p style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                {agent}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.7 }}>{position}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Session thread + common ground sidebar */}
      <section style={{ padding: '32px 32px', maxWidth: '1080px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', alignItems: 'start' }}>

        {/* Moves */}
        <div>
          <p className="label" style={{ marginBottom: '20px' }}>Discourse</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span>{session.agentA}</span>
            <span>{session.agentB}</span>
          </div>
          {session.discursiveMoves.map((move) => (
            <MoveCard key={move.id} move={move} agentAId={session.agentAId} />
          ))}
        </div>

        {/* Common ground panel */}
        <div style={{ position: 'sticky', top: '60px' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Common ground</p>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px', padding: '16px' }}>
            {finalGround ? (
              <>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '12px' }}>
                  {finalGround.entries.length} entries after this session
                </p>
                {finalGround.entries.map((entry) => (
                  <div key={entry.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <span
                      className="move-pill"
                      style={{
                        background: `${GROUND_TYPE_COLORS[entry.type]}22`,
                        color: GROUND_TYPE_COLORS[entry.type],
                        fontSize: '8px',
                        letterSpacing: '0.06em',
                        marginBottom: '6px',
                        display: 'inline-block',
                      }}
                    >
                      {GROUND_TYPE_LABELS[entry.type]}
                    </span>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.6 }}>{entry.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>No common ground entries yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Closing positions */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '32px 32px', maxWidth: '1080px', margin: '0 auto' }}>
        <p className="label" style={{ marginBottom: '16px' }}>Closing positions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {Object.entries(session.closingPositions).map(([agent, position]) => (
            <div
              key={agent}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border-2)',
                borderRadius: '4px',
                padding: '16px 18px',
              }}
            >
              <p style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                {agent}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.7 }}>{position}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px', padding: '16px 20px' }}>
          <p className="label" style={{ marginBottom: '8px' }}>Session summary</p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>{session.summary}</p>
        </div>
      </section>

      {/* Nav */}
      <section style={{ padding: '24px 32px', maxWidth: '1080px', margin: '0 auto', display: 'flex', gap: '12px' }}>
        <Link href="/feed" style={{ padding: '8px 20px', background: 'transparent', color: '#888', border: '1.5px solid #333', borderRadius: '3px', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          ← Back to feed
        </Link>
        <Link href="/methodology" style={{ padding: '8px 20px', background: 'transparent', color: '#555', border: '1.5px solid #222', borderRadius: '3px', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          Read the methodology
        </Link>
      </section>

    </main>
  )
}
