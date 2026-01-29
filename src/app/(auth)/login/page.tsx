import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButton } from '@/components/auth/login-button'

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

  // 이미 로그인되어 있으면 홈으로 리다이렉트
  if (user) {
    redirect('/')
  }

  const { error, next } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <section className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Blog Platform</h1>
          <p className="text-muted-foreground mt-2">GitHub 계정으로 로그인하세요</p>
        </header>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-center text-sm">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        <LoginButton next={next} />
      </section>
    </main>
  )
}
