import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string into a human-readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string in the format "MMM d, yyyy"
 */
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, yyyy")
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

/**
 * Convert a date string to a human-readable relative time (e.g., "2 days ago")
 * @param dateString - ISO date string to format
 * @returns Relative time string
 */
export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return dateString
  }
}

/**
 * Truncate a string to a specified length
 * @param str - String to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number = 100): string {
  if (!str) return ""
  return str.length > length ? str.substring(0, length) + "..." : str
}

/**
 * Delay execution for a specified number of milliseconds
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
