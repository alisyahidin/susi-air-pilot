/**
 * The app's "today" as YYYY-MM-DD. TODAY in .env simulates a date so the mock data lines
 * up (e.g. 2026-05-15); without it, the real date (UTC) is used.
 */
export function useToday() {
  return useRuntimeConfig().public.today || new Date().toISOString().slice(0, 10)
}
