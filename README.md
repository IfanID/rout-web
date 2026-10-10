# Respawn Outbase

Situs Rout. Aplikasi web berbasis Nuxt dengan dukungan tiga bahasa.

| Nama | Peran |
|---|---|
| **Respawn Outbase** | Nama panjang produk |
| **Rout** | Singkatan dari Respawn Outbase |

## Stack

| Paket | Versi |
|---|---|
| nuxt | 4.6.0 |
| vue | 3.5.43 |
| @nuxtjs/i18n | 10.6.0 |
| @nuxt/icon | 2.5.1 |

Runtime pengembangan: Node v26.10.0, npm 12.1.0.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Server pengembangan tersedia di `http://localhost:3000`. Akar `/` mengarahkan ke `/en`.

## Environment

Salin `.env.example` menjadi `.env` lebih dulu:

```bash
cp .env.example .env
```

Isi variabelnya:

```
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

Variabel ini dipakai untuk menghasilkan URL absolut pada tag `hreflang` dan `canonical`. Saat sudah ada domain, ganti nilainya lalu restart dev server. File `.env` tidak ikut ter-commit.

## Multi bahasa

Tiga locale dengan awalan URL, termasuk untuk bahasa default:

```
/en  /id  /ko
```

Berkas terjemahan ada di `app/i18n/locales/<code>.json`. Saat ini ketiganya masih kosong.

## Perintah

```bash
npm run dev        # server pengembangan
npm run build      # build produksi
npm run generate   # static generate
npm run preview    # pratinjau hasil build
```

## Struktur

```
rout-web/
├── nuxt.config.ts
├── app/
│   ├── app.vue
│   ├── assets/
│   │   └── css/
│   │       └── main.css       Sistem warna
│   ├── components/
│   │   ├── navigation/
│   │   │   ├── Header.vue
│   │   │   ├── BottomNav.vue
│   │   │   └── LocaleSwitcher.vue
│   │   └── notification/
│   │       └── Toaster.vue
│   ├── composables/
│   │   └── useNotifications.ts
│   ├── i18n/
│   │   └── locales/          en.json, id.json, ko.json
│   └── pages/
│       └── (home)/index.vue
└── public/
```

## Dokumentasi

[`AGENTS.md`](./AGENTS.md) berisi konvensi proyek: aturan bahasa, format commit, konvensi routing dan komponen, serta catatan teknis.

## Referensi

- [Dokumentasi Nuxt](https://nuxt.com/docs/getting-started/introduction)
- [Dokumentasi Nuxt i18n](https://i18n.nuxtjs.org/docs/getting-started)