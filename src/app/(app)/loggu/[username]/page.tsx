import { ProfilePostList } from '@/components/profile/profile-post-list'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/server'
import { Github, Linkedin, Globe } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

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
  const canonicalUrl = `${siteUrl}/@${username}`

  return {
    title: `${displayName} (@${profile.username})`,
    description,
    openGraph: {
      type: 'profile',
      title: `${displayName} (@${profile.username})`,
      description,
      url: canonicalUrl,
      images: profile.avatar_url
        ? [{ url: profile.avatar_url, alt: `${displayName}의 프로필 이미지` }]
        : undefined,
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
    .select('id, username, display_name, bio, avatar_url, github_url, linkedin_url, website_url')
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

  // Fetch posts - 본인이면 모든 글, 아니면 발행된 글만
  let postsQuery = supabase
    .from('posts')
    .select(
      'id, title, slug, excerpt, cover_image_url, published, published_at, created_at, views, reading_time_minutes'
    )
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })

  if (!isOwnProfile) {
    postsQuery = postsQuery.eq('published', true)
  }

  const { data: posts } = await postsQuery

  return (
    <main className="container mx-auto max-w-6xl px-6 py-8 md:py-10">
      <article className="flex flex-col items-center text-center">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>

        <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
        <p className="text-muted-foreground">@{profile.username}</p>

        {profile.bio && <p className="mt-4 max-w-md">{profile.bio}</p>}

        {/* 소셜 링크 */}
        {(profile.github_url || profile.linkedin_url || profile.website_url) && (
          <div className="mt-4 flex items-center gap-3">
            {profile.github_url && (
              <Link
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
            )}
            {profile.linkedin_url && (
              <Link
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            )}
            {profile.website_url && (
              <Link
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="웹사이트"
              >
                <Globe className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

      </article>

      <ProfilePostList
        posts={posts ?? []}
        profile={{
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        }}
      />
    </main>
  )
}
