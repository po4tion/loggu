import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { CommentWithAuthor, Profile } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PostContent } from '@/components/post/post-content'
import { PostActions } from '@/components/post/post-actions'
import { LikeButton } from '@/components/post/like-button'
import { CommentList } from '@/components/comment/comment-list'
import { TableOfContents } from '@/components/post/table-of-contents'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: post } = await supabase
    .from('posts')
    .select(`
      title,
      excerpt,
      cover_image_url,
      published_at,
      updated_at,
      profiles!posts_author_id_fkey (
        username,
        display_name
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return {
      title: '글을 찾을 수 없음',
      robots: { index: false },
    }
  }

  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tags(name)')
    .eq('post_id', slug)

  const author = post.profiles as unknown as { username: string; display_name: string | null }
  const authorName = author?.display_name || author?.username || 'Unknown'
  const description = post.excerpt || post.title
  const canonicalUrl = `${siteUrl}/posts/${slug}`
  const keywords = postTags?.map((pt) => (pt.tags as unknown as { name: string })?.name).filter(Boolean) || []

  return {
    title: post.title,
    description,
    keywords,
    authors: [{ name: authorName }],
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: canonicalUrl,
      images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: [authorName],
    },
    twitter: {
      card: post.cover_image_url ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      cover_image_url,
      published,
      published_at,
      views,
      author_id,
      profiles!posts_author_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (!post) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthor = user?.id === post.author_id
  const canView = post.published || isAuthor

  if (!canView) {
    notFound()
  }

  // Increment view count (only for published posts, not for author)
  if (post.published && !isAuthor) {
    await supabase.rpc('increment_post_views', { post_id: post.id })
  }

  // Fetch comments with author profiles
  const { data: commentsData } = await supabase
    .from('comments')
    .select(
      `
      id,
      post_id,
      author_id,
      parent_id,
      content,
      created_at,
      updated_at,
      profiles!comments_author_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const comments: CommentWithAuthor[] = (commentsData ?? []).map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    author_id: comment.author_id,
    parent_id: comment.parent_id,
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    author: comment.profiles as unknown as Profile,
  }))

  // Fetch current user profile if logged in
  let currentUserProfile: Profile | null = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .single()
    currentUserProfile = profileData
  }

  // Fetch like count and user's like status
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  let isLikedByUser = false
  if (user) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single()
    isLikedByUser = !!likeData
  }

  // Fetch tags
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tags(name, slug)')
    .eq('post_id', post.id)

  const tags =
    postTags?.map((pt) => pt.tags as unknown as { name: string; slug: string }) || []

  const author = post.profiles as unknown as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }

  const displayName = author.display_name || author.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="container mx-auto py-10">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_200px] gap-8 max-w-6xl mx-auto">
        <article className="max-w-4xl">
          {post.cover_image_url && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <header className="mb-8">
            {!post.published && (
              <span className="mb-2 inline-block rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800">
                임시저장
              </span>
            )}
            <h1 className="text-4xl leading-tight font-bold">{post.title}</h1>

            <div className="mt-6 flex items-center justify-between">
              <Link
                href={`/profile/${author.username}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <Avatar>
                  <AvatarImage src={author.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    {publishedDate && <span>{publishedDate}</span>}
                    {publishedDate && post.views > 0 && <span> · </span>}
                    {post.views > 0 && <span>조회 {post.views}</span>}
                  </p>
                </div>
              </Link>

              {isAuthor && <PostActions postId={post.id} slug={post.slug} />}
            </div>
          </header>

          <PostContent content={post.content} />

          {post.published && (
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
              <LikeButton
                postId={post.id}
                initialLiked={isLikedByUser}
                initialCount={likesCount ?? 0}
                isAuthenticated={!!user}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <Link key={tag.slug} href={`/tags/${tag.slug}` as any}>
                      <Badge variant="secondary" className="hover:bg-secondary/80">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {post.published && (
            <CommentList
              postId={post.id}
              initialComments={comments}
              currentUser={currentUserProfile}
            />
          )}
        </article>

        {post.content && <TableOfContents content={post.content} />}
      </div>
    </main>
  )
}
