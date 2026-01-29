import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/post/post-card'
import type { PostWithTagsRpcResult } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: posts } = await supabase.rpc('get_posts_with_tags', {
    limit_count: 20,
    offset_count: 0,
  })

  return (
    <main className="container mx-auto py-10">
      <section>
        <h1 className="sr-only">최신 글</h1>

        {posts && posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: PostWithTagsRpcResult) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  excerpt: post.excerpt,
                  cover_image_url: post.cover_image_url,
                  published_at: post.published_at,
                  views: post.views,
                  author_username: post.author_username,
                  author_display_name: post.author_display_name,
                  author_avatar_url: post.author_avatar_url,
                  likes_count: Number(post.likes_count),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-lg">아직 작성된 글이 없습니다.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              첫 번째 글을 작성해보세요!
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
