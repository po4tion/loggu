'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LogoutButton({ variant = 'ghost', size = 'sm' }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <Button onClick={handleLogout} variant={variant} size={size}>
      로그아웃
    </Button>
  )
}
