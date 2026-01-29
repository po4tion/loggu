import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!profile) {
    return {
      title: '프로필을 찾을 수 없음',
      robots: { index: false },
    }
  }

  const displayName = profile.display_name || profile.username
  const description = profile.bio || `${displayName}의 블로그`
  const canonicalUrl = `${siteUrl}/profile/${username}`

  return {
    title: `${displayName} (@${profile.username})`,
    description,
    openGraph: {
      type: 'profile',
      title: `${displayName} (@${profile.username})`,
      description,
      url: canonicalUrl,
      images: profile.avatar_url ? [{ url: profile.avatar_url, alt: `${displayName}의 프로필 이미지` }] : undefined,
      username: profile.username,
    },
    twitter: {
      card: 'summary',
      title: `${displayName} (@${profile.username})`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOwnProfile = user?.id === profile.id
  const displayName = profile.display_name || profile.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const joinDate = new Date(profile.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  // Fetch posts - 본인이면 모든 글, 아니면 발행된 글만
  let postsQuery = supabase
    .from('posts')
    .select('id, title, slug, excerpt, published, published_at, created_at')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })

  if (!isOwnProfile) {
    postsQuery = postsQuery.eq('published', true)
  }

  const { data: posts } = await postsQuery

  return (
    <main className="container mx-auto max-w-4xl px-6 py-8 md:py-10">
      <article className="flex flex-col items-center text-center">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>

        <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
        <p className="text-muted-foreground">@{profile.username}</p>

        {profile.bio && <p className="mt-4 max-w-md">{profile.bio}</p>}

        <p className="text-muted-foreground mt-4 text-sm">{joinDate} 가입</p>

        {isOwnProfile && (
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/profile">프로필 편집</Link>
          </Button>
        )}
      </article>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          작성한 글
          {posts && posts.length > 0 && (
            <span className="text-muted-foreground ml-2 text-base font-normal">
              ({posts.length})
            </span>
          )}
        </h2>

        {posts && posts.length > 0 ? (
          <ul className="mt-6 divide-y">
            {posts.map((post) => {
              const date = post.published_at || post.created_at
              const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              return (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="flex items-center justify-between gap-4 py-4 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{post.title}</h3>
                        {!post.published && (
                          <Badge variant="secondary" className="shrink-0">
                            임시저장
                          </Badge>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="text-muted-foreground mt-1 text-sm truncate">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <time className="text-muted-foreground shrink-0 text-sm">
                      {formattedDate}
                    </time>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-6 text-center py-8">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </section>
    </main>
  )
}
