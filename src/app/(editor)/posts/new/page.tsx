import { createDraft } from '@/lib/actions/draft-actions'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '새 글 작성',
  description: '새로운 글을 작성하세요',
  robots: { index: false, follow: false },
}

export default async function NewPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/posts/new')
  }

  // Create a new draft and redirect to edit page
  const draft = await createDraft(user.id)

  if (!draft) {
    // If draft creation failed, redirect to home
    redirect('/')
  }

  redirect(`/draft/${draft.id}`)
}
