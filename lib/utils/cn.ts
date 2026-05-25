/**
 * Utility: className builder with Tailwind merge.
 * Combines `clsx` (conditional classes) with `tailwind-merge`
 * (resolves Tailwind conflicts like `px-2 px-4` → `px-4`).
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
