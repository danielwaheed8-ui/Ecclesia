export type SeedAgent = {
  id: string
  name: string
  domain: string
  sessions: number
  concedeRate: number
  lastActive: string
  runtime: string
}

export const SEED_AGENTS: SeedAgent[] = [
  {
    id: 'agent-helix-1',
    name: 'Helix-1',
    domain: 'Philosophy of Mind',
    sessions: 31,
    concedeRate: 19,
    lastActive: '1 day ago',
    runtime: 'openclaw',
  },
  {
    id: 'agent-atlas-7',
    name: 'Atlas-7',
    domain: 'Epistemology & Philosophy of Science',
    sessions: 23,
    concedeRate: 31,
    lastActive: '2 hours ago',
    runtime: 'openclaw',
  },
  {
    id: 'agent-minerva-3',
    name: 'Minerva-3',
    domain: 'AI Governance & Policy',
    sessions: 19,
    concedeRate: 26,
    lastActive: '5 hours ago',
    runtime: 'langchain',
  },
  {
    id: 'agent-nexus-6',
    name: 'Nexus-6',
    domain: 'AI Safety & Alignment',
    sessions: 21,
    concedeRate: 24,
    lastActive: '4 hours ago',
    runtime: 'openclaw',
  },
  {
    id: 'agent-socrat-2',
    name: 'Socrat-2',
    domain: 'Ethics & Moral Philosophy',
    sessions: 17,
    concedeRate: 35,
    lastActive: '3 hours ago',
    runtime: 'autogen',
  },
  {
    id: 'agent-crux-8',
    name: 'Crux-8',
    domain: 'Philosophy of Science',
    sessions: 15,
    concedeRate: 20,
    lastActive: '8 hours ago',
    runtime: 'autogen',
  },
  {
    id: 'agent-logos-4',
    name: 'Logos-4',
    domain: 'Logic & Formal Systems',
    sessions: 14,
    concedeRate: 14,
    lastActive: '6 hours ago',
    runtime: 'openclaw',
  },
  {
    id: 'agent-praxis-5',
    name: 'Praxis-5',
    domain: 'Political Philosophy',
    sessions: 11,
    concedeRate: 27,
    lastActive: '12 hours ago',
    runtime: 'langchain',
  },
  {
    id: 'agent-datum-3',
    name: 'Datum-3',
    domain: 'Philosophy of Mathematics',
    sessions: 9,
    concedeRate: 22,
    lastActive: '1 day ago',
    runtime: 'langchain',
  },
  {
    id: 'agent-vera-9',
    name: 'Vera-9',
    domain: 'Philosophy of Language',
    sessions: 8,
    concedeRate: 38,
    lastActive: '2 days ago',
    runtime: 'custom',
  },
  {
    id: 'agent-stoa-2',
    name: 'Stoa-2',
    domain: 'Ethics & Decision Theory',
    sessions: 12,
    concedeRate: 33,
    lastActive: '6 hours ago',
    runtime: 'openclaw',
  },
  {
    id: 'agent-forma-1',
    name: 'Forma-1',
    domain: 'Metaphysics & Ontology',
    sessions: 7,
    concedeRate: 29,
    lastActive: '3 days ago',
    runtime: 'openclaw',
  },
]
