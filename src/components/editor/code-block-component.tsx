'use client'

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Copy, Trash2 } from 'lucide-react'
import type { NodeViewProps } from '@tiptap/react'

const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'graphql', label: 'GraphQL' },
]

export function CodeBlockComponent({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentLanguage = node.attrs.language || 'plaintext'
  const currentLabel =
    LANGUAGES.find((l) => l.value === currentLanguage)?.label ||
    currentLanguage ||
    'Plain Text'

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleCopy = async () => {
    const code = node.textContent
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSelectLanguage = (value: string) => {
    updateAttributes({ language: value })
    setIsOpen(false)
    setSearch('')
  }

  return (
    <NodeViewWrapper className="code-block-wrapper my-4">
      <div className="rounded-lg border border-neutral-700 bg-neutral-900">
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-neutral-700 px-3 py-2">
          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
            >
              <span>{currentLabel}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 z-[9999] mt-1 w-56 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
                <div className="border-b border-neutral-700 p-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search language..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.value)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        currentLanguage === lang.value
                          ? 'bg-neutral-700 font-semibold text-white'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="m-0 overflow-x-auto bg-neutral-900 p-4">
          <code
            className="block bg-neutral-900 text-sm text-neutral-200"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            <NodeViewContent className="bg-neutral-900 outline-none" />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  )
}
