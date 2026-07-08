import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Durations are stored as strings ("3:45" or "1:02:30"). Fold the colon-parts
// left-to-right so both M:SS and H:MM:SS work: 3:45 → 3*60+45, 1:02:30 → ((1*60)+2)*60+30.
export function durationToSeconds(str) {
  if (!str) return 0
  const parts = str.split(":").map(Number)
  if (parts.some(isNaN)) return 0
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

// Rounds to the nearest minute and renders "H:MM" (used for setlist totals).
export function formatDuration(secs) {
  const totalMin = Math.round(secs / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}:${String(m).padStart(2, "0")}`
}

// self-check
console.assert(durationToSeconds("3:45") === 225, "M:SS parse")
console.assert(durationToSeconds("1:02:30") === 3750, "H:MM:SS parse")
console.assert(durationToSeconds("") === 0 && durationToSeconds("bad") === 0, "empty/garbage → 0")
console.assert(formatDuration(2700) === "0:45", "45 min → 0:45")
console.assert(formatDuration(3630) === "1:01", "60.5 min rounds up → 1:01")
console.assert(formatDuration(3600) === "1:00", "exact hour → 1:00")
