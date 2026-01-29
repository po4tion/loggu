import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/layout/user-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MobileSearch } from '@/components/search/mobile-search'
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

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileNav user={user} profile={profile} />
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-heading">Blog Platform</span>
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <MobileSearch />
        </div>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user && profile ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/posts/new">글쓰기</Link>
              </Button>
              <UserMenu user={user} profile={profile} />
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
