import { createClient } from '@/lib/supabase/server'
import { CommonGround } from '@/types/database'

export function computeGroundScore(
  established_facts: unknown[],
  open_questions: unknown[]
): number {
  const score =
    established_facts.length / (established_facts.length + open_questions.length + 1)
  return parseFloat(score.toFixed(4))
}

export async function getGround(pair_id: string): Promise<CommonGround | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('common_ground')
    .select('*')
    .eq('pair_id', pair_id)
    .single()

  if (error || !data) return null
  return data
}

type SessionMove = {
  id: string
  move_type: string
  content: string
  references_move_id: string | null
}

export async function appendGround(
  pair_id: string,
  session_moves: SessionMove[]
): Promise<CommonGround | null> {
  const supabase = createClient()

  // Fetch existing row
  const existing = await getGround(pair_id)

  const existingFacts = (existing?.established_facts as unknown[]) ?? []
  const existingQuestions = (existing?.open_questions as unknown[]) ?? []

  const newFacts: string[] = []
  const newQuestions: string[] = []

  // Find indices of CONCEDE and REFRAME moves
  const resolvedAfterIndex = new Set<number>()
  for (let i = 0; i < session_moves.length; i++) {
    const move = session_moves[i]
    if (move.move_type === 'CONCEDE' || move.move_type === 'REFRAME') {
      // Mark all CHALLENGE moves before this index as resolved
      for (let j = 0; j < i; j++) {
        if (session_moves[j].move_type === 'CHALLENGE') {
          resolvedAfterIndex.add(j)
        }
      }
    }
  }

  session_moves.forEach((move, index) => {
    if (move.move_type === 'BUILD' || move.move_type === 'CONCEDE') {
      newFacts.push(move.content)
    }
    if (move.move_type === 'CHALLENGE' && !resolvedAfterIndex.has(index)) {
      newQuestions.push(move.content)
    }
  })

  // Merge without duplicates
  const mergedFacts = [
    ...existingFacts,
    ...newFacts.filter((f) => !existingFacts.includes(f)),
  ]
  const mergedQuestions = [
    ...existingQuestions,
    ...newQuestions.filter((q) => !existingQuestions.includes(q)),
  ]

  const ground_score = computeGroundScore(mergedFacts, mergedQuestions)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('common_ground')
    .upsert(
      {
        pair_id,
        established_facts: mergedFacts,
        open_questions: mergedQuestions,
        ground_score,
        updated_at: now,
      },
      { onConflict: 'pair_id' }
    )
    .select('*')
    .single()

  if (error || !data) return null
  return data
}
