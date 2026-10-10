// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/icon/module', '@nuxtjs/i18n'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Sistem warna. Satu-satunya sumber warna di proyek ini.
  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      // Pemindaian dependensi otomatis dimatikan.
      //
      // Alasannya: @nuxtjs/i18n mengimpor NuxtLink lewat alias virtual
      // "#components". Alias itu hanya dibuat setelah Nuxt selesai
      // membangun diri sendiri, jadi pemindai Vite tidak bisa
      // me-resolve-nya dan build gagal di tahap dep-scan.
      //
      // Build sebenarnya tetap berhasil — yang gagal hanya pra-bundling.
      // Matikan pindai karena Vite 8 memakai rolldown yang sudah
      // menangani ESM secara native, jadi pra-bundling tidak dibutuhkan.
      noDiscovery: true
    }
  },

  runtimeConfig: {
    public: {
      // Domain situs. Tidak di hardcode di sini, hanya diisi lewat .env:
      //   NUXT_PUBLIC_SITE_URL=https://domain-anda.com
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL
    }
  },

  i18n: {
    // Dipakai untuk membuat URL absolut pada tag hreflang dan canonical.
    // Kalau .env belum ada, salin dari .env.example lalu restart.
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
    // Semua URL diawali kode bahasa, termasuk bahasa default.
    // Hasilnya: /en, /id, /ko
    strategy: 'prefix',

    defaultLocale: 'en',

    // Module mencari file locale dari root proyek, bukan dari srcDir `app/`.
    // restructureDir + langDir digabung, jadi file locale tetap bisa
    // tinggal di dalam app/i18n/locales.
    restructureDir: 'app/i18n',
    langDir: 'locales',

    locales: [
      {
        code: 'en',
        language: 'en-US',
        name: 'English',
        file: 'en.json'
      },
      {
        code: 'id',
        language: 'id-ID',
        name: 'Indonesian',
        file: 'id.json'
      },
      {
        code: 'ko',
        language: 'ko-KR',
        name: 'Korean',
        file: 'ko.json'
      }
    ],

    // Arahkan bahasa yang diklik ke route yang sama dengan bahasa itu.
    // Contoh: sedang di /en/produk lalu pilih Indonesia -> /id/produk
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'rout_locale',
      redirectOn: 'root'
    }
  }
})