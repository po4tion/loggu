import { EditorLayout } from '@/components/editor/editor-layout'
import {
  UnifiedPostEditor,
  type UnifiedPostEditorInitialData,
} from '@/components/editor/unified-post-editor'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

interface DraftPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DraftPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: post?.title || '글 수정',
    robots: { index: false, follow: false },
  }
}

export default async function DraftPage({ params }: DraftPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/draft/${id}`)
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, excerpt, cover_image_url, published, slug, author_id')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Check if the current user is the author
  if (post.author_id !== user.id) {
    notFound()
  }

  const initialData: UnifiedPostEditorInitialData = {
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    cover_image_url: post.cover_image_url,
    published: post.published,
    slug: post.slug,
  }

  return (
    <EditorLayout authorId={user.id} currentPostId={post.id}>
      <UnifiedPostEditor postId={post.id} authorId={user.id} initialData={initialData} />
    </EditorLayout>
  )
}
