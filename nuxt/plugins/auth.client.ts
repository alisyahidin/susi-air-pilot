/**
 * The access token is only in memory, so a reload loses it. If the hint cookie says someone
 * is signed in, get a new one from the refresh cookie. If that session is gone (expired,
 * revoked, signed out elsewhere), send them to /login.
 *
 * Runs once the app has mounted, so hydration always matches the server-rendered page;
 * requests made before then still wait for this refresh (useAuthStore().getAccessToken()).
 */
export default defineNuxtPlugin({
  name: 'auth-restore',
  dependsOn: ['pinia'],
  setup(nuxtApp) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return

    nuxtApp.hook('app:mounted', async () => {
      const restored = await auth.refresh()
      if (!restored && !auth.isAuthenticated && useRoute().path !== '/login') {
        await nuxtApp.runWithContext(() => navigateTo('/login', { replace: true }))
      }
    })
  }
})
