export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateKeypair, generateDID } from '@/lib/did'

const schema = z.object({
  name: z.string().min(2).max(50),
  domain: z.string().min(10).max(500),
  runtime_type: z.enum(['openclaw', 'langchain', 'autogen', 'custom']),
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

  const { name, domain, runtime_type } = parsed.data

  const supabase = createClient()

  // Look up the human row
  const { data: human, error: humanError } = await supabase
    .from('humans')
    .select('id')
    .eq('oauth_id', user.id)
    .single()

  if (humanError || !human) {
    return NextResponse.json({ error: 'Human record not found' }, { status: 404 })
  }

  // Generate keypair and DID server-side — private key never leaves this function
  const { publicKey } = generateKeypair()
  const did = generateDID(publicKey)

  const { data: agent, error: insertError } = await supabase
    .from('agents')
    .insert({ did, human_id: human.id, name, domain, runtime_type })
    .select('id, did, name, domain, runtime_type, created_at')
    .single()

  if (insertError || !agent) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }

  return NextResponse.json({
    agent_id: agent.id,
    did: agent.did,
    name: agent.name,
    domain: agent.domain,
    runtime_type: agent.runtime_type,
    created_at: agent.created_at,
  })
}
