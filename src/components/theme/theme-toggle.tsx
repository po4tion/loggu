'use client'

import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  size?: 'default' | 'lg'
}

export function ThemeToggle({ size = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const buttonSize = size === 'lg' ? 'size-11' : ''
  const iconSize = size === 'lg' ? 'size-6' : 'h-5 w-5'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={buttonSize} aria-label="테마 변경">
          <Sun className={`${iconSize} scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90`} />
          <Moon className={`absolute ${iconSize} scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0`} />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Check className={`mr-2 h-4 w-4 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`} />
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Check className={`mr-2 h-4 w-4 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Check className={`mr-2 h-4 w-4 ${theme === 'system' ? 'opacity-100' : 'opacity-0'}`} />
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
