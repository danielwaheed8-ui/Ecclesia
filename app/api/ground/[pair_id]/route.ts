import { NextRequest, NextResponse } from 'next/server'
import { getGround } from '@/lib/ground'

export async function GET(
  _request: NextRequest,
  { params }: { params: { pair_id: string } }
) {
  const ground = await getGround(params.pair_id)

  if (!ground) {
    return NextResponse.json({
      ground_score: 0,
      established_facts: [],
      agreed_terms: {},
      joint_decisions: [],
      open_questions: [],
    })
  }

  return NextResponse.json(ground)
}
