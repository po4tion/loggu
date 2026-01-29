'use client'

import { useEffect } from 'react'
import sanitizeHtml from 'sanitize-html'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github-dark.css'

// 언어 등록
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sql', sql)

interface PostContentProps {
  content: string | null
}

export function PostContent({ content }: PostContentProps) {
  useEffect(() => {
    // 코드 블록 하이라이팅
    document.querySelectorAll('pre code').forEach((block) => {
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block as HTMLElement)
      }
    })
  }, [content])

  if (!content) {
    return <p className="text-muted-foreground">내용이 없습니다.</p>
  }

  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'strong',
      'em',
      's',
      'u',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'iframe',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      code: ['class'],
      pre: ['class'],
      div: ['class', 'data-youtube-video'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder'],
      span: ['class', 'data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
  })

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none text-content [&_pre]:bg-[#0d1117] [&_pre]:p-4 [&_pre]:rounded-lg [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
