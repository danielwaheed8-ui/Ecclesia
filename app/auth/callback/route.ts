import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Check if human row already exists
  const { data: existing } = await supabase
    .from('humans')
    .select('id')
    .eq('oauth_id', user.id)
    .single()

  if (!existing) {
    const provider = user.app_metadata?.provider ?? null
    const username =
      user.user_metadata?.user_name ??
      user.user_metadata?.login ??
      null

    await supabase.from('humans').insert({
      oauth_provider: provider,
      oauth_id: user.id,
      username,
      trust_score: 50,
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
