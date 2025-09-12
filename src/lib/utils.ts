import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date/time explicitly in Israel time (Asia/Jerusalem)
// Output example: "13:00:00 ,13.9.2025" to match app style
export function formatIsraelDateTime(input: string | Date) {
  const date = typeof input === 'string' ? new Date(input) : input;
  const tz = 'Asia/Jerusalem';
  const time = new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    timeZone: tz,
  }).format(date);
  const day = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric', month: 'numeric', year: 'numeric', timeZone: tz,
  }).format(date);
  return `${time} ,${day}`;
}
