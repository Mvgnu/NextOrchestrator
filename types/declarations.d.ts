// Add declaration for remark-code-titles
declare module 'remark-code-titles';

// Fix the shiki type issue
declare module 'shiki' {
  export interface HighlighterOptions {
    theme?: string;
    langs?: string[];
  }
  
  export interface Highlighter {
    codeToHtml(code: string, options: { lang: string }): string;
  }
  
  export function getHighlighter(options: HighlighterOptions): Promise<Highlighter>;
} 