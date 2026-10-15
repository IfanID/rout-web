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
    // Kunci API abyss.to, tempat video episode Running Man disimpan.
    //   ABYSS_API_KEY=<kunci dari dashboard abyss.to>
    //
    // SENGAJA di luar `public`. Bagian `public` ikut terkirim ke browser,
    // jadi kunci yang diletakkan di sana bukan lagi rahasia — siapa pun
    // yang membuka sumber halaman bisa membacanya, lalu memakainya untuk
    // menghabiskan jatah permintaan API ini. Hanya server yang perlu.
    //
    // `?? ''` supaya tipenya tetap string dan pemanggil tidak perlu
    // memeriksa undefined. Kosong berarti halaman episode menampilkan
    // daftar kosong, bukan gagal — lihat `server/utils/running-man/episode.ts`.
    abyssKey: process.env.ABYSS_API_KEY ?? '',

    public: {
      // Domain situs. Tidak di hardcode di sini, hanya diisi lewat .env:
      //   NUXT_PUBLIC_SITE_URL=https://domain-anda.com
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,

      // Alamat live YouTube untuk Running Man, juga dari .env:
      //   NUXT_PUBLIC_YOUTUBE_LIVE=https://www.youtube.com/live/<id>
      //
      // Yang ditulis boleh id video polos atau alamat youtube.com
      // lengkap; bentuknya diterjemahkan jadi id di LivePlayer.vue,
      // supaya menyalin tautan dari tombol Bagikan tidak perlu
      // diluruskan lebih dulu.
      //
      // Kosong berarti bagian live tidak dirender sama sekali.
      // `?? ''` supaya tipenya tetap string dan pemanggil tidak perlu
      // memeriksa undefined — berbeda dari siteUrl di atas, yang
      // memang boleh kosong karena tidak pernah dibaca sebagai teks.
      youtubeLive: process.env.NUXT_PUBLIC_YOUTUBE_LIVE ?? ''
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
      // Nama kunci pakai isi, bukan nama produk. Cookie bertahan lama
      // di browser, jadi nama produk yang tertanam di sini ikut bertahan.
      // Sama seperti KUNCI_SIMPAN di useMiddleSlot.ts.
      cookieKey: 'locale:pilihan',
      redirectOn: 'root'
    }
  }
})