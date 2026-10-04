// Single source of auth status for middleware, layouts and the error page.
// Dummy until sign-in is wired to the API: flip the default to test the signed-out state.
export function useAuth() {
  const isAuthenticated = useState<boolean>('auth:authenticated', () => true)

  return { isAuthenticated }
}
