import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 로그인한 사용자의 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect(`/@${profile.username}` as any)
  }

  // 프로필이 없는 경우 설정 페이지로
  redirect('/settings/profile')
}
