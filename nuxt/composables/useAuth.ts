export function useAuth() {
  const store = useAuthStore()
  const { user, isAuthenticated } = storeToRefs(store)

  async function logout() {
    await store.logout()
    await navigateTo('/login', { replace: true })
  }

  return { user, isAuthenticated, login: store.login, logout }
}
