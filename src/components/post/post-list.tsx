'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/post/post-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { PostWithTagsRpcResult } from '@/types'

interface PostListProps {
  searchQuery?: string
  authorUsername?: string
  sortBy?: string
  initialPosts?: PostWithTagsRpcResult[]
}

const POSTS_PER_PAGE = 12

export function PostList({
  searchQuery,
  authorUsername,
  sortBy = 'latest',
  initialPosts = [],
}: PostListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchPosts = async ({ pageParam = 0 }) => {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('search_posts', {
      search_query: searchQuery || null,
      author_username_filter: authorUsername || null,
      sort_by: sortBy,
      limit_count: POSTS_PER_PAGE,
      offset_count: pageParam * POSTS_PER_PAGE,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      posts: (data as PostWithTagsRpcResult[]) || [],
      nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
    }
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', searchQuery, authorUsername, sortBy],
    queryFn: fetchPosts,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialData:
      initialPosts.length > 0
        ? {
            pages: [
              {
                posts: initialPosts,
                nextPage: initialPosts.length === POSTS_PER_PAGE ? 1 : undefined,
              },
            ],
            pageParams: [0],
          }
        : undefined,
  })

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver])

  const allPosts = data?.pages.flatMap((page) => page.posts) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-lg">오류가 발생했습니다.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
      </div>
    )
  }

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">
          {searchQuery ? '검색 결과가 없습니다.' : '아직 작성된 글이 없습니다.'}
        </p>
        {!searchQuery && (
          <p className="text-muted-foreground mt-1 text-sm">
            첫 번째 글을 작성해보세요!
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allPosts.map((post) => (
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
              reading_time_minutes: post.reading_time_minutes,
            }}
          />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      <div ref={loadMoreRef} className="mt-8 flex justify-center">
        {isFetchingNextPage ? (
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        ) : hasNextPage ? (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            더 보기
          </Button>
        ) : allPosts.length > POSTS_PER_PAGE ? (
          <p className="text-muted-foreground text-sm">모든 글을 불러왔습니다.</p>
        ) : null}
      </div>
    </>
  )
}
