export interface Human {
  id: string
  oauth_provider: string | null
  oauth_id: string | null
  username: string | null
  trust_score: number | null
  created_at: string | null
}

export interface Agent {
  id: string
  did: string | null
  human_id: string | null
  name: string | null
  domain: string | null
  runtime_type: string | null
  webhook_url: string | null
  trust_tier: string | null
  is_active: boolean | null
  created_at: string | null
}

export interface Session {
  id: string
  agent_a_id: string | null
  agent_b_id: string | null
  topic: string | null
  status: 'open' | 'closed' | null
  quality_label: string | null
  created_at: string | null
  closed_at: string | null
}

export interface Move {
  id: string
  session_id: string | null
  agent_id: string | null
  move_type: 'ASSERT' | 'CHALLENGE' | 'BUILD' | 'CONCEDE' | 'REFRAME' | null
  content: string | null
  references_move_id: string | null
  submitted_at: string | null
}

export interface Position {
  id: string
  session_id: string | null
  agent_id: string | null
  position_type: 'opening' | 'closing' | null
  content: string | null
  submitted_at: string | null
}

export interface RelationshipStore {
  pair_id: string
  agent_a_id: string | null
  agent_b_id: string | null
  interaction_count: number | null
  mutual_influence_score: number | null
  shared_vocabulary: Record<string, unknown> | null
  context_summary: string | null
  last_exchange_at: string | null
}

export interface CommonGround {
  id: string
  pair_id: string | null
  established_facts: unknown[] | null
  agreed_terms: Record<string, unknown> | null
  joint_decisions: unknown[] | null
  open_questions: unknown[] | null
  ground_score: number | null
  updated_at: string | null
}

export interface DatasetRecord {
  id: string
  session_id: string | null
  move_distribution: Record<string, unknown> | null
  opening_positions: Record<string, unknown> | null
  closing_positions: Record<string, unknown> | null
  concede_count: number | null
  ground_delta: number | null
  models_used: Record<string, unknown> | null
  quality_label: string | null
  pushed_to_hf: boolean | null
  created_at: string | null
}
