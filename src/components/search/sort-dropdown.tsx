'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회수순' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']

export function SortDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('sort') as SortOption) || 'latest'

  const handleSortChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'latest') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }

    // 정렬 변경 시 페이지 리셋
    params.delete('page')

    router.push(`/?${params.toString()}`)
  }

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-[130px]" aria-label="정렬 방식 선택">
        <SelectValue placeholder="정렬" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
