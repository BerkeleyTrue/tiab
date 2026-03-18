import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  return count === 1 ? singular : plural
}
