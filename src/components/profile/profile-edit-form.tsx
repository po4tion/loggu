'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Github, Linkedin, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileEditFormProps {
  profile: {
    id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    github_url: string | null
    linkedin_url: string | null
    website_url: string | null
  }
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      display_name: profile.display_name ?? '',
      bio: profile.bio ?? '',
      github_url: profile.github_url ?? '',
      linkedin_url: profile.linkedin_url ?? '',
      website_url: profile.website_url ?? '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.display_name || null,
        bio: data.bio || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        website_url: data.website_url || null,
      })
      .eq('id', profile.id)

    setIsLoading(false)

    if (error) {
      setMessage({ type: 'error', text: '프로필 업데이트에 실패했습니다' })
      return
    }

    setMessage({ type: 'success', text: '프로필이 업데이트되었습니다' })
  }

  const initials = (profile.display_name || profile.username)?.slice(0, 2).toUpperCase() || '??'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 아바타 섹션 */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-border/50">
        <Avatar className="h-20 w-20 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
          <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground text-center">
          프로필 이미지는 GitHub 계정의 아바타를 사용합니다
        </p>
      </div>

      {/* 사용자명 (읽기 전용) */}
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium">
          사용자명
        </Label>
        <Input
          id="username"
          value={profile.username}
          disabled
          className="bg-muted/50 cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          프로필 URL: /@{profile.username}
        </p>
      </div>

      {/* 표시 이름 */}
      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-sm font-medium">
          표시 이름
        </Label>
        <Input
          id="display_name"
          placeholder="홍길동"
          className="transition-all focus:ring-2 focus:ring-primary/20"
          {...register('display_name')}
        />
        {errors.display_name && (
          <p className="text-xs text-destructive">{errors.display_name.message}</p>
        )}
      </div>

      {/* 소개 */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm font-medium">
          소개
        </Label>
        <Textarea
          id="bio"
          placeholder="자기소개를 입력하세요"
          rows={4}
          className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
          {...register('bio')}
        />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>

      {/* 소셜 링크 */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <p className="text-sm font-medium">소셜 링크</p>

        {/* GitHub */}
        <div className="space-y-2">
          <Label htmlFor="github_url" className="text-sm font-medium flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub
          </Label>
          <Input
            id="github_url"
            type="url"
            placeholder="https://github.com/username"
            className="transition-all focus:ring-2 focus:ring-primary/20"
            {...register('github_url')}
          />
          {errors.github_url && (
            <p className="text-xs text-destructive">{errors.github_url.message}</p>
          )}
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin_url" className="text-sm font-medium flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Label>
          <Input
            id="linkedin_url"
            type="url"
            placeholder="https://linkedin.com/in/username"
            className="transition-all focus:ring-2 focus:ring-primary/20"
            {...register('linkedin_url')}
          />
          {errors.linkedin_url && (
            <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website_url" className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            웹사이트
          </Label>
          <Input
            id="website_url"
            type="url"
            placeholder="https://example.com"
            className="transition-all focus:ring-2 focus:ring-primary/20"
            {...register('website_url')}
          />
          {errors.website_url && (
            <p className="text-xs text-destructive">{errors.website_url.message}</p>
          )}
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-center text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 저장 버튼 */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            저장 중...
          </>
        ) : (
          '변경사항 저장'
        )}
      </Button>
    </form>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
