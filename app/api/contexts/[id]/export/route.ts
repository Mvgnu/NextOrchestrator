import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContextService } from '@/lib/context-service';
import logger from '@/lib/logger';

interface ExportRequestBody {
  format: 'markdown' | 'html'; // Removed 'pdf' for now
}

export async function POST(
  req: NextRequest,
  { params }: { params: { contextId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { contextId } = params;
    if (!contextId) {
      return NextResponse.json({ message: 'Context ID is required' }, { status: 400 });
    }
    // Verify user owns the context (or has been granted access)
    const hasAccess = await ContextService.userHasAccessToContext(
      session.user.id,
      contextId
    )
    if (!hasAccess) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json() as ExportRequestBody;
    const { format } = body;

    if (!format || !['markdown', 'html'].includes(format)) {
      return NextResponse.json({ message: 'Invalid or missing format parameter. Supported formats: markdown, html.' }, { status: 400 });
    }

    const context = await ContextService.getContext(contextId);

    if (!context) {
      return NextResponse.json({ message: 'Context not found' }, { status: 404 });
    }

    let fileContentString: string;
    let filename: string;
    let contentType: string;

    // Sanitize context name for filename
    const safeContextName = context.name.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 50);

    if (format === 'markdown') {
      filename = `${safeContextName || 'context'}.md`;
      contentType = 'text/markdown';
      // Basic Markdown formatting
      fileContentString = `# ${context.name || 'Context'}\n\n`;
      if (context.metadata?.tags && context.metadata.tags.length > 0) {
        fileContentString += `**Tags:** ${context.metadata.tags.join(', ')}\n\n`;
      }
      if (context.metadata?.category) {
        fileContentString += `**Category:** ${context.metadata.category}\n\n`;
      }
      fileContentString += `${context.content || ''}`;
    } else if (format === 'html') {
      filename = `${safeContextName || 'context'}.html`;
      contentType = 'text/html';
      // Basic HTML formatting (very rudimentary)
      fileContentString = `<html><head><title>${context.name || 'Context'}</title></head><body>`;
      fileContentString += `<h1>${context.name || 'Context'}</h1>`;
      if (context.metadata?.tags && context.metadata.tags.length > 0) {
        fileContentString += `<p><strong>Tags:</strong> ${context.metadata.tags.join(', ')}</p>`;
      }
      if (context.metadata?.category) {
        fileContentString += `<p><strong>Category:</strong> ${context.metadata.category}</p>`;
      }
      // Naively convert newlines to <br> for content - proper HTML would use a Markdown-to-HTML library
      const htmlContent = (context.content || '').replace(/\n/g, '<br />');
      fileContentString += `<div>${htmlContent}</div>`;
      fileContentString += `</body></html>`;
    } else {
      // Should not happen due to format validation, but as a safeguard
      return NextResponse.json({ message: 'Unsupported format' }, { status: 400 });
    }

    return NextResponse.json({
      filename: filename,
      content: fileContentString,
      contentType: contentType
    });

  } catch (error: any) {
    logger.error({ err: error, contextId: params.contextId, method: req.method }, 'Error exporting context');
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
