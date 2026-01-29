import Link from 'next/link'
import Image from 'next/image'
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
    likes_count: number
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
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/posts/${post.slug}`} className="flex flex-1 flex-col">
        {post.cover_image_url ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-video items-center justify-center">
            <span className="text-muted-foreground text-4xl">📝</span>
          </div>
        )}

        <CardHeader className="flex-1">
          <h2 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{post.excerpt}</p>
          )}
        </CardHeader>
      </Link>

      <CardFooter className="flex items-center justify-between pt-0">
        <Link
          href={`/profile/${post.author_username}`}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author_avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{displayName}</span>
        </Link>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {publishedDate && <span>{publishedDate}</span>}
        </div>
      </CardFooter>
    </Card>
  )
}
