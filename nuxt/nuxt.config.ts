export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Susi Air | Pilot App'
    }
  },

  // for handling cookie refresh token set by backend service in frontend
  routeRules: {
    '/api/v1/**': { proxy: new URL('/api/v1/**', process.env.API_BASE_URL ?? 'https://susi-air-pilot.fly.dev').toString() }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
      today: process.env.TODAY ?? ''
    }
  },

  css: ['~/assets/css/tailwind.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  modules: ['@nuxt/icon', '@pinia/nuxt'],

  icon: {
    serverBundle: {
      collections: ['lucide']
    }
  }
})