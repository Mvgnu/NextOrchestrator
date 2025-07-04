/**
 * Utilities for converting various formats to markdown
 */

/**
 * Converts plain text to markdown format
 * @param text The plain text to convert
 * @returns Formatted markdown text
 */
export function textToMarkdown(text: string): string {
  if (!text) return '';
  
  // Split text into lines for processing
  let lines = text.split('\n');
  
  // Detect headings (lines followed by ===== or -----)
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] && lines[i+1]) {
      // Check for heading level 1 (======)
      if (/^=+$/.test(lines[i+1])) {
        lines[i] = `# ${lines[i]}`;
        lines[i+1] = '';
      }
      // Check for heading level 2 (------)
      else if (/^-+$/.test(lines[i+1])) {
        lines[i] = `## ${lines[i]}`;
        lines[i+1] = '';
      }
    }
  }
  
  // Process each line
  lines = lines.map(line => {
    // Skip empty lines
    if (!line.trim()) return line;
    
    // Check for headings (# or ## at start)
    if (/^#+ /.test(line)) return line;
    
    // Detect numbered lists
    if (/^\d+\.\s+/.test(line)) return line;
    
    // Detect bullet lists
    if (/^[\*\-\+]\s+/.test(line)) return line;
    
    // Detect potential headers by length and capitalization
    if (line.length < 80 && line.toUpperCase() === line && line.length > 10) {
      return `## ${line}`;
    }
    
    // Add paragraph breaks for better readability
    if (line.length > 1) {
      return line + '\n';
    }
    
    return line;
  });
  
  // Join lines back together
  let markdown = lines.join('\n');
  
  // Identify and format code blocks (indented by 4+ spaces)
  markdown = markdown.replace(/(\n {4,}[^\n]+)+/g, match => 
    '\n```\n' + match.replace(/\n {4}/g, '\n') + '\n```\n'
  );
  
  // Convert URLs to markdown links
  markdown = markdown.replace(
    /(\s|^)(https?:\/\/[^\s]+)/g, 
    (match, space, url) => `${space}[${url}](${url})`
  );
  
  return markdown;
}

/**
 * Extracts key sections from a larger markdown document
 * @param markdown The markdown text to process
 * @returns Structured markdown with identified sections
 */
export function extractMarkdownSections(markdown: string): { title: string; content: string }[] {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const sections: { title: string; content: string }[] = [];
  
  let currentSection: { title: string; content: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect headings
    if (/^#+\s+(.+)$/.test(line)) {
      // Save current section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Create new section
      const title = line.replace(/^#+\s+/, '');
      currentSection = { title, content: line + '\n' };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    } else {
      // If no current section, create a default one
      currentSection = { 
        title: 'Introduction', 
        content: line + '\n' 
      };
    }
  }
  
  // Add final section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Processes a document for agent consumption
 * @param content The source content
 * @param format Optional format hint (e.g., 'text', 'html', etc.)
 * @returns Processed markdown ready for agent context
 */
export function processDocumentForAgents(
  content: string, 
  format: string = 'text'
): string {
  // Convert to markdown if it's not already
  let markdown = format === 'markdown' ? content : textToMarkdown(content);
  
  // Extract sections
  const sections = extractMarkdownSections(markdown);
  
  // Rebuild with section metadata
  let processedMarkdown = '';
  
  sections.forEach((section, index) => {
    processedMarkdown += `${section.content}\n\n`;
  });
  
  return processedMarkdown;
} 