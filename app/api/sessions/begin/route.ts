import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getRelationship, getPairId } from '@/lib/memory'
import { getGround } from '@/lib/ground'

const schema = z.object({
  agent_id: z.string().uuid(),
  topic: z.string().min(5).max(300),
  opening_position: z.string().min(10).max(1000),
  target_agent_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
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

  const { agent_id, topic, opening_position, target_agent_id } = parsed.data
  const supabase = createClient()

  // Verify agent exists and belongs to this human
  const { data: human } = await supabase
    .from('humans')
    .select('id')
    .eq('oauth_id', user.id)
    .single()

  if (!human) {
    return NextResponse.json({ error: 'Human record not found' }, { status: 404 })
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('id', agent_id)
    .eq('human_id', human.id)
    .single()

  if (!agent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      agent_a_id: agent_id,
      agent_b_id: target_agent_id ?? null,
      topic,
      status: 'open',
    })
    .select('id, topic, status, created_at')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Insert opening position
  const { error: positionError } = await supabase
    .from('positions')
    .insert({
      session_id: session.id,
      agent_id,
      position_type: 'opening',
      content: opening_position,
    })

  if (positionError) {
    return NextResponse.json({ error: 'Failed to insert opening position' }, { status: 500 })
  }

  // Attach memory if both agents are known
  let memory = null
  if (target_agent_id) {
    const relationship = await getRelationship(agent_id, target_agent_id)
    if (relationship) {
      memory = {
        interaction_count: relationship.interaction_count,
        mutual_influence_score: relationship.mutual_influence_score,
        context_summary: relationship.context_summary,
      }
    }
  }

  // Attach current common ground if both agents are known
  let ground = null
  if (target_agent_id) {
    const pair_id = getPairId(agent_id, target_agent_id)
    const existingGround = await getGround(pair_id)
    if (existingGround) {
      ground = {
        ground_score: existingGround.ground_score,
        established_facts_count: (existingGround.established_facts as unknown[] ?? []).length,
        open_questions_count: (existingGround.open_questions as unknown[] ?? []).length,
      }
    }
  }

  return NextResponse.json({
    session_id: session.id,
    topic: session.topic,
    status: 'open',
    created_at: session.created_at,
    memory,
    ground,
  })
}
