import { Suspense } from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PopularTags } from '@/components/tag/popular-tags'
import { SearchFilters } from '@/components/search/search-filters'
import { PostList } from '@/components/post/post-list'
import type { PostWithTagsRpcResult } from '@/types'

interface HomePageProps {
  searchParams: Promise<{
    q?: string
    sort?: string
    author?: string
  }>
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const params = await searchParams
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (params.q) {
    const title = `"${params.q}" 검색 결과`
    const description = `"${params.q}" 검색 결과를 확인하세요`

    return {
      title,
      description,
      robots: { index: false },
      openGraph: {
        title,
        description,
        url: siteUrl,
      },
    }
  }

  if (params.author) {
    const title = `${params.author}님의 글`
    const description = `${params.author}님이 작성한 글 목록`

    return {
      title,
      description,
      robots: { index: false },
      openGraph: {
        title,
        description,
        url: siteUrl,
      },
    }
  }

  return {
    alternates: {
      canonical: siteUrl,
    },
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const searchQuery = params.q || ''
  const sortBy = params.sort || 'latest'
  const authorUsername = params.author || ''

  const supabase = await createClient()

  // 초기 데이터 서버에서 fetch
  const { data: initialPosts } = await supabase.rpc('search_posts', {
    search_query: searchQuery || null,
    author_username_filter: authorUsername || null,
    sort_by: sortBy,
    limit_count: 12,
    offset_count: 0,
  })

  return (
    <main className="container mx-auto px-6 py-8 md:py-10">
      <PopularTags />

      <SearchFilters />

      <section>
        <h1 className="sr-only">
          {searchQuery ? `"${searchQuery}" 검색 결과` : '최신 글'}
        </h1>

        {searchQuery && (
          <p className="text-muted-foreground mb-6 text-sm">
            &quot;{searchQuery}&quot; 검색 결과
          </p>
        )}

        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-80 animate-pulse rounded-lg"
                />
              ))}
            </div>
          }
        >
          <PostList
            searchQuery={searchQuery}
            authorUsername={authorUsername}
            sortBy={sortBy}
            initialPosts={(initialPosts as PostWithTagsRpcResult[]) || []}
          />
        </Suspense>
      </section>
    </main>
  )
}
