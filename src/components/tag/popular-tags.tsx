import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export async function PopularTags() {
  const supabase = await createClient()

  // 태그별 사용 횟수를 계산하여 인기 태그 조회
  const { data: tagCounts } = await supabase
    .from('post_tags')
    .select('tag_id, tags(name, slug)')

  if (!tagCounts || tagCounts.length === 0) {
    return null
  }

  // 태그별 카운트 집계
  const countMap = new Map<string, { name: string; slug: string; count: number }>()

  for (const item of tagCounts) {
    const tag = item.tags as { name: string; slug: string }
    if (!tag) continue

    const existing = countMap.get(tag.slug)
    if (existing) {
      existing.count++
    } else {
      countMap.set(tag.slug, { name: tag.name, slug: tag.slug, count: 1 })
    }
  }

  // 상위 10개 태그 추출
  const popularTags = Array.from(countMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  if (popularTags.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">인기 태그</h2>
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag) => (
          <Link key={tag.slug} href={`/tags/${tag.slug}`}>
            <Badge variant="outline" className="hover:bg-secondary">
              {tag.name}
              <span className="ml-1 text-muted-foreground">({tag.count})</span>
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  )
}
