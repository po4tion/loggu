import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostCreateForm } from '@/components/post/post-create-form'

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

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">새 글 작성</h1>
      </header>

      <PostCreateForm authorId={user.id} />
    </main>
  )
}
