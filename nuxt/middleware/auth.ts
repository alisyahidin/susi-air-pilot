function isAuthenticated (): boolean { return false }

const AUTH_ROUTES = ['/login']

export default defineNuxtRouteMiddleware((to, from) => {
  if (!isAuthenticated() && !AUTH_ROUTES.includes(to.path)) {
    return navigateTo('/login')
  }

  if (isAuthenticated() && AUTH_ROUTES.includes(to.path)) {
    return navigateTo('/')
  }
})