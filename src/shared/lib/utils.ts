/**
 * Utility Functions
 *
 * Common utility functions for the application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 *
 * @param inputs - Class names to merge
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4'
 * cn('text-red-500', someCondition && 'text-blue-500') // Conditional classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
