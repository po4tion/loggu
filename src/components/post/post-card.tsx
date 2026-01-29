import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    cover_image_url: string | null
    published_at: string | null
    views: number
    author_username: string
    author_display_name: string | null
    author_avatar_url: string | null
    reading_time_minutes?: number
  }
}

export function PostCard({ post }: PostCardProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Card className="group overflow-hidden py-4 transition-all hover:shadow-lg md:py-0">
      <Link href={`/posts/${post.slug}`} className="flex flex-col px-4 md:flex-row md:gap-4 md:p-4">
        {/* 모바일: 상단 이미지 */}
        {post.cover_image_url && (
          <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg md:hidden">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col justify-between md:h-28">
          <div>
            <h2 className="text-heading group-hover:text-primary text-base leading-snug font-semibold md:text-lg">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-subtle mt-2 line-clamp-2 text-sm">{post.excerpt}</p>
            )}
          </div>

          <div className="text-muted-foreground mt-3 flex items-center gap-3 text-sm md:mt-4">
            {publishedDate && <span>{publishedDate}</span>}
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </div>

        {/* 데스크톱: 우측 이미지 */}
        {post.cover_image_url && (
          <div className="relative hidden h-28 w-40 shrink-0 overflow-hidden rounded-lg md:block">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </Link>
    </Card>
  )
}
