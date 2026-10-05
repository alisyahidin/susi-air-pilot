import { FetchError } from 'ofetch'

export interface AuthUser {
  id: string
  name: string
  username: string
  image_url: string
}

interface SessionResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

const HINT_COOKIE = 'susi_session'
const HINT_MAX_AGE = 60 * 60 * 24 * 30 // the API's refresh token lifetime (JWT_REFRESH_TTL, 30d)
const REFRESH_EARLY_MS = 30_000 // refresh this long before the access token expires

// One refresh at a time per tab; Web Locks queue them across tabs (see refresh())
let inflightRefresh: Promise<boolean> | null = null

export function useApiBase() {
  return new URL('/api/v1', useRuntimeConfig().public.apiBaseUrl).toString();
}

/**
 * - The access token lives only in memory (this store): gone on reload, never in storage or cookies.
 * - The refresh token is an httpOnly cookie the API sets on /api/v1/auth: page scripts can't read it.
 * - The hint cookie holds only who is signed in, so server rendering and route middleware know.
 */
export const useAuthStore = defineStore('auth', () => {
  const apiBase = useApiBase()
  const hint = useCookie<{ user: AuthUser } | null>(HINT_COOKIE, {
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: HINT_MAX_AGE,
    default: () => null
  })

  const accessToken = ref<string | null>(null)
  const expiresAt = ref(0)
  const user = ref<AuthUser | null>(hint.value?.user ?? null)

  const isAuthenticated = computed(() => !!user.value)

  function setSession(session: SessionResponse) {
    accessToken.value = session.accessToken
    expiresAt.value = Date.now() + session.expiresIn * 1000
    user.value = session.user
    hint.value = { user: session.user }
  }

  function clearSession() {
    accessToken.value = null
    expiresAt.value = 0
    user.value = null
    hint.value = null
  }

  async function login(credentials: { username: string, password: string }) {
    setSession(await $fetch<SessionResponse>('/auth/login', {
      baseURL: apiBase,
      method: 'POST',
      body: credentials,
      credentials: 'include'
    }))
  }

  async function logout() {
    await $fetch('/auth/logout', { baseURL: apiBase, method: 'POST', credentials: 'include' }).catch(() => {})
    clearSession()
  }

  /**
   * Gets a new access token with the refresh cookie. Resolves false when there's no valid
   * session (and signs out locally), or when the API couldn't be reached (session kept).
   */
  function refresh(): Promise<boolean> {
    if (import.meta.server) return Promise.resolve(false)
    inflightRefresh ??= (async () => {
      const request = () => $fetch<SessionResponse>('/auth/refresh', { baseURL: apiBase, method: 'POST', credentials: 'include' })
      try {
        setSession(navigator.locks ? await navigator.locks.request('susi-auth-refresh', request) : await request())
        return true
      } catch (error) {
        if (error instanceof FetchError && (error.statusCode === 401 || error.statusCode === 403)) clearSession()
        return false
      }
    })().finally(() => { inflightRefresh = null })
    return inflightRefresh
  }

  async function getAccessToken(): Promise<string | null> {
    if (!isAuthenticated.value) return null
    if (!accessToken.value || expiresAt.value - Date.now() < REFRESH_EARLY_MS) await refresh()
    return accessToken.value
  }

  return { user, isAuthenticated, accessToken, login, logout, refresh, getAccessToken, clearSession }
})
