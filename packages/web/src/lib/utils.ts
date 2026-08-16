/**
 * Get the current date and time in datetime-local format (YYYY-MM-DDTHH:mm).
 */
export function getCurrentDateTimeLocal (): string {
  const now = new Date()
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert a datetime-local input value to an ISO 8601 string with local timezone offset.
 * The datetime-local format (YYYY-MM-DDTHH:mm) is interpreted as local time,
 * and converted to ISO string with the local timezone offset (e.g., 2026-07-02T14:30:00-05:00).
 */
export function localDateTimeToISO (localDateTimeStr: string | null | undefined): string | null {
  if (localDateTimeStr === null || localDateTimeStr === undefined) return null

  const trimmed = localDateTimeStr.trim()
  if (trimmed === '') return null

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed)
  if (match === null) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])

  // Build a local date and verify calendar/time values remain intact.
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    Number.isNaN(localDate.getTime()) ||
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day ||
    localDate.getHours() !== hours ||
    localDate.getMinutes() !== minutes
  ) {
    return null
  }

  // Get local timezone offset
  const offset = localDate.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset <= 0 ? '+' : '-'
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`

  // Format the ISO string with local timezone offset
  const yearStr = String(year).padStart(4, '0')
  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  const hoursStr = String(hours).padStart(2, '0')
  const minutesStr = String(minutes).padStart(2, '0')
  const secondsStr = '00'

  return `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:${secondsStr}${offsetStr}`
}
