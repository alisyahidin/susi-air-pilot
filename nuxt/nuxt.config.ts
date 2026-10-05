export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Susi Air | Pilot App'
    }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001'
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