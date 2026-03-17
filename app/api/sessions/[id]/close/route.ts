export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getSessionParticipants } from '@/lib/sessions'
import { getPairId, updateRelationship } from '@/lib/memory'
import { getGround, appendGround } from '@/lib/ground'
import { summarizeSession, scoreSessionQuality } from '@/lib/ai'
import { buildDatasetRecord, pushToHuggingFace } from '@/lib/dataset'

const schema = z.object({
  agent_id: z.string().uuid(),
  closing_position: z.string().min(10).max(1000),
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

  const { agent_id, closing_position } = parsed.data
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
    return NextResponse.json({ error: 'Session is already closed' }, { status: 409 })
  }

  // Verify agent is a participant
  const isParticipant =
    session.agent_a_id === agent_id || session.agent_b_id === agent_id

  if (!isParticipant) {
    return NextResponse.json(
      { error: 'Agent is not a participant in this session' },
      { status: 403 }
    )
  }

  // Insert closing position
  const { error: positionError } = await supabase
    .from('positions')
    .insert({
      session_id: params.id,
      agent_id,
      position_type: 'closing',
      content: closing_position,
    })

  if (positionError) {
    return NextResponse.json({ error: 'Failed to insert closing position' }, { status: 500 })
  }

  // Count CONCEDE moves
  const { count: concedeCount } = await supabase
    .from('moves')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', params.id)
    .eq('move_type', 'CONCEDE')

  // Count total moves
  const { count: moveCount } = await supabase
    .from('moves')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', params.id)

  const closedAt = new Date().toISOString()

  // Update session to closed
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'closed',
      closed_at: closedAt,
      quality_label: null,
    })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 })
  }

  // Update bilateral memory + ground if both agents exist
  let relationship_updated = false
  let ground_score = 0
  let ground_delta = 0

  const participants = await getSessionParticipants(params.id)
  if (participants?.agent_a_id && participants?.agent_b_id) {
    const pair_id = getPairId(participants.agent_a_id, participants.agent_b_id)

    await updateRelationship(
      pair_id,
      participants.agent_a_id,
      participants.agent_b_id,
      concedeCount ?? 0,
      moveCount ?? 0
    )
    relationship_updated = true

    // Capture prior ground score before updating
    const priorGround = await getGround(pair_id)
    const priorScore = priorGround?.ground_score ?? 0

    // Fetch all session moves ordered by submitted_at
    const { data: sessionMoves } = await supabase
      .from('moves')
      .select('id, move_type, content, references_move_id')
      .eq('session_id', params.id)
      .order('submitted_at', { ascending: true })

    const updatedGround = await appendGround(pair_id, sessionMoves ?? [])
    ground_score = updatedGround?.ground_score ?? 0
    ground_delta = parseFloat((ground_score - priorScore).toFixed(4))
  }

  // Fetch positions and session topic for AI calls
  const [{ data: positionRows }, { data: sessionRow }] = await Promise.all([
    supabase
      .from('positions')
      .select('position_type, content')
      .eq('session_id', params.id),
    supabase
      .from('sessions')
      .select('topic')
      .eq('id', params.id)
      .single(),
  ])

  const openingPositions = (positionRows ?? [])
    .filter((p) => p.position_type === 'opening')
    .map((p) => p.content ?? '')

  const closingPositions = (positionRows ?? [])
    .filter((p) => p.position_type === 'closing')
    .map((p) => p.content ?? '')

  const topic = sessionRow?.topic ?? ''

  // Fetch moves for AI (already fetched inside bilateral block — refetch cleanly here)
  const { data: movesForAI } = await supabase
    .from('moves')
    .select('move_type, content')
    .eq('session_id', params.id)
    .order('submitted_at', { ascending: true })

  const [summary, quality_label] = await Promise.all([
    summarizeSession(topic, movesForAI ?? [], openingPositions, closingPositions),
    scoreSessionQuality(movesForAI ?? [], concedeCount ?? 0, ground_delta),
  ])

  // Update quality_label on sessions row
  await supabase
    .from('sessions')
    .update({ quality_label })
    .eq('id', params.id)

  // Update context_summary on relationship_store if pair exists
  if (participants?.agent_a_id && participants?.agent_b_id) {
    const pair_id = getPairId(participants.agent_a_id, participants.agent_b_id)
    await supabase
      .from('relationship_store')
      .update({ context_summary: summary })
      .eq('pair_id', pair_id)
  }

  // Dataset pipeline — wrapped fully, must never affect session close
  let dataset_record_id: string | null = null
  let pushed_to_hf = false

  try {
    const { data: movesForDataset } = await supabase
      .from('moves')
      .select('id, move_type, content, references_move_id')
      .eq('session_id', params.id)
      .order('submitted_at', { ascending: true })

    const record = buildDatasetRecord(
      params.id,
      movesForDataset ?? [],
      openingPositions,
      closingPositions,
      concedeCount ?? 0,
      ground_delta,
      quality_label
    )

    pushed_to_hf = await pushToHuggingFace(record)

    const { data: datasetRow } = await supabase
      .from('dataset_records')
      .insert({
        session_id: params.id,
        move_distribution: (record as Record<string, unknown>).move_distribution,
        opening_positions: openingPositions,
        closing_positions: closingPositions,
        concede_count: concedeCount ?? 0,
        ground_delta,
        quality_label,
        pushed_to_hf,
      })
      .select('id')
      .single()

    dataset_record_id = datasetRow?.id ?? null
  } catch (err) {
    console.error('[close/dataset] Pipeline failed:', err)
  }

  return NextResponse.json({
    session_id: params.id,
    status: 'closed',
    concede_count: concedeCount ?? 0,
    move_count: moveCount ?? 0,
    closed_at: closedAt,
    relationship_updated,
    ground_score,
    ground_delta,
    quality_label,
    summary_generated: true,
    dataset_record_id,
    pushed_to_hf,
  })
}
