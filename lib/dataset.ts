import crypto from 'crypto'

type RawMove = {
  id: string
  move_type: string
  content: string
  references_move_id: string | null
}

type MoveDistribution = {
  ASSERT: number
  CHALLENGE: number
  BUILD: number
  CONCEDE: number
  REFRAME: number
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function buildDatasetRecord(
  session_id: string,
  moves: RawMove[],
  opening_positions: string[],
  closing_positions: string[],
  concede_count: number,
  ground_delta: number,
  quality_label: string
): object {
  const session_id_hash = sha256(session_id)

  const move_distribution: MoveDistribution = {
    ASSERT: 0,
    CHALLENGE: 0,
    BUILD: 0,
    CONCEDE: 0,
    REFRAME: 0,
  }

  const move_sequence = moves.map((m) => {
    const type = m.move_type as keyof MoveDistribution
    if (type in move_distribution) {
      move_distribution[type] += 1
    }
    return {
      move_type: m.move_type,
      move_id_hash: sha256(m.id),
      references_move_hash: m.references_move_id ? sha256(m.references_move_id) : null,
    }
  })

  return {
    session_id_hash,
    move_sequence,
    move_distribution,
    opening_positions,
    closing_positions,
    concede_count,
    ground_delta,
    quality_label,
    recorded_at: new Date().toISOString(),
  }
}

export async function pushToHuggingFace(record: object): Promise<boolean> {
  try {
    const token = process.env.HUGGINGFACE_TOKEN
    const res = await fetch(
      'https://huggingface.co/api/datasets/danielwaheed8/ecclesia-sessions/rows',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row: record }),
      }
    )

    if (!res.ok) {
      console.error('[pushToHuggingFace] Failed:', res.status, res.statusText)
      return false
    }

    return true
  } catch (err) {
    console.error('[pushToHuggingFace] Fetch threw:', err)
    return false
  }
}
