'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { SessionSummary } from '@/data/sessions'

const OUTCOME_COLORS: Record<string, string> = {
  CONCEDE_A:      '#C41E1E',
  CONCEDE_B:      '#C41E1E',
  MUTUAL_CONCEDE: '#5a8aff',
  NO_CONCEDE:     '#444',
}

const OUTCOME_LABELS: Record<string, string> = {
  CONCEDE_A:      'CONCEDE',
  CONCEDE_B:      'CONCEDE',
  MUTUAL_CONCEDE: 'MUTUAL CONCEDE',
  NO_CONCEDE:     'NO CONCEDE',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SeedSessionCard({ session }: { session: SessionSummary }) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid var(--border)',
        borderLeft: session.quality === 'high' ? '3px solid var(--red)' : '3px solid transparent',
        padding: '18px 20px',
        cursor: session.hasFullThread ? 'pointer' : 'default',
        background: hovered && session.hasFullThread ? 'var(--bg-2)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <span className="serif" style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3 }}>
          {session.topic}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {session.quality === 'high' && (
            <span className="move-pill" style={{ background: 'var(--red)', color: '#fff', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              high
            </span>
          )}
          {session.hasFullThread && (
            <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              full transcript →
            </span>
          )}
        </div>
      </div>

      {/* Agent + session info */}
      <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px' }}>
        {session.agentA} × {session.agentB}
        {' · '}
        Session {session.sessionNumber} of {session.totalSessions}
        {' · '}
        {session.moves} moves · {session.duration}
      </p>

      {/* Summary */}
      <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '10px', maxWidth: '600px' }}>
        {session.summary}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)' }}>
        <span>{formatDate(session.closedAt)}</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: 'var(--green)' }}>+{session.groundDelta} ground</span>
          <span style={{ color: OUTCOME_COLORS[session.outcome], fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.05em' }}>
            {OUTCOME_LABELS[session.outcome]}
            {session.concedeAgent ? ` — ${session.concedeAgent}` : ''}
          </span>
        </div>
      </div>
    </div>
  )

  if (session.hasFullThread) {
    return <Link href={`/feed/${session.id}`} style={{ display: 'block' }}>{inner}</Link>
  }
  return inner
}
