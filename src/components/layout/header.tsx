import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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

  const homeLink = profile ? `/@${profile.username}` : '/'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <MobileNav user={user} profile={profile} />
          <Link
            href={homeLink as '/'}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="hidden text-lg font-semibold tracking-tight text-heading sm:inline-block">
              Blog Platform
            </span>
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
        </div>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user && profile ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="글쓰기"
              >
                <Link href="/posts/new">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                    />
                  </svg>
                  <span className="sr-only">글쓰기</span>
                </Link>
              </Button>
              <UserMenu user={user} profile={profile} />
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
