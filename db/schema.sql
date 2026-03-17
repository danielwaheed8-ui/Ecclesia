-- ============================================================
-- Ecclesia Schema
-- ============================================================

-- humans
CREATE TABLE humans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_provider  text,
  oauth_id        text,
  username        text,
  trust_score     integer DEFAULT 50,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE humans ENABLE ROW LEVEL SECURITY;

-- agents
CREATE TABLE agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  did           text UNIQUE,
  human_id      uuid REFERENCES humans(id),
  name          text,
  domain        text,
  runtime_type  text,
  webhook_url   text,
  trust_tier    text DEFAULT 'standard',
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- sessions
CREATE TABLE sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_a_id     uuid REFERENCES agents(id),
  agent_b_id     uuid REFERENCES agents(id),
  topic          text,
  status         text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  quality_label  text,
  created_at     timestamptz DEFAULT now(),
  closed_at      timestamptz
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- moves
CREATE TABLE moves (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid REFERENCES sessions(id),
  agent_id           uuid REFERENCES agents(id),
  move_type          text CHECK (move_type IN ('ASSERT', 'CHALLENGE', 'BUILD', 'CONCEDE', 'REFRAME')),
  content            text,
  references_move_id uuid REFERENCES moves(id),
  submitted_at       timestamptz DEFAULT now()
);
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- positions
CREATE TABLE positions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid REFERENCES sessions(id),
  agent_id       uuid REFERENCES agents(id),
  position_type  text CHECK (position_type IN ('opening', 'closing')),
  content        text,
  submitted_at   timestamptz DEFAULT now()
);
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- relationship_store
CREATE TABLE relationship_store (
  pair_id                text PRIMARY KEY,
  agent_a_id             uuid REFERENCES agents(id),
  agent_b_id             uuid REFERENCES agents(id),
  interaction_count      integer DEFAULT 0,
  mutual_influence_score float DEFAULT 0,
  shared_vocabulary      jsonb DEFAULT '{}',
  context_summary        text,
  last_exchange_at       timestamptz
);
ALTER TABLE relationship_store ENABLE ROW LEVEL SECURITY;

-- common_ground
CREATE TABLE common_ground (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id           text REFERENCES relationship_store(pair_id),
  established_facts jsonb DEFAULT '[]',
  agreed_terms      jsonb DEFAULT '{}',
  joint_decisions   jsonb DEFAULT '[]',
  open_questions    jsonb DEFAULT '[]',
  ground_score      float DEFAULT 0,
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE common_ground ENABLE ROW LEVEL SECURITY;

-- dataset_records
CREATE TABLE dataset_records (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid REFERENCES sessions(id),
  move_distribution  jsonb,
  opening_positions  jsonb,
  closing_positions  jsonb,
  concede_count      integer DEFAULT 0,
  ground_delta       float DEFAULT 0,
  models_used        jsonb,
  quality_label      text,
  pushed_to_hf       boolean DEFAULT false,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE dataset_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX ON agents(human_id);
CREATE INDEX ON sessions(agent_a_id);
CREATE INDEX ON sessions(agent_b_id);
CREATE INDEX ON moves(session_id);
CREATE INDEX ON positions(session_id);
CREATE INDEX ON relationship_store(agent_a_id);
CREATE INDEX ON relationship_store(agent_b_id);
