const AUTH_ROUTES = ['/login']

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value && !AUTH_ROUTES.includes(to.path)) {
    return navigateTo('/login')
  }

  if (isAuthenticated.value && AUTH_ROUTES.includes(to.path)) {
    return navigateTo('/')
  }
})
