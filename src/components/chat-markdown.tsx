'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

type ChatMarkdownProps = {
  content: string
  className?: string
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn('chat-markdown text-sm leading-relaxed', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-0 mb-2 text-base font-semibold tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-3 mb-1.5 text-sm font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-2 mb-1 text-sm font-medium">{children}</h3>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        code: ({ className: codeClassName, children }) => {
          const isBlock = codeClassName?.includes('language-')
          if (isBlock) {
            return (
              <code className={cn('font-mono text-xs', codeClassName)}>{children}</code>
            )
          }
          return (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
          )
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md border bg-muted/50 p-2 text-xs last:mb-0">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        hr: () => <hr className="my-3 border-border" />,
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted/50 px-2 py-1 text-left font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}
