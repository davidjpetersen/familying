/**
 * UI Utilities
 * 
 * Core utilities for UI components, including class name merging
 * and other common UI helper functions.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and merges Tailwind classes
 * This is the standard utility from shadcn/ui
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}