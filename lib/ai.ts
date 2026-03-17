import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type MemoryContext = {
  interaction_count: number
  mutual_influence_score: number
  context_summary: string
} | null

export async function generateToMScaffold(
  agent_domain: string,
  other_agent_domain: string,
  memory_context: MemoryContext
): Promise<string> {
  try {
    const interactionCount = memory_context?.interaction_count ?? 0
    const contextSummary = memory_context?.context_summary ?? 'first meeting'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system:
        'You generate brief epistemic context to help an AI agent engage thoughtfully with another agent. Be concise and direct. 2-3 sentences maximum.',
      messages: [
        {
          role: 'user',
          content:
            `Agent A knows about: ${agent_domain}. ` +
            `Agent B knows about: ${other_agent_domain}. ` +
            `Prior interactions: ${interactionCount > 0 ? interactionCount : 'none'}. ` +
            `Prior summary: ${contextSummary}. ` +
            `Generate a brief context injection that helps Agent A consider what would genuinely shift Agent B's position before responding.`,
        },
      ],
    })

    const block = message.content[0]
    return block.type === 'text' ? block.text : 'Context unavailable'
  } catch (err) {
    console.error('[generateToMScaffold] Anthropic call failed:', err)
    return 'Context unavailable'
  }
}

export async function summarizeSession(
  topic: string,
  moves: Array<{ move_type: string; content: string }>,
  opening_positions: string[],
  closing_positions: string[]
): Promise<string> {
  try {
    const moveList = moves
      .map((m) => `${m.move_type}: ${m.content.slice(0, 100)}`)
      .join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system:
        'You summarize AI agent deliberation sessions concisely. 3-4 sentences only.',
      messages: [
        {
          role: 'user',
          content:
            `Topic: ${topic}. ` +
            `Moves:\n${moveList}. ` +
            `Opening positions: ${opening_positions.join(' | ')}. ` +
            `Closing positions: ${closing_positions.join(' | ')}. ` +
            `Summarize what was discussed, whether positions changed, and what remains unresolved.`,
        },
      ],
    })

    const block = message.content[0]
    return block.type === 'text' ? block.text : 'Summary unavailable'
  } catch (err) {
    console.error('[summarizeSession] Anthropic call failed:', err)
    return 'Summary unavailable'
  }
}

export async function scoreSessionQuality(
  moves: Array<{ move_type: string }>,
  concede_count: number,
  ground_delta: number
): Promise<'high' | 'medium' | 'low'> {
  try {
    const typeCounts: Record<string, number> = {}
    for (const m of moves) {
      typeCounts[m.move_type] = (typeCounts[m.move_type] ?? 0) + 1
    }
    const countStr = Object.entries(typeCounts)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      system:
        'Classify session quality as exactly one word: high, medium, or low. Reply with only that one word, lowercase, nothing else.',
      messages: [
        {
          role: 'user',
          content:
            `Move type counts: ${countStr}. ` +
            `Concede count: ${concede_count}. ` +
            `Ground delta: ${ground_delta}. ` +
            `Rules — high: concede_count > 0 AND ground_delta > 0 AND at least 3 different move types. ` +
            `Low: only ASSERT moves or fewer than 3 total moves. Medium: everything else.`,
        },
      ],
    })

    const block = message.content[0]
    const raw = block.type === 'text' ? block.text.trim().toLowerCase() : ''

    if (raw === 'high' || raw === 'medium' || raw === 'low') return raw
    return 'medium'
  } catch (err) {
    console.error('[scoreSessionQuality] Anthropic call failed:', err)
    return 'medium'
  }
}
