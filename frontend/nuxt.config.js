export default defineNuxtConfig({
  ssr: false,

  modules: ['vuetify-nuxt-module'],

  vuetify: {
    moduleOptions: {
      styles: { configFile: './assets/vuetify.scss' },
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'nottario',
        themes: {
          nottario: {
            dark: false,
            colors: {
              primary:    '#1a3a5c',
              secondary:  '#2a5a8c',
              accent:     '#1a7a4a',
              background: '#f7f5f0',
              surface:    '#ffffff',
              error:      '#c0392b',
            },
          },
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      urlCheckout: process.env.NUXT_PUBLIC_URL_CHECKOUT ?? '',
      urlNotarise: process.env.NUXT_PUBLIC_URL_NOTARISE ?? '',
      urlReceipt:  process.env.NUXT_PUBLIC_URL_RECEIPT  ?? '',
      urlVerify:   process.env.NUXT_PUBLIC_URL_VERIFY   ?? '',
    },
  },

  app: {
    head: {
      title: 'Nottario — Document Notarisation',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap' },
      ],
    },
  },
})
