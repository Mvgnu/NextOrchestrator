'use client'

import React, { useState, useEffect, memo, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
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
import { Button } from '@/components/ui/button'
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'

// Create shiki highlighter instance
let shikiHighlighter: any = null
let shikiLoading = false
let shikiQueue: Function[] = []

// Constants for optimization
const CHUNK_SIZE = 5000 // Characters per chunk
const VIEWPORT_THRESHOLD = 300 // px above/below viewport to render

interface OptimizedMarkdownRendererProps extends React.HTMLProps<HTMLDivElement> {
  content: string
  showTableOfContents?: boolean
  className?: string
  maxInitialRender?: number // Maximum content length to render initially
}

interface HeadingItem {
  id: string
  text: string
  level: number
  position: number // Character position in document
}

// Optimized heading extraction
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
    
    headings.push({ 
      id, 
      text, 
      level,
      position: match.index 
    })
  }

  return headings
}

// Lazy load Shiki
const getLazyHighlighter = async () => {
  if (shikiHighlighter) return shikiHighlighter
  
  if (shikiLoading) {
    // Return a promise that will resolve when the highlighter is loaded
    return new Promise<any>(resolve => {
      shikiQueue.push(resolve)
    })
  }
  
  shikiLoading = true
  
  try {
    const { getHighlighter } = await import('shiki')
    shikiHighlighter = await getHighlighter({
      theme: 'github-dark',
      langs: ['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'json', 'bash', 'markdown', 'python']
    })
    
    // Resolve all queued promises
    shikiQueue.forEach(resolve => resolve(shikiHighlighter))
    shikiQueue = []
    
    return shikiHighlighter
  } catch (err) {
    console.error('Failed to load Shiki highlighter:', err)
    shikiLoading = false
    shikiQueue = []
    return null
  }
}

// Create a code component with on-demand syntax highlighting
const CodeBlock = memo(({ className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  useEffect(() => {
    if (!isVisible || highlightedCode) return
    
    const highlightCode = async () => {
      try {
        const highlighter = await getLazyHighlighter()
        
        if (highlighter && children) {
          const code = String(children).replace(/\n$/, '')
          const tokens = highlighter.codeToHtml(code, { lang: lang || 'text' })
          setHighlightedCode(tokens)
        }
      } catch (err) {
        console.error('Failed to highlight code:', err)
        setHighlightedCode(`<pre><code>${String(children)}</code></pre>`)
      }
    }

    highlightCode()
  }, [children, lang, isVisible, highlightedCode])

  return (
    <div ref={ref} className="relative">
      {!isVisible || !highlightedCode ? (
        <pre className={cn("p-4 rounded-md bg-muted/50 overflow-auto min-h-[60px]", className)}>
          <code {...props}>{isVisible ? children : ''}</code>
        </pre>
      ) : (
        <div 
          className={cn("relative p-0 rounded-md bg-muted overflow-auto", className)}
          dangerouslySetInnerHTML={{ __html: highlightedCode }} 
        />
      )}
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

// Split content into chunks for progressive rendering
const splitContentIntoChunks = (content: string, chunkSize: number = CHUNK_SIZE) => {
  // Try to split at paragraph boundaries
  const paragraphs = content.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }
  
  return chunks
}

export function OptimizedMarkdownRenderer({ 
  content, 
  showTableOfContents = false,
  className,
  maxInitialRender = 10000, // Default to showing first 10K chars immediately
  ...props 
}: OptimizedMarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(content.length, maxInitialRender) })
  const [expandAll, setExpandAll] = useState(content.length <= maxInitialRender)
  
  // Memoize content chunking
  const chunks = useMemo(() => 
    splitContentIntoChunks(content), 
    [content]
  )
  
  // Memoize which chunks are currently visible
  const visibleChunks = useMemo(() => {
    if (expandAll) return chunks
    
    let visibleContent = ''
    let currentLength = 0
    const visibleChunks = []
    
    for (const chunk of chunks) {
      if (currentLength > visibleRange.end) break
      
      if (currentLength + chunk.length >= visibleRange.start) {
        visibleChunks.push(chunk)
      }
      
      currentLength += chunk.length
    }
    
    return visibleChunks
  }, [chunks, visibleRange, expandAll])
  
  // Extract headings once for efficiency
  const headings = useMemo(() => 
    extractHeadings(content),
    [content]
  )
  
  // Track scroll position to dynamically load content
  useEffect(() => {
    if (expandAll) return
    
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const viewportTop = -VIEWPORT_THRESHOLD
      const viewportBottom = window.innerHeight + VIEWPORT_THRESHOLD
      
      // If container is within view
      if (rect.bottom >= viewportTop && rect.top <= viewportBottom) {
        const visibleStart = Math.max(0, visibleRange.start - CHUNK_SIZE)
        const visibleEnd = Math.min(content.length, visibleRange.end + CHUNK_SIZE)
        
        if (visibleStart < visibleRange.start || visibleEnd > visibleRange.end) {
          setVisibleRange({ start: visibleStart, end: visibleEnd })
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleRange, content.length, expandAll])
  
  // Custom components for ReactMarkdown
  const components = useMemo(() => ({
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
      <Image
        className="rounded-md max-w-full h-auto my-4"
        alt={alt}
        loading="lazy"
        width={0}
        height={0}
        sizes="100vw"
        {...props}
      />
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
  }), [])

  // Handle "Load more" / "Expand all" button click
  const handleExpandClick = useCallback(() => {
    setExpandAll(true)
  }, [])

  // Handle "Collapse" button click
  const handleCollapseClick = useCallback(() => {
    setExpandAll(false)
    setVisibleRange({ start: 0, end: Math.min(content.length, maxInitialRender) })
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [content.length, maxInitialRender])

  return (
    <div className={cn("markdown-content flex flex-col-reverse md:flex-row gap-6", className)} {...props}>
      <div ref={containerRef} className="flex-1 max-w-full overflow-x-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {visibleChunks.map((chunk, i) => (
            <div key={i} className="markdown-chunk">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkCodeTitles]}
                rehypePlugins={[rehypeSanitize, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }], rehypeRaw]}
                components={components}
              >
                {chunk}
              </ReactMarkdown>
            </div>
          ))}
          
          {!expandAll && visibleRange.end < content.length && (
            <div className="my-8 text-center">
              <Button 
                onClick={handleExpandClick}
                variant="outline"
                className="gap-1"
              >
                <ChevronDownIcon className="h-4 w-4" />
                Load More
              </Button>
              
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round((visibleRange.end / content.length) * 100)}% of document loaded
              </p>
            </div>
          )}
          
          {expandAll && content.length > maxInitialRender && (
            <div className="my-8 text-center">
              <Button 
                onClick={handleCollapseClick}
                variant="outline"
                className="gap-1"
              >
                <ChevronUpIcon className="h-4 w-4" />
                Collapse Document
              </Button>
            </div>
          )}
        </div>
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
                      onClick={() => {
                        // Ensure section is loaded when navigating from TOC
                        const position = heading.position
                        if (position > visibleRange.end || position < visibleRange.start) {
                          // Expand to show this section
                          setExpandAll(true)
                        }
                      }}
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