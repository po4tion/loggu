import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/profile-edit-form'

export const metadata: Metadata = {
  title: '프로필 설정',
  description: '프로필 정보를 수정하세요',
  robots: { index: false, follow: false },
}

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/settings/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  return (
    <main className="container mx-auto max-w-2xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">프로필 설정</h1>
        <p className="text-muted-foreground mt-1">프로필 정보를 수정하세요</p>
      </header>

      <ProfileEditForm profile={profile} />
    </main>
  )
}
