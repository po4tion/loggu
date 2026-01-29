'use client'

import { useEffect, useState, useMemo } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  // useMemo로 items 계산 (렌더링 중에 동기적으로)
  const items = useMemo(() => {
    if (typeof window === 'undefined') return []

    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3')

    const tocItems: TocItem[] = []
    headings.forEach((heading, index) => {
      const text = heading.textContent || ''
      const id = `heading-${index}`
      const level = parseInt(heading.tagName[1])
      tocItems.push({ id, text, level })
    })

    return tocItems
  }, [content])

  useEffect(() => {
    // DOM에서 실제 헤딩에 id 부여
    const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3')
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`
    })

    // 스크롤 이벤트로 현재 활성 헤딩 추적
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) {
    return null
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <nav className="hidden xl:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto">
      <h2 className="text-sm font-semibold mb-4">목차</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left hover:text-foreground transition-colors ${
                activeId === item.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
