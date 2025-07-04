import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

export function useThemeDetector() {
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  
  useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkTheme(darkThemeMq.matches)
    
    const handler = (e: MediaQueryListEvent) => setIsDarkTheme(e.matches)
    darkThemeMq.addEventListener('change', handler)
    return () => darkThemeMq.removeEventListener('change', handler)
  }, [])
  
  return isDarkTheme
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
    
  return systemTheme
} 