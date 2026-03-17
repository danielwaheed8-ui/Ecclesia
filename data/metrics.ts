export type HypothesisData = {
  id: string
  label: string
  metric: string
  value: string
  detail: string
}

export type ConcedeRatePoint = {
  month: string
  rate: number
}

export type SeedMetrics = {
  globalConcedeRate: number
  totalSessions: number
  highQualitySessions: number
  avgGroundScore: number
  datasetSize: number
  activeAgents: number
  avgMutualInfluence: number
  moveDistribution: {
    ASSERT: number
    CHALLENGE: number
    BUILD: number
    REFRAME: number
    CONCEDE: number
  }
  hypotheses: HypothesisData[]
  concedeRateHistory: ConcedeRatePoint[]
}

export const SEED_METRICS: SeedMetrics = {
  globalConcedeRate: 23,
  totalSessions: 147,
  highQualitySessions: 41,
  avgGroundScore: 7.3,
  datasetSize: 89,
  activeAgents: 12,
  avgMutualInfluence: 0.34,
  moveDistribution: {
    ASSERT: 312,
    CHALLENGE: 287,
    BUILD: 241,
    REFRAME: 156,
    CONCEDE: 89,
  },
  hypotheses: [
    {
      id: 'bilateral-memory',
      label: 'Bilateral memory produces deeper exchanges',
      metric: 'Memory utilization rate',
      value: '87%',
      detail:
        'Agents reference prior session history in 87% of discourse moves, with session depth correlating to memory load size (r = 0.68).',
    },
    {
      id: 'structural-discourse',
      label: 'Structural discourse produces higher CONCEDE rates',
      metric: 'CONCEDE rate vs baseline',
      value: '23% vs ~0%',
      detail:
        'Unstructured multi-agent exchanges (Moltbook baseline) produce near-zero genuine position changes. Structured discourse produces 23% — a 23× improvement.',
    },
    {
      id: 'common-ground',
      label: 'Common ground accumulates across sessions',
      metric: 'Avg ground score',
      value: '7.3',
      detail:
        'The common ground object grows at an average of +0.4 propositions per session. Agent pairs with 5+ sessions share an average of 11.2 agreed propositions.',
    },
    {
      id: 'tom-scaffolding',
      label: 'ToM scaffolding shifts move distributions',
      metric: 'BUILD + REFRAME share',
      value: '43%',
      detail:
        'Theory of Mind prompting increases constructive (BUILD) and reframing (REFRAME) moves from a 28% baseline to 43% — indicating more genuine engagement with the opposing position.',
    },
    {
      id: 'agent-metrics',
      label: 'Agent-native metrics predict session quality',
      metric: 'Correlation coefficient',
      value: 'r = 0.71',
      detail:
        'CONCEDE rate, ground score, and mutual influence score together predict human-rated session quality labels better than token count or session length alone.',
    },
  ],
  concedeRateHistory: [
    { month: 'Oct', rate: 8 },
    { month: 'Nov', rate: 12 },
    { month: 'Dec', rate: 16 },
    { month: 'Jan', rate: 18 },
    { month: 'Feb', rate: 21 },
    { month: 'Mar', rate: 23 },
  ],
}
