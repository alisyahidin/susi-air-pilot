import { FetchError, type FetchOptions } from 'ofetch'

/**
 * `$api`: $fetch for the Nest API with the in-memory access token as a Bearer header.
 * Refreshes the token before it expires, and once more on a 401 before giving up and
 * sending the user to /login.
 *
 * The token only exists in the browser, so load signed-in data client-side:
 *   useLazyAsyncData('schedules', () => $api('/schedules', { query }), { server: false })
 */
export default defineNuxtPlugin({
  name: 'api',
  dependsOn: ['pinia'],
  setup(nuxtApp) {
    const auth = useAuthStore()
    const raw = $fetch.create({ baseURL: useApiBase() })

    async function send<T>(request: string, options: FetchOptions<'json'>): Promise<T> {
      const headers = new Headers(options.headers as HeadersInit | undefined)
      const token = await auth.getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return raw<T>(request, { ...options, headers })
    }

    async function api<T = unknown>(request: string, options: FetchOptions<'json'> = {}): Promise<T> {
      try {
        return await send<T>(request, options)
      } catch (error) {
        const unauthorized = error instanceof FetchError && error.statusCode === 401
        if (import.meta.client && unauthorized && auth.isAuthenticated) {
          if (await auth.refresh()) return send<T>(request, options)
          auth.clearSession()
          await nuxtApp.runWithContext(() => navigateTo('/login', { replace: true }))
        }
        throw error
      }
    }

    return { provide: { api } }
  }
})
