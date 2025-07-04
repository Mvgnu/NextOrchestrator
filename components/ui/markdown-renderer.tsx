'use client'

import React, { useState, useEffect, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkCodeTitles from 'remark-code-titles'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import {
  NavigationMenuLink,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu'
import { ExternalLinkIcon } from '@radix-ui/react-icons'

// Create shiki highlighter instance
let shikiHighlighter: any = null

interface MarkdownRendererProps extends React.HTMLProps<HTMLDivElement> {
  content: string
  showTableOfContents?: boolean
  className?: string
}

interface HeadingItem {
  id: string
  text: string
  level: number
}

const extractHeadings = (markdown: string): HeadingItem[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: HeadingItem[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    // Create a slug from the text
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    
    headings.push({ id, text, level })
  }

  return headings
}

// Create a code component with syntax highlighting
const CodeBlock = memo(({ className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)

  useEffect(() => {
    const highlightCode = async () => {
      if (typeof window !== 'undefined' && !shikiHighlighter) {
        try {
          const { getHighlighter } = await import('shiki')
          shikiHighlighter = await getHighlighter({
            theme: 'github-dark',
            langs: ['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'json', 'bash', 'markdown', 'python']
          })
        } catch (err) {
          console.error('Failed to load Shiki highlighter:', err)
        }
      }

      if (shikiHighlighter && children) {
        try {
          const code = String(children).replace(/\n$/, '')
          const tokens = shikiHighlighter.codeToHtml(code, { lang: lang || 'text' })
          setHighlightedCode(tokens)
        } catch (err) {
          console.error('Failed to highlight code:', err)
          setHighlightedCode(`<pre><code>${String(children)}</code></pre>`)
        }
      }
    }

    highlightCode()
  }, [children, lang])

  if (!highlightedCode) {
    return (
      <pre className={cn("p-4 rounded-md bg-muted overflow-auto", className)}>
        <code {...props}>{children}</code>
      </pre>
    )
  }

  return (
    <div 
      className={cn("relative p-0 rounded-md bg-muted overflow-auto", className)}
      dangerouslySetInnerHTML={{ __html: highlightedCode }} 
    />
  )
})
CodeBlock.displayName = 'CodeBlock'

export const MarkdownRenderer = ({ 
  content, 
  showTableOfContents = false,
  className,
  ...props 
}: MarkdownRendererProps) => {
  const headings = extractHeadings(content)
  
  // Custom components for ReactMarkdown
  const components = {
    code: CodeBlock,
    h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold mb-6 mt-8 scroll-m-20" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-2xl font-semibold mb-4 mt-8 scroll-m-20" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-xl font-semibold mb-3 mt-6 scroll-m-20" {...props} />,
    h4: ({ node, ...props }: any) => <h4 className="text-lg font-semibold mb-2 mt-6 scroll-m-20" {...props} />,
    h5: ({ node, ...props }: any) => <h5 className="text-base font-semibold mb-2 mt-4 scroll-m-20" {...props} />,
    h6: ({ node, ...props }: any) => <h6 className="text-sm font-semibold mb-2 mt-4 scroll-m-20" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-4 leading-7" {...props} />,
    a: ({ node, href, ...props }: any) => {
      const isExternal = href?.startsWith('http')
      return (
        <a 
          href={href} 
          className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-0.5" 
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {props.children}
          {isExternal && <ExternalLinkIcon className="h-3 w-3" />}
        </a>
      )
    },
    ul: ({ node, ordered, ...props }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
    ol: ({ node, ordered, ...props }: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
    li: ({ node, ...props }: any) => <li {...props} />,
    blockquote: ({ node, ...props }: any) => (
      <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-6" {...props} />
    ),
    hr: ({ node, ...props }: any) => <hr className="my-8 border-muted" {...props} />,
    img: ({ node, alt, ...props }: any) => (
      <img className="rounded-md max-w-full h-auto my-4" alt={alt} {...props} />
    ),
    table: ({ node, ...props }: any) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-muted" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="m-0 border-t p-0 even:bg-muted/50" {...props} />,
    th: ({ node, ...props }: any) => (
      <th className="border px-4 py-2 text-left font-semibold" {...props} />
    ),
    td: ({ node, ...props }: any) => <td className="border px-4 py-2 text-left" {...props} />,
  }

  return (
    <div className={cn("markdown-content flex flex-col-reverse md:flex-row gap-6", className)} {...props}>
      <div className="flex-1 max-w-full overflow-x-auto prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkCodeTitles]}
          rehypePlugins={[rehypeSanitize, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }], rehypeRaw]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {showTableOfContents && headings.length > 0 && (
        <div className="w-full md:w-64 md:flex-shrink-0 sticky top-0 h-fit pt-4">
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-medium mb-3">Table of Contents</h3>
            <NavigationMenu orientation="vertical" className="max-w-full w-full">
              <NavigationMenuList className="flex flex-col items-start space-y-1">
                {headings.map((heading, index) => (
                  <NavigationMenuItem key={index} className={cn("w-full", heading.level > 2 && "pl-4")}>
                    <NavigationMenuLink 
                      href={`#${heading.id}`}
                      className={cn(
                        "block w-full text-sm truncate overflow-hidden text-muted-foreground hover:text-foreground py-1 px-2 rounded-md",
                        heading.level === 1 && "font-semibold text-foreground",
                        heading.level === 2 && "font-medium"
                      )}
                    >
                      {heading.text}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      )}
    </div>
  )
} 