'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { MenuIcon, HomeIcon, PenSquareIcon, UserIcon, SettingsIcon, LogOutIcon, LogInIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'

interface MobileNavProps {
  user: User | null
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export function MobileNav({ user, profile }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const displayName = profile?.display_name || profile?.username || ''
  const avatarUrl = profile?.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      <SheetContent side="left" className="w-72">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-left">메뉴</SheetTitle>
        </SheetHeader>

        {user && profile && (
          <div className="flex items-center gap-3 border-b p-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{displayName}</span>
              <span className="text-muted-foreground text-sm">{user.email}</span>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1 p-4">
          <SheetClose asChild>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <HomeIcon className="h-4 w-4" />
              홈
            </Link>
          </SheetClose>

          {user && profile ? (
            <>
              <SheetClose asChild>
                <Link
                  href="/posts/new"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <PenSquareIcon className="h-4 w-4" />
                  글쓰기
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  href={`/profile/${profile.username}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <UserIcon className="h-4 w-4" />
                  내 프로필
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <SettingsIcon className="h-4 w-4" />
                  프로필 설정
                </Link>
              </SheetClose>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOutIcon className="h-4 w-4" />
                로그아웃
              </button>
            </>
          ) : (
            <SheetClose asChild>
              <Link
                href="/login"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <LogInIcon className="h-4 w-4" />
                로그인
              </Link>
            </SheetClose>
          )}
        </nav>

        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">테마</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
