import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostEditForm } from '@/components/post/post-edit-form'

interface EditPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title')
    .eq('slug', slug)
    .single()

  if (!post) {
    return {
      title: '글을 찾을 수 없음',
      robots: { index: false },
    }
  }

  return {
    title: `수정: ${post.title}`,
    robots: { index: false, follow: false },
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, cover_image_url, published, author_id')
    .eq('slug', slug)
    .single()

  if (!post) {
    notFound()
  }

  if (post.author_id !== user.id) {
    redirect(`/posts/${slug}`)
  }

  // 기존 태그 불러오기
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tags(name)')
    .eq('post_id', post.id)

  const tags = postTags?.map((pt) => (pt.tags as unknown as { name: string }).name) || []

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <h1 className="mb-8 text-3xl font-bold">글 수정</h1>
      <PostEditForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          cover_image_url: post.cover_image_url,
          published: post.published,
          tags,
        }}
      />
    </main>
  )
}
