// This script prevents theme flickering during page load
// It should be included in the document head
export function ThemeModeScript() {
  const codeToRunOnClient = `
    (function() {
      try {
        const storageKey = 'mars-theme';
        const theme = localStorage.getItem(storageKey);
        
        // Check if theme exists in localStorage
        if (theme === 'dark' || 
            (theme === 'system' && 
             window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // If localStorage is not available, do nothing
        console.error('Error accessing localStorage for theme:', e);
      }
    })();
  `;

  // Using dangerouslySetInnerHTML is necessary here to execute the script
  return <script dangerouslySetInnerHTML={{ __html: codeToRunOnClient }} />;
} 