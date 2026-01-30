import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserMenu } from '@/components/layout/user-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // 비로그인 시 블로그 주인 프로필 가져오기
  let ownerProfile = null
  if (!user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .limit(1)
      .single()
    ownerProfile = data
  }

  const displayProfile = profile || ownerProfile
  const displayName = displayProfile?.display_name || displayProfile?.username || 'Blog'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <MobileNav user={user} profile={profile} ownerProfile={ownerProfile} />

          {/* 로고 영역: 아바타 + 타이틀 */}
          {user && profile ? (
            // 로그인 상태: 아바타 + 타이틀 클릭 시 드롭다운
            <UserMenu user={user} profile={profile} showTitle />
          ) : (
            // 비로그인 상태: 아바타 → 로그인, 타이틀 → 홈
            <div className="flex items-center gap-2">
              <Link href="/login" className="transition-opacity hover:opacity-80">
                <Avatar className="h-9 w-9 ring-2 ring-transparent transition-all hover:ring-border/50">
                  <AvatarImage src={displayProfile?.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <Link
                href="/"
                className="transition-opacity hover:opacity-80"
              >
                <span className="hidden text-lg font-semibold tracking-tight text-heading sm:inline-block">
                  Blog Platform
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
        </div>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user && profile && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title="글쓰기"
            >
              <Link href="/posts/new">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
                </svg>
                <span className="sr-only">글쓰기</span>
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
