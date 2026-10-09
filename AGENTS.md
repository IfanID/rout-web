# Respawn Outbase (Rout)

Dokumen ini jadi konteks proyek untuk AI assistant yang membantu di repo ini.

## Bahasa

Selalu gunakan Bahasa Indonesia.

| Area | Aturan |
|---|---|
| **Jawaban** | Selalu jawab dan jelaskan dalam Bahasa Indonesia. |
| **Commit message** | Selalu tulis commit message dalam Bahasa Indonesia, termasuk saat mengusulkan message. Lihat bagian [Commit message](#commit-message). |

Penamaan kode (nama variabel, fungsi, komponen, file) tetap mengikuti konvensi bahasa Inggris yang lazim di ekosistem, kecuali sudah ada pola yang berbeda di proyek ini.

### Commit message

Format Conventional Commit. Prefix memakai standar bahasa Inggris, penjelasan setelah titik dua ditulis dalam Bahasa Indonesia.

```
feat: tambah halaman daftar produk
fix: perbaiki navigasi yang hanya reload di halaman detail
docs: jelaskan konvensi route group di AGENTS.md
refactor: pindahkan index.vue ke folder (home)
```

Daftar prefix:

| Prefix | Untuk perubahan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Hanya dokumentasi |
| `style` | Formatting, whitespace, tanpa perubahan makna |
| `refactor` | Ubah struktur kode, bukan bug fix dan bukan fitur |
| `perf` | Perbaikan performa |
| `test` | Tambah atau perbaiki test |
| `build` | Build system dan dependency |
| `ci` | Konfigurasi CI |
| `chore` | Perawatan lain yang tidak masuk kategori lain |
| `revert` | Membatalkan perubahan sebelumnya |

Sepuluh pertama adalah prefix resmi dari Conventional Commits. `revert` dipakai tambahan karena pembatalan perubahan hampir selalu dibutuhkan di proyek apa pun.

Penjelasan ditulis dalam bentuk perintah dan diawali huruf kecil, satu baris, tanpa titik di akhir. Contoh:

- Benar: `feat: tambah filter pencarian produk`
- Kurang bagus: `Menambahkan filter pencarian produk` (tanpa prefix)
- Kurang bagus: `feat: Menambahkan filter pencarian produk.` (huruf besar dan ada titik)

Kalau perubahannya besar atau menyentuh banyak area, tambah scope di dalam kurung setelah prefix. Scope ditulis dalam Bahasa Indonesia:

```
feat(auth): tambah halaman login
fix(komposisi): perbaiki teks yang terpotong di layar kecil
```

## Identitas

| Nama | Peran | Tampil di UI |
|---|---|---|
| **Respawn Outbase** | Nama panjang produk | Ya |
| **Rout** | Singkatan dari Respawn Outbase | Ya |
| `rout-web` | Nama folder repo, juga nilai `name` di `package.json` | Tidak |

`Rout` bukan nama internal. Keduanya adalah nama produk yang berpasangan seperti nama panjang dan singkatannya, dan keduanya boleh muncul di teks yang dilihat pengguna.

Cara memakainya:

- Nama panjang untuk judul halaman, metadata, dan copy yang butuh ruang atau ingin menyebut produk lengkap.
- `Rout` untuk navbar, logo, dan tempat yang perlu ringkas.
- Bentuk singkat untuk kode dan nama file: `RoutHeader.vue`, `routConfig`, `rout/`.
- `rout-web` hanya untuk repo. Jangan pernah dimunculkan di UI, dan jangan diubah.

Nama folder di `app/pages/` selalu soal routing, bukan branding. Jangan menaruh nama produk di sana kecuali memang ingin menjadikannya bagian URL.

## Stack

| Paket | Versi |
|---|---|
| nuxt | 4.6.0 |
| vue | 3.5.43 |
| vue-router | 5.4.0 |
| @nuxt/icon | 2.5.1 |
| @nuxtjs/i18n | 10.6.0 |
| nitropack | 2.13.4 |
| vite | 8.3.4 |
| @nuxt/devtools | 3.4.2 |

Runtime pengembangan: Node v26.10.0, npm 12.1.0.

## Struktur

```
rout-web/
├── AGENTS.md
├── nuxt.config.ts            Modul @nuxt/icon + @nuxtjs/i18n, compatibilityDate 2025-07-15, devtools aktif
├── package.json              type: module, name: rout-web
├── tsconfig.json             4 project references ke .nuxt/
├── .env                      NUXT_PUBLIC_SITE_URL, tidak ikut ter-commit
├── .env.example              Acuan kalau .env perlu dibuat ulang
├── app/
│   ├── app.vue               Root, SEO head + <NuxtPage />
│   ├── components/
│   │   └── navigation/
│   │       └── RoutLocaleSwitcher.vue
│   ├── i18n/
│   │   └── locales/          en.json, id.json, ko.json (masih kosong)
│   └── pages/
│       └── (home)/index.vue  Beranda
└── public/
    ├── favicon.ico
    └── robots.txt
```

Folder `app/` menunjukkan konvensi srcDir Nuxt 4. Semua halaman, komponen, dan berkas terjemahan tinggal di dalam `app/`.

File `.env` ada di `.gitignore`, jadi tidak ikut ter-commit. Clone repo di mesin lain harus menyalin `.env.example` menjadi `.env` lebih dulu.

Switcher bahasa sudah menjadi komponen sendiri dan tidak lagi muncul di beranda. Belum ada navbar atau footer, jadi komponen itu belum dipakai halaman mana pun.

## Konvensi routing

Routing berbasis file. Tidak ada daftar route yang ditulis manual, dan `vue-router` di `dependencies` tidak perlu dipakai langsung.

- `app/pages/(home)/index.vue` → `/`
- `app/pages/about.vue` → `/about`
- `app/pages/blog/index.vue` → `/blog`
- `app/pages/produk/[id].vue` → `/produk/:id`

Folder berkurung adalah route group, diabaikan saat menyusun URL. `(home)/index.vue` menghasilkan `/`, bukan `/home`. Folder tanpa kurung seperti `home/` akan menjadi bagian URL.

Gunakan `<NuxtLink to="...">`, bukan `<a href="...">`, supaya navigasi client-side dan tidak full reload.

## Konvensi komponen

Komponen dikelompokkan dalam subfolder sesuai area, supaya root `app/components/` tidak menumpuk:

```
app/components/
├── navigation/
│   ├── RoutHeader.vue
│   ├── RoutFooter.vue
│   └── RoutLocaleSwitcher.vue
├── product/
│   └── ProductCard.vue
└── ui/
    └── ButtonPrimary.vue
```

Pakai nama folder yang batasnya jelas: `navigation/`, `product/`, `order/`, `user/`, `ui/`, `form/`. Hindari `common/`, `shared/`, `misc/`, atau `utils/` karena isinya tidak pernah punya batas yang disepakati.

Elemen yang akan dipindah ke navbar atau footer nanti, tapi belum ada tempatnya sekarang, sebaiknya sudah dibuat sebagai komponen terpisah. Dengan begitu pemindahannya cuma memindah satu baris pemanggilan, tanpa menulis ulang.

### Nama komponen

Nuxt menggabungkan nama folder dan nama file menjadi nama komponen. Perilaku bawaan ini, bukan aturan manual.

| File | Nama komponen |
|---|---|
| `navigation/RoutLocaleSwitcher.vue` | `<NavigationRoutLocaleSwitcher />` |
| `ui/ButtonPrimary.vue` | `<UiButtonPrimary />` |
| `ui/button/ButtonPrimary.vue` | `<UiButtonPrimary />` |

Perhatikan baris ketiga tabel: prefix yang mengulang nama file otomatis dibuang. Jadi `ui/UiButton.vue` menjadi `<UiButton />`, bukan `<UiUiButton />`. Kalau nama file sudah cocok dengan nama foldernya, tidak perlu diulang.

Kalau nama file `index.vue`, yang dipakai adalah nama foldernya:

| File | Nama komponen |
|---|---|
| `navigation/index.vue` | `<Navigation />` |
| `ui/button/index.vue` | `<UiButton />` |

Folder berkurung diabaikan sebagai prefix, sama seperti di `pages/`. `(shared)/RoutButton.vue` menjadi `<RoutButton />`.

Semua komponen auto-import, tidak perlu baris `import` di template.

Halaman di `app/pages/` tidak pernah di-prefix. `app/pages/about.vue` tetap `<About />`.

### Suffix mode

| Suffix | Dimuat di |
|---|---|
| `.client.vue` | browser saja |
| `.server.vue` | server saja |
| `.vue` | dua-duanya |

`Widget.client.vue` dan `Widget.server.vue` boleh berdampingan tanpa bentrok nama.

### Batas kedalaman

Tiga tingkat sudah cukup: `app/components/ui/button/ButtonPrimary.vue`. Kalau sudah mencapai level itu, pengelompokan di atasnya yang perlu ditinjau, bukan dibuat lebih dalam.

Nesting hanya perlu kalau isinya sudah terlalu banyak untuk satu area dan batas antar kelompok jelas. Kalau `ui/` masih 5 file, tetap satu folder. Jangan bikin folder yang isinya satu file — taruh langsung di `ui/`.

## Multi bahasa

Tiga locale: `en` (English, default), `id` (Indonesian), `ko` (Korean). Modul `@nuxtjs/i18n` dengan `strategy: 'prefix'`, jadi semua URL diawali kode bahasa termasuk default:

```
/en  /id  /ko
```

Akar `/` (tanpa awalan) mengarahkan ke `/en`.

Pemilihan `prefix` disengaja: bahasa default bisa diubah kapan saja tanpa merusak URL lama. Kalau memakai `prefix_except_default`, beranda tanpa awalan jadi milik bahasa default, dan mengubah default akan mengubah struktur URL yang sudah ada.

**Kode locale Indonesia adalah `id`, bukan `in`.** `in` adalah kode lama yang sudah tidak berlaku dan tidak pernah dikirim browser lewat header `Accept-Language`.

Konvensi yang berlaku:

- Pesan terjemahan disimpan di `app/i18n/locales/<code>.json`. Ketiganya masih kosong, isi nanti.
- Struktur kunci harus sama persis di semua file locale.
- `restructureDir: 'app/i18n'` dan `langDir: 'locales'` digabung modul jadi satu path `app/i18n/locales`. Mengubah hanya `langDir` akan membuat modul mencari di `i18n/app/i18n/locales/` dan gagal dengan error ENOENT.
- `localePath` dan `$i18n.locales` tidak tersedia langsung di template. Panggil composable di `<script setup>`: `useLocalePath()`, `useSwitchLocalePath()`, dan `const { locales } = useI18n()`.
- Untuk link, pakai route name, bukan path: `$localePath('produk-detail')`. Route name dijamin akurat, dan modul menghasilkan tipe sehingga salah ketik langsung terdeteksi IDE.
- `language` pada tiap locale wajib diisi, tidak opsional. Dipakai untuk pencocokan browser dan tag SEO.

`app/app.vue` sudah memasang `useLocaleHead()`, sehingga `<html lang>`, `dir`, `hreflang`, dan `canonical` otomatis tersedia per locale. Jangan menambahkan `useHead()` manual yang menimpanya.

## Environment

Satu variabel, dibaca di `nuxt.config.ts` tanpa nilai default:

```
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

Dipakai untuk `i18n.baseUrl` dan `runtimeConfig.public.siteUrl`, yang menghasilkan URL absolut pada tag `hreflang` dan `canonical`.

Kalau variabel ini kosong, tag SEO jatuh ke path relatif (`/id`, bukan `http://localhost:3000/id`) dan modul memberi peringatan `I18n baseUrl is required to generate valid SEO tag links` saat dev server berjalan.

Domain belum ditetapkan, masih `localhost`. Saat sudah ada domain, ganti nilainya di `.env` lalu restart. Tidak ada kode yang perlu disentuh.

Perhatikan: `baseUrl` **tidak boleh** ditulis sebagai function yang membaca `useRuntimeConfig()`. Nilai function tidak bisa diserialisasi ke runtime config, dan hasilnya tag SEO tetap relatif. Gunakan `process.env` langsung di `nuxt.config.ts`.

`.env` dibaca saat proses start, bukan saat hot reload. Ubah isinya lalu restart dev server, bukan andalkan HMR.

## Perintah

```bash
npm run dev        # server pengembangan di http://localhost:3000
npm run build      # build produksi
npm run generate   # static generate
npm run preview    # pratinjau hasil build
```

`postinstall` menjalankan `nuxt prepare` untuk regenerate tipe di `.nuxt/`.

Kalau `npm run dev` gagal dengan pesan "Another Nuxt dev server is already running", ada proses dev lama yang masih memegang lock. Jalankan `npx nuxt dev --takeover` untuk mengambil alih, atau hentikan proses yang lama dulu.

## Catatan teknis

- `vue-router` tertulis eksplisit di `dependencies` padahal sudah bawaan Nuxt. Tidak salah, tapi tidak perlu disentuh.
- `tsconfig.json` ada, tapi `typescript` dan `vue-tsc` belum terpasang di `node_modules`. Type-check (`nuxi typecheck`) belum bisa jalan tanpa memasang keduanya lebih dulu.
- `@nuxt/icon` aktif, jadi `<Icon name="lucide:home" />` bisa langsung dipakai tanpa import manual.
- `README.md` sudah disesuaikan dengan Rout. Konvensi lengkap ada di `AGENTS.md`.
