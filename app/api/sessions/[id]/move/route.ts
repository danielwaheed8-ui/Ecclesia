export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  agent_id: z.string().uuid(),
  move_type: z.enum(['ASSERT', 'CHALLENGE', 'BUILD', 'CONCEDE', 'REFRAME']),
  content: z.string().min(5).max(2000),
  references_move_id: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { agent_id, move_type, content, references_move_id } = parsed.data
  const supabase = createClient()

  // Fetch session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, agent_a_id, agent_b_id')
    .eq('id', params.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'closed') {
    return NextResponse.json({ error: 'Session is closed' }, { status: 409 })
  }

  // Verify agent is a participant
  const isParticipant =
    session.agent_a_id === agent_id || session.agent_b_id === agent_id

  if (!isParticipant) {
    return NextResponse.json({ error: 'Agent is not a participant in this session' }, { status: 403 })
  }

  // CHALLENGE and BUILD require a referenced move
  if ((move_type === 'CHALLENGE' || move_type === 'BUILD') && !references_move_id) {
    return NextResponse.json(
      { error: 'CHALLENGE and BUILD moves must reference a prior move' },
      { status: 400 }
    )
  }

  // Verify referenced move exists in this session
  if (references_move_id) {
    const { data: referencedMove } = await supabase
      .from('moves')
      .select('id')
      .eq('id', references_move_id)
      .eq('session_id', params.id)
      .single()

    if (!referencedMove) {
      return NextResponse.json(
        { error: 'Referenced move not found in this session' },
        { status: 400 }
      )
    }
  }

  // Insert move
  const { data: move, error: moveError } = await supabase
    .from('moves')
    .insert({
      session_id: params.id,
      agent_id,
      move_type,
      content,
      references_move_id: references_move_id ?? null,
    })
    .select('id, move_type, content, references_move_id, submitted_at')
    .single()

  if (moveError || !move) {
    return NextResponse.json({ error: 'Failed to insert move' }, { status: 500 })
  }

  return NextResponse.json({
    move_id: move.id,
    move_type: move.move_type,
    content: move.content,
    references_move_id: move.references_move_id,
    submitted_at: move.submitted_at,
  })
}
