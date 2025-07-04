'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DownloadIcon, FileTextIcon, CodeIcon } from '@radix-ui/react-icons'
import { useToast } from '@/components/ui/use-toast'

interface ContextExportMenuProps {
  contextId: string
}

export function ContextExportMenu({ contextId }: ContextExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: 'markdown' | 'html') => {
    setIsExporting(true)
    try {
      // Call the new API endpoint
      const response = await fetch(`/api/contexts/${contextId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed: ${response.statusText}`);
      }

      const result = await response.json(); // Expects { filename: string, content: string, contentType: string }
      
      if (!result.filename || typeof result.content !== 'string' || !result.contentType) {
        throw new Error('Invalid response from export API.');
      }

      const blob = new Blob([result.content], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: `Context exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export
          {isExporting && <span className="ml-2 h-4 w-4 animate-spin">⏳</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('html')}>
          <CodeIcon className="mr-2 h-4 w-4" />
          Export as HTML
        </DropdownMenuItem>
        {/* PDF export disabled for now
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled>
          <FileIcon className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 