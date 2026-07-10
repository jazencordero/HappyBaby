import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, differenceInMonths, differenceInYears } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAge(dateOfBirth: string): string {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const now = new Date()
  const years = differenceInYears(now, dob)
  if (years >= 2) return `${years} years old`
  const months = differenceInMonths(now, dob)
  if (months >= 1) return `${months} month${months === 1 ? "" : "s"} old`
  const days = Math.max(differenceInDays(now, dob), 0)
  return `${days} day${days === 1 ? "" : "s"} old`
}
