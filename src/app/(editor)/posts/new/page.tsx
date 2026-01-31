import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostEditor } from '@/components/post/post-editor'

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

  return <PostEditor authorId={user.id} />
}
