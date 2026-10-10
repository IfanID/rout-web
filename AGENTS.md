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
- `rout-web` hanya untuk repo. Jangan pernah dimunculkan di UI, dan jangan diubah.

Nama produk **tidak** dipakai untuk nama file, folder, atau kode. Nama file memakai isi komponennya saja, karena nama folder sudah menyediakan konteksnya: `navigation/RoutHeader.vue` menjadi `navigation/Header.vue`. Prefix `Rout` tidak ditulis di depan nama komponen — bukan di nama file, bukan di nama variabel, bukan di nama class CSS.

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
│   ├── app.vue               Root, SEO head + header + toaster + <NuxtPage />
│   ├── assets/css/main.css   Sistem warna, satu-satunya sumber warna
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
│   │   └── locales/          en.json, id.json, ko.json (hero.* saja)
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

Komponen dan composable dikelompokkan dalam subfolder sesuai area, supaya foldernya tidak menumpuk:

```
app/components/
├── navigation/
│   ├── Header.vue
│   ├── Footer.vue
│   └── LocaleSwitcher.vue
├── notification/
│   └── Toaster.vue
├── product/
│   └── ProductCard.vue
└── ui/
    └── ButtonPrimary.vue

app/composables/
└── useNotifications.ts
```

Pakai nama folder yang batasnya jelas: `navigation/`, `notification/`, `product/`, `order/`, `user/`, `ui/`, `form/`. Hindari `common/`, `shared/`, `misc/`, atau `utils/` karena isinya tidak pernah punya batas yang disepakati.

### Composable tidak dikelompokkan dalam subfolder

Auto-import hanya memindai file di **level teratas** `app/composables/`. Subfolder tidak ikut ditemukan, dan composable di dalamnya tidak akan terbaca — gejalanya `ReferenceError: useNotifications is not defined` di server.

Jadi `app/composables/` selalu menyimpan file langsung. Berbeda dengan `app/components/` yang boleh dan memang memakai subfolder.

Kalau nanti jumlah composable sudah banyak dan root mulai menumpuk, jangan dipindah ke subfolder. Tambahkan folder baru lewat `imports.dirs` di `nuxt.config.ts`:

```ts
imports: {
  dirs: ['composables/notification']
}
```

Tapi itu workaround, bukan pola yang bagus. Composables yang banyak biasanya lebih baik dipisah ke modul Nuxt atau package terpisah daripada dikelompokkan dengan cara ini.

Elemen yang akan dipindah ke navbar atau footer nanti, tapi belum ada tempatnya sekarang, sebaiknya sudah dibuat sebagai komponen terpisah. Dengan begitu pemindahannya cuma memindah satu baris pemanggilan, tanpa menulis ulang.

### Nama komponen

Nuxt menggabungkan nama folder dan nama file menjadi nama komponen. Perilaku bawaan ini, bukan aturan manual.

| File | Nama komponen |
|---|---|
| `navigation/LocaleSwitcher.vue` | `<NavigationLocaleSwitcher />` |
| `ui/ButtonPrimary.vue` | `<UiButtonPrimary />` |
| `ui/button/ButtonPrimary.vue` | `<UiButtonPrimary />` |

Perhatikan baris ketiga tabel: prefix yang mengulang nama file otomatis dibuang. Jadi `ui/UiButton.vue` menjadi `<UiButton />`, bukan `<UiUiButton />`. Kalau nama file sudah cocok dengan nama foldernya, tidak perlu diulang.

Kalau nama file `index.vue`, yang dipakai adalah nama foldernya:

| File | Nama komponen |
|---|---|
| `navigation/index.vue` | `<Navigation />` |
| `ui/button/index.vue` | `<UiButton />` |

Folder berkurung diabaikan sebagai prefix, sama seperti di `pages/`. `(shared)/Button.vue` menjadi `<Button />`.

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

## Sistem warna

Seluruh warna proyek ini terkumpul di `app/assets/css/main.css`. File itu diimpor lewat `css: ['~/assets/css/main.css']` di `nuxt.config.ts`.

Tema **gelap saja**. Tidak ada mode terang dan tidak ada modul `@nuxtjs/color-mode`, karena tidak ada yang perlu dipilih.

Warna aksen adalah cyan murni `#00FFFF`.

### Aturan utama

**Dilarang menulis hex, rgb, atau nama warna langsung di komponen.** Satu-satunya sumber warna adalah lapisan 2 di bawah. Aturan ini yang menjaga palet tetap hidup; kalau dilanggar, palet akan lapuk perlahan.

Warna baru hanya boleh masuk lewat lapisan 1, lalu diekspor ke lapisan 2. Jangan pernah melompati lapisan.

### Kenapa tiga lapisan

| Lapisan | Isi | Dipakai oleh |
|---|---|---|
| 1 Primitif | Ramp mentah | Tidak ada, hanya 내부 |
| 2 Semantik | Peran dan penggunaan | Semua komponen |
| 3 Komponen | Token khusus komponen | Bila ada kebutuhan nyata |

Primitif dijaga terpisah supaya mengubah satu ramp tidak langsung mengubah tampilan. Perubahan warna bisa dilakukan di lapisan 2 tanpa menyentuh nilai aslinya.

### Lapisan 1 — Primitif

Ramp cyan. `#00FFFF` berada di **400, bukan 500**. Alasannya, cyan murni terlalu terang untuk warna tombol bertulisan: teks putih di atasnya kontrasnya hanya 1,1:1. Di 400, cyan murni jadi "kilau" untuk elemen kecil, sementara tombol memakai 500 yang lebih tenang.

| Token | Hex |
|---|---|
| `--cyan-50` | `#ecfeff` |
| `--cyan-100` | `#cffafe` |
| `--cyan-200` | `#a5f3fc` |
| `--cyan-300` | `#67e8f9` |
| `--cyan-400` | `#00ffff` |
| `--cyan-500` | `#00e5e5` |
| `--cyan-600` | `#00bfbf` |
| `--cyan-700` | `#0891a0` |
| `--cyan-800` | `#155e75` |
| `--cyan-900` | `#164e63` |
| `--cyan-950` | `#083344` |

Ramp netral. Hitam pekat tanpa sembunyi ungu; semua nilai R = G = B.

| Token | Hex |
|---|---|
| `--netral-950` | `#000000` |
| `--netral-900` | `#0a0a0a` |
| `--netral-850` | `#121212` |
| `--netral-800` | `#1a1a1a` |
| `--netral-700` | `#262626` |
| `--netral-600` | `#3d3d3d` |
| `--netral-500` | `#808080` |
| `--netral-400` | `#a3a3a3` |
| `--netral-300` | `#d4d4d4` |
| `--netral-100` | `#f4f4f4` |
| `--netral-50` | `#fafafa` |

Warna status, dipilih terang supaya terbaca di atas gelap.

| Token | Hex |
|---|---|
| `--sukses-300` | `#86efac` |
| `--sukses-400` | `#4ade80` |
| `--peringatan-300` | `#fcd34d` |
| `--peringatan-400` | `#fbbf24` |
| `--galat-300` | `#fca5a5` |
| `--galat-400` | `#f87171` |
| `--info-300` | `#93c5fd` |
| `--info-400` | `#60a5fa` |

### Lapisan 2 — Semantik

Latar, lima tingkat kedalaman. Makin tinggi nilainya, makin "naik".

| Token | Nilai | Untuk |
|---|---|---|
| `--latar-dasar` | `var(--netral-950)` | Body |
| `--latar-naik-1` | `var(--netral-900)` | Header, navbar |
| `--latar-naik-2` | `var(--netral-850)` | Kartu |
| `--latar-naik-3` | `var(--netral-800)` | Kartu disorot, dropdown |
| `--latar-sorot` | `rgb(0 255 255 / 10%)` | Hover di atas mana pun |

Teks. Angka adalah rasio kontras terhadap `--latar-dasar`.

| Token | Nilai | Kontras | Untuk |
|---|---|---|---|
| `--teks-utama` | `var(--netral-100)` | 19,1:1 | Judul, isi |
| `--teks-sekunder` | `var(--netral-400)` | 8,3:1 | Keterangan, label |
| `--teks-lembut` | `var(--netral-500)` | 5,3:1 | Placeholder, non-interaktif |
| `--teks-aksen` | `var(--cyan-300)` | 14,5:1 | Link, nilai penting |
| `--teks-aksen-murni` | `var(--cyan-400)` | 16,8:1 | Sorotan |
| `--teks-aksen-tekan` | `#062b33` | 9,5:1 di atas `--aksen-utama` | Teks di tombol cyan |

Garis, tiga tingkat: `--garis-halus` (`--netral-800`) untuk pemisah, `--garis-sedang` (`--netral-700`) untuk border input, `--garis-aktif` (`--cyan-600`) saat fokus.

Aksen, tiap peran punya warna berbeda.

| Token | Nilai | Untuk |
|---|---|---|
| `--aksen-utama` | `var(--cyan-500)` | Tombol utama, link |
| `--aksen-indikator` | `var(--cyan-400)` | Titik aktif, kilau |
| `--aksen-glow` | `rgb(0 255 255 / 20%)` | Halo di sekitar fokus |
| `--aksen-latar` | `rgb(0 255 255 / 6%)` | Baris terpilih, badge |

Status: `--sukses`, `--peringatan`, `--galat`, `--info`, masing-masing punya pasangan `--*-latar` untuk latar badge.

Fokus: `--fokus-cincin` (`--cyan-400`) dan `--fokus-cincin-luar` untuk memberi jarak antara cincin dan elemen.

### Lapisan 3 — Komponen

Kosong dengan sengaja. Tambahkan token hanya kalau sebuah komponen benar-benar butuh nada miliknya sendiri. Jangan diisi untuk komponen yang belum ada.

### Kelas dasar yang tersedia

Classes berikut sudah disiapkan di `main.css`. Pakai ulang, jangan tulis ulang aturan baru untuk hal yang sama.

| Kelas | Untuk |
|---|---|
| `.konten` | Pembungkus konten dengan lebar maksimum |
| `.kartu` | Permukaan elevasi |
| `.tombol`, `.tombol--utama`, `.tombol--sekunder` | Tombol |
| `.input` | Input teks dengan state fokus |
| `.badge`, `.badge--sukses` dan seterusnya | Label status |
| `.tabel` | Tabel dengan hover baris |
| `.ganda` | Deretan elemen sejajar |

Kelas di atas disiapkan sebagai pustaka. Saat ini **belum ada** yang memakainya — halaman beranda hanya berisi judul dan tagline. Semua kelas itu menunggu komponen pertama yang membutuhkannya.

Jangan dihapus hanya karena belum terpakai. Hapus kalau memang sudah dipastikan tidak akan dipakai.

### Menambah warna baru

1. Tambah nilainya di lapisan 1, sebagai token `--cyan-*` atau `--netral-*`.
2. Ekspor ke lapisan 2 dengan nama yang menjelaskan **perannya**, bukan warnanya. Tulis `--garis-aktif`, bukan `--cyan-600`.
3. Pakai di komponen.

Melewati langkah 2 membuat nama token menyebut warna. Begitu warnanya berubah, semua nama itu ikut bohong.

### Catatan kontras

Cyan murni di atas putih punya kontras 1,25:1 dan praktis tidak terbaca. Karena itu `#00FFFF` tidak pernah dipakai sebagai latar teks putih. Teks cyan di atas gelap aman karena rasio cyan ke hitam mencapai 16,8:1.

Kalau sebuah teks perlu warna cyan, pakai `--teks-aksen` (300), bukan `--cyan-400`. Cyan murni disimpan untuk hal kecil yang tidak perlu dibaca panjang.

## Notifikasi

Sistem toast global. Dipanggil dari mana saja tanpa import dan tanpa perlu meneruskan prop berlapis-lapis.

```ts
const { notify } = useNotifications()

notify.sukses('Berkas tersimpan')
notify.gagal('Gagal terhubung')
notify.info('Ada pembaruan')
notify.peringatan('Sesi akan berakhir')
```

Argumen kedua opsional untuk durasi, dalam milidetik. Default 3000.

Logika ada di `app/composables/useNotifications.ts`, tampilan ada di `app/components/notification/Toaster.vue`. Komponen boleh ada di subfolder, composable tidak.

Toaster dipasang di `app.vue` **sekali saja** — jangan dipasang per halaman, itu justru membatalkan tujuannya.

Opsi lain yang dikembalikan:

| Opsi | Untuk |
|---|---|
| `daftar` | Daftar toast aktif, untuk dipakai kalau butuh |
| `hapus(id)` | Tutup satu toast |
| `bersihkan()` | Hapus semua sekaligus |
| `ikon(type)` | Nama ikon untuk satu jenis |
| `durasiDefault` | Durasi bawaan dalam milidetik |
| `batasMaks` | Batas jumlah toast yang tampil bersamaan |

Jenis toast: `sukses`, `gagal`, `info`, `peringatan`. Masing-masing punya warna sendiri, semuanya diturunkan dari token status di `main.css`, bukan warna langsung.

### Perilaku yang sudah ditentukan

- Toast baru muncul di **atas**, bukan bawah. Yang terbaru tidak menutupi yang lebih penting.
- Durasi 3 detik.
- Maksimal **3** toast. Kalau lebih, yang paling lama keluar duluan. Jangan menaikkan angka ini tanpa alasan — tiga sudah cukup untuk menutupi layar bagian atas, dan menambahkannya membuat yang di bawah sulit dibaca.
- Ada tombol tutup manual, bisa juga lewat keyboard.
- Jarak antar toast 0.875rem.

### Gerak

`<TransitionGroup>` dari Vue, bukan animasi manual. Ketiga gerakan diurus oleh satu elemen:

| Kelas | Mengurus |
|---|---|
| `.toast-enter-from` | Masuk dari kanan |
| `.toast-leave-to` | Keluar ke kanan |
| `.toast-move` | Dorong posisi toast lain saat ada yang keluar |

`.toast-move` adalah yang bikin toast yang tersisa meluncur mengisi tempat kosongnya. Jangan dihapus — tanpa itu, efek bertumpuknya hilang.

Kalau ada animasi yang terasa aneh, periksa dulu apakah kelas `move` masih ada di blok gaya.

Durasi 320ms dengan `cubic-bezier(0.22, 1, 0.36, 1)`. Easing ini melambat di akhir, jadi gerakan terasa mendarat halus dan bukan berhenti mendadak.

### Bar progres

Bar tipis di bawah toast dikendalikan **sepenuhnya oleh CSS animation**, bukan timer JavaScript.

Ini pilihan yang disengaja. Versi pertama memakai `setInterval` yang menulis ulang state tiap 80ms, dan hasilnya gerakan toast tersendat-sendat karena Vue terus bereaksi terhadap perubahan property. Dengan CSS animation, browser yang mengurus penghitungannya dan sama sekali tidak memicu re-render.

Durasi bar diambil dari `animation-duration` yang di-bind ke `item.durasi`, jadi toast dengan durasi berbeda tetap punya bar yang sesuai.

Toast dihapus oleh event `animationend` milik bar itu, **bukan** `setTimeout`. Bar sudah berjalan dengan durasi yang sama dengan waktu hidup toast, dan ikut berhenti saat kursor di atasnya, jadi keduanya tidak mungkin meleset. Versi pertama menjadwalkan penghapusan lewat `after-enter` dan itu tidak bisa diandalkan — toast yang tidak sempat menyelesaikan animasi masuknya tidak pernah dijadwalkan, sehingga tidak pernah hilang.

Kursor di atas toast memberi `animation-play-state: paused`, jadi bar berhenti dan toast ikut tertahan sampai kursor dijauhkan.

Kalau nanti bar progres terasa jerky, cek dulu apakah ada timer JavaScript yang masih tersisa. Jangan tambahkan.

### Aksesibilitas

Wadah memakai `role="status"` dan `aria-live="polite"`. Ini wajib, bukan tambahan. Tanpa itu, user screen reader tidak pernah tahu notifikasi muncul. Jangan dihapus saat menata tampilan.

## Multi bahasa

Tiga locale: `en` (English, default), `id` (Indonesian), `ko` (Korean). Modul `@nuxtjs/i18n` dengan `strategy: 'prefix'`, jadi semua URL diawali kode bahasa termasuk default:

```
/en  /id  /ko
```

Akar `/` (tanpa awalan) mengarahkan ke `/en`.

Pemilihan `prefix` disengaja: bahasa default bisa diubah kapan saja tanpa merusak URL lama. Kalau memakai `prefix_except_default`, beranda tanpa awalan jadi milik bahasa default, dan mengubah default akan mengubah struktur URL yang sudah ada.

**Kode locale Indonesia adalah `id`, bukan `in`.** `in` adalah kode lama yang sudah tidak berlaku dan tidak pernah dikirim browser lewat header `Accept-Language`.

Konvensi yang berlaku:

- Pesan terjemahan disimpan di `app/i18n/locales/<code>.json`. Saat ini baru ada blok `hero` dengan `judul` dan `tagline`.
- Struktur kunci harus sama persis di semua file locale.
- Jangan menaruh kunci yang belum dipakai. Kalau sebuah komponen dihapus, kunci yang hanya dipakai komponen itu ikut dihapus dari ketiga file locale.
- `restructureDir: 'app/i18n'` dan `langDir: 'locales'` digabung modul jadi satu path `app/i18n/locales`. Mengubah hanya `langDir` akan membuat modul mencari di `i18n/app/i18n/locales/` dan gagal dengan error ENOENT.
- `localePath` dan `$i18n.locales` tidak tersedia langsung di template. Panggil composable di `<script setup>`: `useLocalePath()`, `useSwitchLocalePath()`, dan `const { locales } = useI18n()`.
- Untuk link, pakai route name, bukan path: `$localePath('produk-detail')`. Route name dijamin akurat, dan modul menghasilkan tipe sehingga salah ketik langsung terdeteksi IDE.
- `language` pada tiap locale wajib diisi, tidak opsional. Dipakai untuk pencocokan browser dan tag SEO.

### Teks dummy

Teks sementara untuk menguji tampilan ditulis **langsung di template, dalam Bahasa Indonesia**:

```vue
<span class="header__kanan">Teks berjalan satu baris</span>
```

Jangan menaruh teks dummy di `app/i18n/locales/`. Teks yang belum jadi tidak punya bentuk final, jadi menaruhnya di file locale berarti:

- Dua kali kerja: nulis di file locale, lalu tulis ulang nanti saat teks aslinya diketahui
- Tiga file harus diisi bersamaan dengan teks yang akan dibuang
- Kunci seperti `dummy.placeholder` akan menggantung lama setelah teks aslinya datang

Kalau teks dummy nanti memang jadi teks permanen, saat itu baru pindahkan ke file locale bersama seluruh lokalnya.

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

### Port dev

**Port 3000 dipakai oleh pemilik repo, dan biasanya sedang berjalan.**

Kalau server di 3000 sudah hidup, **jangan jalankan dev server kedua untuk proyek yang sama.** `--port 3001` tidak cukup: kunci dan cache `.nuxt/` dimiliki per proyek, bukan per port. Proses kedua akan gagal dengan `Another Nuxt dev server is already running` begitu juga.

`NUXT_IGNORE_LOCK=1` memang ada untuk melewati pemeriksaan, tapi jangan dipakai. Dua proses akan menulis ke `.nuxt/` bersamaan dan bisa merusak cache milik pemilik repo.

Jadi kalau 3000 sudah hidup: ubah file seperti biasa, lalu minta pemilik repo yang memverifikasi di browsernya. Jangan menjalankan server sama sekali.

Kalau 3000 belum dipakai dan pengujian memang perlu server, jalankan di port lain:

```bash
npx nuxt dev --port 3001
```

Jangan pernah menjalankan `npm run dev` tanpa `--port`, dan jangan pakai `--takeover` — keduanya akan merebut port 3000.

`NUXT_PUBLIC_SITE_URL` tetap `http://localhost:3000` walau server berjalan di port lain. Itu hanya memengaruhi tag `hreflang` dan `canonical` yang dilepas, bukan alamat server yang diakses.

## Catatan teknis

- `vue-router` tertulis eksplisit di `dependencies` padahal sudah bawaan Nuxt. Tidak salah, tapi tidak perlu disentuh.
- `tsconfig.json` ada, tapi `typescript` dan `vue-tsc` belum terpasang di `node_modules`. Type-check (`nuxi typecheck`) belum bisa jalan tanpa memasang keduanya lebih dulu.
- `@nuxt/icon` aktif, jadi `<Icon name="lucide:home" />` bisa langsung dipakai tanpa import manual.
- `README.md` sudah disesuaikan dengan Rout. Konvensi lengkap ada di `AGENTS.md`.
