'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PostCard } from '@/components/post/post-card'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  views: number
  reading_time_minutes: number | null
}

interface ProfilePostListProps {
  posts: Post[]
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function ProfilePostList({ posts, profile }: ProfilePostListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query)
    )
  })

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          작성한 글
          {posts.length > 0 && (
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({filteredPosts.length !== posts.length ? `${filteredPosts.length}/` : ''}{posts.length})
            </span>
          )}
        </h2>

        {posts.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="글 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {posts.length > 0 ? (
        filteredPosts.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredPosts.map((post) => (
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
                  author_username: profile.username,
                  author_display_name: profile.display_name,
                  author_avatar_url: profile.avatar_url,
                  reading_time_minutes: post.reading_time_minutes ?? undefined,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-6 text-center py-8">
            &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
          </p>
        )
      ) : (
        <p className="text-muted-foreground mt-6 text-center py-8">
          아직 작성한 글이 없습니다.
        </p>
      )}
    </section>
  )
}
