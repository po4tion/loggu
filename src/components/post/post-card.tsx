import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'

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
  const displayName = post.author_display_name || post.author_username
  const initials = displayName.slice(0, 2).toUpperCase()
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden py-0 transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/posts/${post.slug}`} className="flex flex-1 flex-col">
        {post.cover_image_url ? (
          <div className="p-4 pb-0">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 pb-0">
            <div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-4xl">📝</span>
            </div>
          </div>
        )}

        <CardHeader className="flex-1 px-4 pt-2 pb-0">
          <h2 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">{post.excerpt}</p>
          )}
        </CardHeader>
      </Link>

      <CardFooter className="flex items-center justify-between px-4 pb-2 pt-3">
        <Link
          href={`/profile/${post.author_username}`}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={post.author_avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{displayName}</span>
        </Link>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {publishedDate && <span>{publishedDate}</span>}
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time_minutes}분
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
