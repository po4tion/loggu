import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButton } from '@/components/auth/login-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export const metadata: Metadata = {
  title: '로그인',
  description: 'GitHub 계정으로 로그인하세요',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  const { error, next } = await searchParams

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* 배경 그라데이션 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-primary/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* 테마 토글 */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* 로그인 카드 */}
      <section className="relative w-full max-w-[360px]">
        <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          {/* 로고/브랜드 */}
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <svg
                className="h-6 w-6"
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
            <h1 className="text-xl font-semibold tracking-tight text-heading">
              Blog Platform
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              나만의 이야기를 기록하세요
            </p>
          </header>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          {/* 로그인 버튼 */}
          <LoginButton next={next} />

          {/* 안내 문구 */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            GitHub 계정으로 간편하게 시작하세요
          </p>
        </div>

        {/* 하단 링크 */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          로그인하면 서비스 이용약관에 동의하게 됩니다
        </p>
      </section>
    </main>
  )
}
