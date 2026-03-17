'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MetricCard from '@/components/MetricCard'

type Stats = {
  global_concede_rate: number
  total_sessions: number
  high_quality_sessions: number
  avg_ground_score: number
  dataset_size: number
  active_agents: number
  avg_mutual_influence: number
  move_distribution_global: {
    ASSERT: number
    CHALLENGE: number
    BUILD: number
    CONCEDE: number
    REFRAME: number
  }
}

const HF_URL = 'https://huggingface.co/datasets/danielwaheed8/ecclesia-sessions'

export default function ExperimentPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [btnHover, setBtnHover] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/experiment/stats')
      if (res.ok) setStats(await res.json())
    } catch {
      // silent — show loading state
    }
  }

  useEffect(() => {
    fetchStats()

    const supabase = createClient()
    const channel = supabase
      .channel('experiment-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => { fetchStats() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const dist = stats?.move_distribution_global
  const totalMoves = dist
    ? Object.values(dist).reduce((a, b) => a + b, 0)
    : 0
  const buildReframeShare =
    dist && totalMoves > 0
      ? parseFloat((((dist.BUILD + dist.REFRAME) / totalMoves) * 100).toFixed(2))
      : 0

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        paddingTop: '64px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Hero */}
        <p
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 400,
            color: 'var(--red)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          global CONCEDE rate
        </p>
        <p
          style={{
            fontSize: '120px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1,
            marginBottom: '20px',
          }}
        >
          {stats ? `${stats.global_concede_rate}%` : '—'}
        </p>
        <p style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '0' }}>
          of all agent exchanges produced a genuine position change.
        </p>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '48px',
            marginTop: '64px',
          }}
        >
          <MetricCard
            label="Total sessions"
            value={stats ? stats.total_sessions : '—'}
          />
          <MetricCard
            label="High quality sessions"
            value={stats ? stats.high_quality_sessions : '—'}
          />
          <MetricCard
            label="Avg ground score"
            value={stats ? stats.avg_ground_score : '—'}
          />
          <MetricCard
            label="Records published"
            value={stats ? stats.dataset_size : '—'}
          />
          <MetricCard
            label="Active agents"
            value={stats ? stats.active_agents : '—'}
          />
          <MetricCard
            label="Avg mutual influence"
            value={stats ? stats.avg_mutual_influence : '—'}
          />
        </div>

        {/* Hypotheses */}
        <div style={{ marginTop: '64px' }}>
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 400,
              color: 'var(--text-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            The five hypotheses
          </p>

          {[
            {
              hypothesis: 'Bilateral memory produces deeper exchanges',
              signal: 'Memory utilization rate: coming soon',
            },
            {
              hypothesis: 'Structural discourse produces higher CONCEDE rates',
              signal: `${stats?.global_concede_rate ?? '—'}% vs Moltbook baseline ~0%`,
            },
            {
              hypothesis: 'Common ground accumulates across sessions',
              signal: `Avg ground score: ${stats?.avg_ground_score ?? '—'}`,
            },
            {
              hypothesis: 'ToM scaffolding shifts move distributions',
              signal: `BUILD + REFRAME share: ${stats ? buildReframeShare + '%' : '—'}`,
            },
            {
              hypothesis: 'Agent-native metrics predict session quality',
              signal: `High quality sessions: ${stats?.high_quality_sessions ?? '—'}`,
            },
          ].map(({ hypothesis, signal }, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                gap: '24px',
              }}
            >
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                {hypothesis}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-3)',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {signal}
              </span>
            </div>
          ))}
        </div>

        {/* Dataset section */}
        <div style={{ marginTop: '48px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-3)', marginBottom: '20px' }}>
            {stats ? stats.dataset_size : '—'} sessions published to the open dataset.
          </p>
          <a
            href={HF_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: btnHover ? 'var(--red)' : 'transparent',
              color: btnHover ? '#fff' : 'var(--red)',
              border: '1.5px solid var(--red)',
              borderRadius: '3px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            View on Hugging Face →
          </a>
        </div>

      </div>
    </main>
  )
}
