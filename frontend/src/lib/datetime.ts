/** Converts an ISO datetime string to the value a `<input type="datetime-local">`
 * expects ("YYYY-MM-DDTHH:mm", local time, no seconds/offset), or '' for null. */
export function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Converts a `<input type="datetime-local">` value back to an ISO string,
 * or null for an empty value. */
export function datetimeLocalToIso(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}
