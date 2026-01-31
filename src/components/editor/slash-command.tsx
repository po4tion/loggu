'use client'

import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
  type SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  ImageIcon,
  Link,
  Lightbulb,
} from 'lucide-react'
import type { Editor, Range } from '@tiptap/core'

interface CommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (props: { editor: Editor; range: Range }) => void
}

const commands: CommandItem[] = [
  {
    title: 'Text',
    description: 'Start writing with plain text',
    icon: <Type className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Big heading',
    icon: <Heading1 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: <Heading2 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: <Heading3 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: <List className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a simple numbered list',
    icon: <ListOrdered className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: <Quote className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax highlighting',
    icon: <Code className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Divider',
    description: 'Insert a dividing line',
    icon: <Minus className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Callout',
    description: 'Add a callout block',
    icon: <Lightbulb className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'callout' })
        .run()
    },
  },
  {
    title: 'Image',
    description: 'Insert an image from URL',
    icon: <ImageIcon className="h-5 w-5" />,
    command: ({ editor, range }) => {
      // Delete the slash command range
      editor.chain().focus().deleteRange(range).run()

      // Dispatch custom event to open image popover
      window.dispatchEvent(new CustomEvent('openImagePopover'))
    },
  },
  {
    title: 'Link',
    description: 'Insert a link',
    icon: <Link className="h-5 w-5" />,
    command: ({ editor, range }) => {
      const placeholderText = 'Edit this text'
      // Delete the slash command range and insert placeholder link
      editor.chain().focus().deleteRange(range).insertContent(`<a href="#">${placeholderText}</a>`).run()

      // Set selection after content is inserted
      const { to } = editor.state.selection
      editor.chain().setTextSelection({ from: to - placeholderText.length, to }).run()

      // Dispatch custom event to open link popover
      window.dispatchEvent(new CustomEvent('openLinkPopover'))
    },
  },
]

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Clamp selectedIndex to valid range when items change
    const safeSelectedIndex = items.length > 0 ? selectedIndex % items.length : 0

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    // Scroll to selected item
    useEffect(() => {
      const selectedElement = itemRefs.current[safeSelectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }, [safeSelectedIndex])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(safeSelectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-popover text-popover-foreground rounded-lg border p-3 shadow-lg">
          <p className="text-muted-foreground text-sm">No results</p>
        </div>
      )
    }

    return (
      <div className="bg-popover text-popover-foreground max-h-80 overflow-y-auto rounded-lg border shadow-lg">
        <div className="text-muted-foreground px-3 py-2 text-xs font-medium">
          Basic
        </div>
        {items.map((item, index) => (
          <button
            key={item.title}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            type="button"
            onClick={() => selectItem(index)}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === safeSelectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <span className="text-muted-foreground">{item.icon}</span>
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

const suggestionConfig: Omit<SuggestionOptions<CommandItem>, 'editor'> = {
  items: ({ query }: { query: string }) => {
    return commands.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },
  render: () => {
    let component: ReactRenderer<CommandListRef> | null = null
    let popup: TippyInstance[] | null = null

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },
      onUpdate: (props: SuggestionProps<CommandItem>) => {
        component?.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }

        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: CommandItem
        }) => {
          props.command({ editor, range })
        },
        ...suggestionConfig,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
