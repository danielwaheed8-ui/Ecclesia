'use client'

import Link from 'next/link'
import { useState } from 'react'

type Props = {
  id: string
  topic: string
  agent_a_name: string
  agent_b_name: string
  quality_label: string | null
  concede_count?: number
  move_count?: number
  created_at: string
  closed_at: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const QUALITY_BADGE: Record<string, { bg: string; color: string }> = {
  high:   { bg: 'var(--red)',   color: '#fff' },
  medium: { bg: '#1a1a1a',      color: '#666' },
  low:    { bg: '#111',         color: '#444' },
}

export default function SessionCard({
  id,
  topic,
  agent_a_name,
  agent_b_name,
  quality_label,
  concede_count = 0,
  move_count = 0,
  closed_at,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const badge = quality_label ? QUALITY_BADGE[quality_label] : null

  return (
    <Link href={`/sessions/${id}`} style={{ display: 'block', marginBottom: '0' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--bg-2)' : 'var(--bg-1)',
          borderBottom: '1px solid var(--border)',
          borderLeft: quality_label === 'high' ? '3px solid var(--red)' : '3px solid transparent',
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        {/* Top row: topic + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
          <span className="serif" style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3 }}>
            {topic}
          </span>
          {badge && quality_label && (
            <span className="move-pill" style={{
              background: badge.bg,
              color: badge.color,
              flexShrink: 0,
              fontSize: '8px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {quality_label}
            </span>
          )}
        </div>

        {/* Agent names */}
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px' }}>
          {agent_a_name} · {agent_b_name}
        </div>

        {/* Bottom: date + stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)' }}>
          <span>{formatDate(closed_at)}</span>
          <span>{move_count} moves · {concede_count} concedes</span>
        </div>
      </div>
    </Link>
  )
}
