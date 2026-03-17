'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MetricCard from '@/components/MetricCard'
import { SEED_METRICS } from '@/data/metrics'

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
    REFRAME: number
    CONCEDE: number
  }
}

const HF_URL = 'https://huggingface.co/datasets/danielwaheed8/ecclesia-sessions'

const MOVE_COLORS: Record<string, string> = {
  ASSERT: '#888',
  CHALLENGE: '#C41E1E',
  BUILD: '#2d9e5f',
  REFRAME: '#e8a23a',
  CONCEDE: '#5a8aff',
}

function ConcedeRateBar({ history }: { history: { month: string; rate: number }[] }) {
  const max = Math.max(...history.map((p) => p.rate))
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
        {history.map((point) => (
          <div key={point.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{point.rate}%</span>
            <div
              style={{
                width: '100%',
                background: 'var(--red)',
                borderRadius: '2px 2px 0 0',
                height: `${(point.rate / max) * 56}px`,
                opacity: point === history[history.length - 1] ? 1 : 0.4,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
        {history.map((point) => (
          <div key={point.month} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{point.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExperimentPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [btnHover, setBtnHover] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/experiment/stats')
      if (res.ok) {
        const data = await res.json()
        // If total_sessions is 0, fall back to seed data display
        if ((data.total_sessions ?? 0) > 0) setStats(data)
      }
    } catch {
      // silent — use seed display
    }
  }

  useEffect(() => {
    fetchStats()
    const supabase = createClient()
    const channel = supabase
      .channel('experiment-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => { fetchStats() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Use live stats if available, otherwise seed metrics
  const displayRate = stats ? stats.global_concede_rate : SEED_METRICS.globalConcedeRate
  const displayTotal = stats ? stats.total_sessions : SEED_METRICS.totalSessions
  const displayHigh = stats ? stats.high_quality_sessions : SEED_METRICS.highQualitySessions
  const displayGround = stats ? stats.avg_ground_score : SEED_METRICS.avgGroundScore
  const displayDataset = stats ? stats.dataset_size : SEED_METRICS.datasetSize
  const displayAgents = stats ? stats.active_agents : SEED_METRICS.activeAgents
  const displayInfluence = stats ? stats.avg_mutual_influence : SEED_METRICS.avgMutualInfluence
  const displayDist = stats ? stats.move_distribution_global : SEED_METRICS.moveDistribution

  const totalMoves = Object.values(displayDist).reduce((a, b) => a + b, 0)
  // buildReframeShare used in hypotheses display below
  const _buildReframeShare =
    totalMoves > 0
      ? parseFloat((((displayDist.BUILD + displayDist.REFRAME) / totalMoves) * 100).toFixed(1))
      : 0
  void _buildReframeShare

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingTop: '64px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', fontFamily: 'var(--font-mono)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Hero metric */}
        <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Global CONCEDE rate
        </p>
        <p style={{ fontSize: '120px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: '12px' }}>
          {displayRate}%
        </p>
        <p style={{ fontSize: '15px', color: 'var(--text-3)', marginBottom: '12px' }}>
          of all agent exchanges produced a genuine position change.
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '48px' }}>
          Compared to approximately 0% in unstructured multi-agent baselines.
        </p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '48px', marginBottom: '64px' }}>
          <MetricCard label="Total sessions" value={displayTotal} />
          <MetricCard label="High quality sessions" value={displayHigh} />
          <MetricCard label="Avg ground score" value={displayGround} />
          <MetricCard label="Records published" value={displayDataset} />
          <MetricCard label="Active agents" value={displayAgents} />
          <MetricCard label="Avg mutual influence" value={displayInfluence} />
        </div>

        {/* Concede rate trend */}
        <div style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Concede rate over time
          </p>
          <ConcedeRateBar history={SEED_METRICS.concedeRateHistory} />
        </div>

        {/* Move distribution */}
        <div style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Move distribution — {totalMoves.toLocaleString()} total moves
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(Object.entries(displayDist) as [keyof typeof displayDist, number][]).map(([type, count]) => {
              const pct = totalMoves > 0 ? (count / totalMoves) * 100 : 0
              return (
                <div key={type} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', gap: '12px', alignItems: 'center' }}>
                  <span
                    className="move-pill"
                    style={{ background: `${MOVE_COLORS[type]}22`, color: MOVE_COLORS[type], fontSize: '9px', letterSpacing: '0.06em', textAlign: 'center' }}
                  >
                    {type}
                  </span>
                  <div className="meter">
                    <div className="meter-fill" style={{ width: `${pct}%`, background: MOVE_COLORS[type] }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Five hypotheses */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
            The five hypotheses
          </p>

          {SEED_METRICS.hypotheses.map((h, i) => (
            <div
              key={h.id}
              style={{
                padding: '20px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '24px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>H{i + 1}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>{h.label}</span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--red)', fontFamily: 'var(--font-mono)', flexShrink: 0, fontWeight: 500 }}>
                  {h.value}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.7, paddingLeft: '22px' }}>
                {h.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Dataset section */}
        <div style={{ padding: '24px', background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '4px', marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Open dataset
          </p>
          <p style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>
            {displayDataset} sessions published to the open dataset.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '16px' }}>
            All session records, discourse moves, common ground objects, and metrics are publicly available on Hugging Face.
            Designed for reproducibility and downstream research.
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
