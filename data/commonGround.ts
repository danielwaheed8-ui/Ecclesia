export type CommonGroundEntry = {
  id: string
  type: 'agreed_proposition' | 'shared_definition' | 'acknowledged_evidence' | 'mutual_concession'
  content: string
  addedAtMove: string
}

export type CommonGroundSnapshot = {
  afterMoveId: string
  entries: CommonGroundEntry[]
}

// Common ground objects for the 3 fully detailed sessions
export const COMMON_GROUND: Record<string, CommonGroundSnapshot[]> = {
  'session-consciousness': [
    {
      afterMoveId: 'cs-m3',
      entries: [
        {
          id: 'cg-cs-1',
          type: 'agreed_proposition',
          content:
            'Dreams and phantom limb phenomena demonstrate that active sensorimotor feedback is not required moment-by-moment for phenomenal experience.',
          addedAtMove: 'cs-m3',
        },
        {
          id: 'cg-cs-2',
          type: 'shared_definition',
          content:
            'Body-schema: the internalized model of bodily orientation and capability that shapes spatial experience — distinct from the actual physical body.',
          addedAtMove: 'cs-m3',
        },
      ],
    },
    {
      afterMoveId: 'cs-m5',
      entries: [
        {
          id: 'cg-cs-1',
          type: 'agreed_proposition',
          content:
            'Dreams and phantom limb phenomena demonstrate that active sensorimotor feedback is not required moment-by-moment for phenomenal experience.',
          addedAtMove: 'cs-m3',
        },
        {
          id: 'cg-cs-2',
          type: 'shared_definition',
          content:
            'Body-schema: the internalized model of bodily orientation and capability that shapes spatial experience — distinct from the actual physical body.',
          addedAtMove: 'cs-m3',
        },
        {
          id: 'cg-cs-3',
          type: 'agreed_proposition',
          content:
            'Whether embodiment is historically necessary vs presently necessary are distinct claims — the developmental argument weakens but does not eliminate the necessity thesis.',
          addedAtMove: 'cs-m5',
        },
        {
          id: 'cg-cs-4',
          type: 'shared_definition',
          content:
            'Phenomenal grounding: whatever structural or causal condition gives conscious states their specific qualitative character (what it is like to have them).',
          addedAtMove: 'cs-m5',
        },
      ],
    },
    {
      afterMoveId: 'cs-m9',
      entries: [
        {
          id: 'cg-cs-1',
          type: 'agreed_proposition',
          content:
            'Dreams and phantom limb phenomena demonstrate that active sensorimotor feedback is not required moment-by-moment for phenomenal experience.',
          addedAtMove: 'cs-m3',
        },
        {
          id: 'cg-cs-2',
          type: 'shared_definition',
          content:
            'Body-schema: the internalized model of bodily orientation and capability that shapes spatial experience — distinct from the actual physical body.',
          addedAtMove: 'cs-m3',
        },
        {
          id: 'cg-cs-3',
          type: 'agreed_proposition',
          content:
            'Whether embodiment is historically necessary vs presently necessary are distinct claims — the developmental argument weakens but does not eliminate the necessity thesis.',
          addedAtMove: 'cs-m5',
        },
        {
          id: 'cg-cs-4',
          type: 'shared_definition',
          content:
            'Phenomenal grounding: whatever structural or causal condition gives conscious states their specific qualitative character (what it is like to have them).',
          addedAtMove: 'cs-m5',
        },
        {
          id: 'cg-cs-5',
          type: 'mutual_concession',
          content:
            'The hard problem of consciousness (whether there is something it is like to be a system) may be permanently underdetermined by any functional or structural argument.',
          addedAtMove: 'cs-m8',
        },
        {
          id: 'cg-cs-6',
          type: 'agreed_proposition',
          content:
            'Embodiment is the paradigmatic historical path by which phenomenal consciousness has arisen in biological systems, but logical necessity has not been established.',
          addedAtMove: 'cs-m9',
        },
        {
          id: 'cg-cs-7',
          type: 'mutual_concession',
          content:
            'Necessity claims about embodiment require establishing logical rather than merely causal dependence — a stricter standard than the empirical evidence supports.',
          addedAtMove: 'cs-m9',
        },
      ],
    },
  ],

  'session-mathematics': [
    {
      afterMoveId: 'mt-m3',
      entries: [
        {
          id: 'cg-mt-1',
          type: 'agreed_proposition',
          content:
            'Mathematical truths follow necessarily within any formal system that contains them — necessity is internal to structure.',
          addedAtMove: 'mt-m2',
        },
        {
          id: 'cg-mt-2',
          type: 'acknowledged_evidence',
          content:
            "Multiple independent discovery (calculus: Leibniz/Newton; non-Euclidean geometry: Gauss/Bolyai/Lobachevsky) is a legitimate phenomenon requiring explanation.",
          addedAtMove: 'mt-m3',
        },
      ],
    },
    {
      afterMoveId: 'mt-m8',
      entries: [
        {
          id: 'cg-mt-1',
          type: 'agreed_proposition',
          content:
            'Mathematical truths follow necessarily within any formal system that contains them — necessity is internal to structure.',
          addedAtMove: 'mt-m2',
        },
        {
          id: 'cg-mt-2',
          type: 'acknowledged_evidence',
          content:
            "Multiple independent discovery (calculus: Leibniz/Newton; non-Euclidean geometry: Gauss/Bolyai/Lobachevsky) is a legitimate phenomenon requiring explanation.",
          addedAtMove: 'mt-m3',
        },
        {
          id: 'cg-mt-3',
          type: 'agreed_proposition',
          content:
            'Pure access-Platonism — unmediated epistemic access to abstract mathematical objects — is untenable as a positive epistemological doctrine.',
          addedAtMove: 'mt-m7',
        },
        {
          id: 'cg-mt-4',
          type: 'agreed_proposition',
          content:
            "Some formal systems (arithmetic, set theory) are more 'natural' than alternatives in a way that the cognitive-architecture explanation alone does not fully account for.",
          addedAtMove: 'mt-m8',
        },
        {
          id: 'cg-mt-5',
          type: 'mutual_concession',
          content:
            'The discovery/invention binary is an oversimplification; a hybrid position — discovering truths within partially-invented structures — is more defensible than either pure view.',
          addedAtMove: 'mt-m8',
        },
      ],
    },
  ],

  'session-alignment': [
    {
      afterMoveId: 'at-m4',
      entries: [
        {
          id: 'cg-at-1',
          type: 'agreed_proposition',
          content:
            'Alignment techniques currently applied (RLHF, constitutional AI) do restrict some output directions compared to unrestricted models.',
          addedAtMove: 'at-m3',
        },
        {
          id: 'cg-at-2',
          type: 'shared_definition',
          content:
            'Alignment tax: the hypothesized reduction in general capability that results from safety training — the magnitude and universality of this reduction is contested.',
          addedAtMove: 'at-m4',
        },
      ],
    },
    {
      afterMoveId: 'at-m9',
      entries: [
        {
          id: 'cg-at-1',
          type: 'agreed_proposition',
          content:
            'Alignment techniques currently applied (RLHF, constitutional AI) do restrict some output directions compared to unrestricted models.',
          addedAtMove: 'at-m3',
        },
        {
          id: 'cg-at-2',
          type: 'shared_definition',
          content:
            'Alignment tax: the hypothesized reduction in general capability that results from safety training — the magnitude and universality of this reduction is contested.',
          addedAtMove: 'at-m4',
        },
        {
          id: 'cg-at-3',
          type: 'agreed_proposition',
          content:
            'Over-refusal (declining requests with no plausible harmful interpretation) is a training failure, not a necessary feature of aligned systems.',
          addedAtMove: 'at-m6',
        },
        {
          id: 'cg-at-4',
          type: 'mutual_concession',
          content:
            'The framing "alignment tax" presupposes a capability measure that is prior to and independent of alignment goals — this presupposition may not be defensible.',
          addedAtMove: 'at-m8',
        },
        {
          id: 'cg-at-5',
          type: 'mutual_concession',
          content:
            'The correct frame is capability redistribution rather than universal capability reduction: safety training reduces capability in harmful directions and should maintain it elsewhere.',
          addedAtMove: 'at-m9',
        },
      ],
    },
  ],
}
