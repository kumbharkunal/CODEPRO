import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats status text by replacing underscores with spaces and capitalizing first letter of each word
 * @param status - The status string (e.g., "in_progress", "completed")
 * @returns Formatted status string (e.g., "In Progress", "Completed")
 */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
