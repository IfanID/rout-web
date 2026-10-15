# Respawn Outbase (Rout)

Dokumen ini jadi konteks proyek untuk AI assistant yang membantu di repo ini.

## Yang ditulis di mana

Dokumen ini bukan tempat semua yang diketahui tentang proyek. Yang tidak masuk ke sini sudah ada di tempat lain — memuatnya di sini tidak menambah informasi, cuma menambah satu tempat yang harus dijaga sinkron.

| Jenis informasi | Tempatnya |
|---|---|
| Berlaku lintas file, dan tidak bisa dibaca dari kode | dokumen ini |
| Berlaku untuk satu file | komentar di file itu |
| Alasan di balik keputusan yang sudah diambil | pesan commit |

Contoh. Aturan "jangan tulis hex langsung di komponen" ada di header `main.css`, karena siapa pun yang membuka file itu akan membacanya. Aturan yang sama di dokumen ini hanya jadi salinan yang bisa basi. Nilai token warna juga tidak ditulis ulang di sini — kalau `--cyan-500` berubah, dokumen ini akan diam-diam memberi angka yang salah.

Sebelum menambah sesuatu ke dokumen ini, periksa dulu apakah isinya sudah ada di file atau di `git log`. Kalau sudah ada, tulis di sana atau jangan tulis sama sekali.

## Cara mengubah kode

Berlaku untuk semua perubahan, bukan cuma satu area.

- Jangan memperbaiki kode, komentar, atau formatting di luar yang diminta. Kalau
  yang diminta memang soal itu, perbaikannya tetap berhenti di situ.
- Jangan me-refactor yang tidak rusak — itu permintaan terpisah.
- Ikuti gaya yang sudah ada di file itu, walau kamu akan menulis berbeda.
- Kode mati yang tidak berkaitan: sebutkan, jangan dihapus. Yang jadi tidak
  terpakai karena perubahanmu: hapus.

Setiap baris yang berubah harus bisa ditelusuri ke permintaannya. Kalau arahnya
belum jelas, tanyakan dulu — menebak lalu jalan terlalu jauh lebih mahal
daripada satu pertanyaan.

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

### Isi commit

Baris pertama itu **hanya ringkasan**. Aturan "satu baris" di atas berlaku pada baris pertama, bukan pada seluruh pesan. Perubahan yang besar wajib punya body — kalau tidak, `git log` hanya memberi tahu *apa* yang berubah, tapi tidak *bagaimana* dan tidak *mengapa*.

Formatnya: baris pertama, baris kosong, lalu body.

```
feat: tambah pengaturan slot tengah navbar dan navigasi item

- useMiddleSlot menyimpan daftar pintasan slot tengah
- SlotMark menyatukan tampilan mark ikon dan huruf di satu tempat
- SlotSelect menampilkan pemicu dan menu pilihan
- halaman /settings untuk mengganti slot tengah
- item navbar tertaut ke halaman yang tersedia
- label navbar dan keterangan diterjemahkan di id, en, ko
```

Yang bisa dicatat di body:

- **File baru dan apa fungsinya** — supaya orang tahu ada komponen baru tanpa harus menelusuri diff
- **Perilaku yang berubah**, bukan hanya file yang berubah — "penanda aktif mengikuti route", bukan "ubah BottomNav.vue"
- **Alasan** di balik pilihan yang tidak obvious — kenapa `SlotMark` diekstrak, kenapa identifier tidak boleh memakai nama produk
- **Yang sengaja tidak diubah** — supaya pembaca tidak salah mengira

Yang tidak perlu: daftar file yang berubah, karena git sudah menampilkannya. Paragraf pembuka yang mengulang baris pertama juga tidak perlu — baris pertama sudah jadi ringkasannya, dan bullet di bawahnya sudah jadi rinciannya.

Untuk commit kecil, satu baris saja sudah cukup — tidak wajib ada body.

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

Larangan itu juga berlaku untuk **identifier**, bukan cuma nama file dan class CSS. Yang tidak boleh: id atau konstanta yang berisi nama produk, kunci `localStorage`, dan kunci terjemahan. Ketiganya menyimpan nama itu lebih lama dari mana pun — `localStorage` bahkan bertahan setelah kode dihapus.

Soalnya nama produk sangat mudah bocor ke sini lewat jalan pintas. Menamai sebuah pilihan `rout` terasa wajar karena produknya memang Rout, tapi id itu ikut terbawa ke penyimpanan browser dan bentrok dengan Rout yang sebenarnya. Nama identifier pakai isi atau fungsinya: pilihan slot tengah yang menunjuk acara Running Man memakai id `running-man`, bukan `rout`.

Satu-satunya tempat nama produk boleh muncul di luar dokumentasi adalah **UI yang dilihat pengguna** — logo di header, teks yang memang menyebut Rout, dan teks locale seperti "Riwayat aktivitas Rout". Itu bukan kebocoran, itu memang gunanya.

Nama folder di `app/pages/` selalu soal routing, bukan branding. Jangan menaruh nama produk di sana kecuali memang ingin menjadikannya bagian URL.

## Stack

| Paket | Versi |
|---|---|
| nuxt | 4.6.0 |
| vue | 3.5.43 |
| vue-router | 5.3.1 |
| @nuxt/icon | 2.5.1 |
| @nuxtjs/i18n | 10.6.0 |
| @iconify-json/lucide | 1.2.142 |
| hls.js | 1.7.3 |

Hanya yang tertulis di `package.json`. `nitropack`, `vite`, dan `@nuxt/devtools` ikut terpasang sebagai dependensi transitif `nuxt` — jangan ditambah eksplisit, dan jangan dianggap harus dikunci.

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
│   │   │   ├── BottomNav.vue    Navbar bawah + slot tengah yang bisa diganti
│   │   │   ├── LocaleSwitcher.vue
│   │   │   ├── SearchOverlay.vue   Panel cari melayang
│   │   │   └── slot/
│   │   │       ├── SlotMark.vue    Mark satu item slot: ikon atau huruf
│   │   │       └── SlotSelect.vue  Pemicu + menu pilih isi slot tengah
│   │   ├── notification/
│   │   │   └── Toaster.vue
│   │   ├── ClipPlayer.vue      Pemutar klip di halaman satu klip
│   │   ├── PreviewList.vue     Daftar klip, dipakai beranda + /preview
│   │   └── PreviewSort.vue     Tab urutan klip: terbaru, terlama, terpopuler
│   ├── composables/
│   │   ├── useNotifications.ts
│   │   ├── useMiddleSlot.ts      Pintasan slot tengah navbar + route-nya
│   │   ├── useRunningMan.ts      Data acara, dipakai beranda + detail + episode
│   │   ├── useRunningManClips.ts Klip tayang, diambil dari /api/running-man/clips
│   │   └── useSearchOverlay.ts   State panel cari melayang
│   ├── i18n/
│   │   └── locales/          en.json, id.json, ko.json (hero, cari, nav, pengaturan, slot, anggota)
│   └── pages/
│       ├── (home)/index.vue    Beranda
│       ├── (profile)/
│       │   └── profile.vue     → /profile
│       ├── running-man/
│       │   ├── episode/
│       │   │   ├── index.vue      → /running-man/episode
│       │   │   └── streaming.vue  → /running-man/episode/streaming
│       │   ├── preview/
│       │   │   ├── [id].vue       → /running-man/preview/:id
│       │   │   └── index.vue      → /running-man/preview
│       │   ├── detail.vue         → /running-man/detail
│       │   └── index.vue          → /running-man
│       ├── (search)/
│       │   └── search.vue      → /search
│       └── (settings)/
│           └── settings.vue    → /settings
├── server/
│   ├── api/running-man/
│   │   ├── acak.get.ts          → /api/running-man/acak, sengaja tidak dicache
│   │   ├── clips.get.ts         → /api/running-man/clips
│   │   └── sekitar.get.ts       → /api/running-man/sekitar, tetangga satu klip
│   └── utils/running-man/
│       └── klip.ts             Alamat, pemetaan, dan pencarian posisi di arsip
├── shared/
│   └── types/klip.ts          Bentuk klip yang menyeberang dari server ke app
└── public/
    ├── favicon.ico
    └── robots.txt
```

Folder `app/` menunjukkan konvensi srcDir Nuxt 4. Semua halaman, komponen, dan berkas terjemahan tinggal di dalam `app/`.

File `.env` ada di `.gitignore`, jadi tidak ikut ter-commit. Clone repo di mesin lain harus menyalin `.env.example` menjadi `.env` lebih dulu.

Header dan BottomNav dipasang di `app.vue`, jadi keduanya dipakai semua halaman.

Halaman yang ada baru `/`, `/profile`, `/running-man`, `/running-man/detail`, `/running-man/episode`, `/running-man/episode/streaming`, `/running-man/preview`, `/running-man/preview/:id`, `/search`, dan `/settings`. Status tiap item navbar ditentukan oleh kolom `ke`: item dengan `ke` terisi dirender sebagai link, yang kosong sebagai tombol mati. Empat halaman di navbar sudah punya, jadi satu-satunya item yang masih bisa mati adalah slot tengah — dan hanya ketika pintasan yang dipilih belum punya halaman.

Slot tengah punya enam halaman Running Man: beranda `/running-man` yang menampilkan satu kartu tayang berikutnya plus tiga klip terbaru, `/running-man/detail` yang memuat jadwal, tentang acara, statistik, dan pengenalan anggota, `/running-man/episode` yang mendaftar episode, `/running-man/episode/streaming` untuk menonton satu episode, `/running-man/preview` yang mendaftar seluruh klip, dan `/running-man/preview/:id` yang memutar satu klip. Semuanya menyalakan tetesan navbar yang sama — diwarisi dari awalan path, bukan lewat kolom `dalam`.

Data acara dibaca dari `app/composables/useRunningMan.ts` supaya tidak ada dua salinan angka yang bisa berbeda — angka itu dipakai tiga halaman. Data anggota cast kebalikannya: ditulis langsung di `app/pages/running-man/detail.vue`, karena halaman itu satu-satunya yang memakainya. Berkas terpisah baru berguna begitu ada pemakai kedua, dan selama belum ada ia cuma menambah satu berkas yang harus dibuka untuk memahami halaman itu. Teksnya, dalam tiga bahasa, tetap tinggal di blok `anggota` pada berkas locale.

Sumber untuk keduanya tercatat di bagian [Sumber data Running Man](#sumber-data-running-man).

## Organisasi folder

Aturan ini berlaku untuk semua folder di proyek ini — komponen, halaman, composable, dan apa pun yang muncul nanti. Bukan khusus `components/`.

Folder baru lahir dari **fungsi yang berbeda**, bukan dari bertambahnya jumlah file. Kalau file yang ditambahkan masih satu urusan dengan isi foldernya, ia tetap di sana.

**Sebelum membuat folder, jawab dulu:** apa yang *tidak bisa* lagi dikelompokkan ke folder induk? Kalau tidak ada jawabannya, jangan dibuat.

**Nesting** perlu kalau dua syarat ini terpenuhi sekaligus — isinya sudah banyak, **dan** batas antar kelompoknya jelas. Jumlah file saja bukan alasan. Sepuluh file yang semuanya satu urusan lebih baik tetap dalam satu folder daripada dipecah karena sudah banyak.

**Satu file dalam satu folder** adalah folder yang tidak menambah informasi apa pun. Kalau sebuah kelompok baru hanya berisi satu file, jangan buat foldernya.

**Nama folder** menjelaskan batas fungsinya, bukan warnanya atau isinya. `navigation/slot/` berarti komponen untuk fitur slot tengah, bukan "slot yang warnanya gelap". Batas nama yang jelas ada di [Konvensi komponen](#konvensi-komponen); `common/`, `shared/`, `misc/`, dan `utils/` dihindari karena isinya tidak pernah punya batas yang disepakati.

### Penamaan

Folder dan file `.vue` ditulis dalam **bahasa Inggris**.

| Yang | Bahasa | Contoh |
|---|---|---|
| Nama folder | Inggris | `navigation/`, `slot/`, `notification/` |
| Nama file `.vue` | Inggris | `BottomNav.vue`, `SlotSelect.vue`, `settings.vue` |
| Nama route | Inggris | `/settings`, `/search`, `/running-man` |
| Kunci terjemahan | Indonesia | `nav.cari`, `pengaturan.judul`, `slot.running_man` |
| Isi kunci | Sesuai locale | `"Cari"`, `"Search"`, `"검색"` |

Alasannya mundane: nama file muncul di setiap baris import dan di setiap pesan error, jadi yang membacanya bukan cuma orang yang sudah terbiasa dengan Bahasa Indonesia.

Kunci terjemahan berbeda. Kuncinya tidak pernah muncul di kode — hanya di dalam file locale dan di template lewat `t()`. Tidak ada yang perlu membacanya saat menelusuri bug, jadi bahasa yang paling ringkas untuk dibaca dipakai di sana.

Nama file memakai isi komponennya saja, karena nama folder sudah menyediakan konteksnya. `navigation/RoutHeader.vue` menjadi `navigation/Header.vue` — prefix `Rout` tidak ditulis di depan nama file, bukan di nama variabel, bukan di class CSS. Lihat [Identitas](#identitas).

Route ditulis Inggris walau teksnya bukan. `/search` adalah route-nya, sementara label navbar diambil dari `t('nav.cari')` dan tampil "Cari" untuk orang Indonesia, "Search" untuk orang Inggris. URL dan tampilan adalah dua urusan berbeda, dan mengunci keduanya pada bahasa yang sama membuat salah satunya ikut salah begitu ada penerjemahan.

## Konvensi routing

Routing berbasis file. Tidak ada daftar route yang ditulis manual, dan `vue-router` di `dependencies` tidak perlu dipakai langsung.

- `app/pages/(home)/index.vue` → `/`
- `app/pages/about.vue` → `/about`
- `app/pages/blog/index.vue` → `/blog`
- `app/pages/products/[id].vue` → `/products/:id`
- `app/pages/running-man/detail.vue` → `/running-man/detail`

Folder berkurung adalah route group, diabaikan saat menyusun URL. `(home)/index.vue` menghasilkan `/`, bukan `/home`. Folder tanpa kurung seperti `home/` akan menjadi bagian URL.

Gunakan `<NuxtLink to="...">`, bukan `<a href="...">`, supaya navigasi client-side dan tidak full reload.

### Nama route bukan sama dengan URL

Keduanya dibaca dari tempat berbeda, jadi yang satu tidak boleh dipakai untuk menyebut yang lain. Nama route dibaca dari nama file dan foldernya, sementara URL dibaca dari path tempat folder berkurung diabaikan. Konsekuensinya:

| Berkas | Nama route | URL |
|---|---|---|
| `(running-man)/(detail)/detail.vue` | `detail` | `/detail` |
| `(running-man)/detail/detail.vue` | `detail` | `/detail/detail` |
| `running-man/detail.vue` | `running-man-detail` | `/running-man/detail` |
| `running-man/detail/index.vue` | `running-man-detail` | `/running-man/detail` |

Route group boleh bersarang. `(running-man)/(detail)/detail.vue` menghasilkan `/detail` **dan** bernama `detail` karena kedua group-nya sama-sama hilang tanpa sisa.

Segmen folder dan berkas disambung dengan tanda hubung untuk nama route, tapi tidak untuk URL. Karena itu `running-man/episode/streaming.vue` bernama route `running-man-episode-streaming` dan beralamat `/running-man/episode/streaming`.

`index.vue` di ujung nama route dibuang, jadi `running-man/index.vue` bernama route `running-man`, bukan `running-man-index`.

### File dan folder tidak boleh bernama sama

`app/pages/running-man/running-man.vue` dan folder `app/pages/running-man/running-man/` tidak boleh berdiri bersama.

Kalau keduanya ada, route di bawah folder itu tetap terbentuk dengan nama yang benar — tapi menjadi **child** dari route `.vue`-nya, bukan saudara. Vue Router merender parent lebih dulu dan hanya menampilkan child lewat `<router-view>` milik parent. `/running-man/detail` membuka halaman beranda tanpa error apa pun: tidak ada HTTP 404, tidak ada peringatan di console, semua tautannya berfungsi. Gejalanya cuma isi yang salah, dan itu jenis bug yang lolos dari pemeriksaan biasa karena semuanya terlihat sehat.

Akibatnya beranda wajib `running-man/index.vue`. Folder `running-man/` tanpa kurung adalah satu-satunya cara menaruh berkas di bawah `/running-man`, dan folder itulah yang bertabrakan dengan berkas bernama sama.

Kasus kedua yang sudah pernah diuji di proyek ini: `running-man/preview.vue` berdampingan dengan folder `running-man/preview/` yang berisi `[id].vue`. Hasilnya sama — `preview/:id` jadi child dari `preview.vue`, dan karena halaman daftar tidak punya `<router-view>`, yang tampil di `/running-man/preview/OC482018079` adalah daftar klip. Jalan keluarnya `preview/index.vue` + `preview/[id].vue`: keduanya saudara, dan URL maupun nama route halaman daftar tidak berubah. Diverifikasi dengan memindai route, bukan dengan membuka halamannya — bugnya tidak kelihatan sampai isinya diketuk.

### Halaman yang bukan punya item navbar sendiri

Tetesan navbar dihitung dari path, dengan dua pengecualian: halaman beranda tidak mewarisi apa pun, dan setiap item juga menyalakan halaman lengkap yang dimilikinya.

Halaman beranda perlu dikecualikan karena `/id`, `/en`, dan `/ko` adalah awalan dari setiap path di locale-nya. Kalau tidak dikecualikan, `/id/settings` ikut menyalakan tetesan Beranda — bukan hanya slot tengah, tapi setiap item.

Kolom `dalam` di `useMiddleSlot.ts` ada untuk halaman yang **tidak** bisa mewarisi lewat awalan path, jadi harus disebut satu per satu lewat nama route. Isinya berupa daftar, bukan satu kolom, karena jumlahnya bisa lebih dari satu.

Sekarang kosong di semua entri: Running Man keempat halamannya sudah berada di bawah `/running-man/`, jadi `milik` di `BottomNav.vue` mengenali `/running-man/detail` dari awalan path-nya. Baris yang menangani daftar itu tetap ada karena kasus datar belum tentu tidak akan muncul.

## Konvensi komponen

Komponen dikelompokkan dalam subfolder sesuai area, supaya foldernya tidak menumpuk:

```
app/components/
├── navigation/
│   ├── Header.vue
│   ├── BottomNav.vue
│   ├── LocaleSwitcher.vue
│   └── slot/
│       ├── SlotMark.vue
│       └── SlotSelect.vue
├── notification/
│   └── Toaster.vue
├── product/
│   └── ProductCard.vue
└── ui/
    └── ButtonPrimary.vue
```

Cara memilih folder dijelaskan di [Organisasi folder](#organisasi-folder). Ringkasnya: `slot/` ada karena batas fungsinya nyata — `SlotSelect` memakai `SlotMark` di pemicu dan di dalam menunya, dan `SlotMark` juga melayani `BottomNav`, jadi keduanya satu fitur yang tidak bisa dipisah. Kalau nanti isinya masih satu urusan, taruh langsung di `navigation/`.

Satu komponen boleh tinggal di akar `app/components/` tanpa folder, dan `PreviewList.vue` begitu karena ia baru satu berkas — dipakai beranda dan `/running-man/preview`, tapi belum ada kerabat yang perlu dikelompokkan. Aturan satu-berkas-satu-folder berlaku di sini juga: begitu ada komponen pratinjau kedua, keduanya baru dikumpulkan ke satu folder.

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
| `navigation/slot/SlotSelect.vue` | `<NavigationSlotSelect />` |

Perhatikan baris ketiga dan keempat tabel: prefix yang mengulang nama file otomatis dibuang. Jadi `ui/UiButton.vue` menjadi `<UiButton />`, bukan `<UiUiButton />`, dan `navigation/slot/SlotSelect.vue` menjadi `<NavigationSlotSelect />` — bukan `<NavigationSlotSlotSelect />`. Kalau nama file sudah cocok dengan nama foldernya, tidak perlu diulang.

Artinya memindahkan file ke subfolder tidak selalu mengubah nama komponen. `SlotMark.vue` dan `SlotSelect.vue` sudah bernama Slot, jadi memindahkannya ke `slot/` tidak mengubah apa pun yang memanggilnya.

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

Kapan perlu membuat folder, dan kapan tidak, dijelaskan di [Organisasi folder](#organisasi-folder). Ringkasnya di sini: satu file dalam satu folder tidak pernah dibenarkan, dan menambah file yang masih satu urusan dengan isi folder induk bukan alasan untuk membuat folder baru.

## Server

`server/api/running-man/` melayani data yang diambil dari pihak ketiga. Yang ada sekarang cuma satu endpoint, `clips.get.ts`, yang mengambil klip tayang dari SBS dan menyimpannya sebentar dengan `defineCachedEventHandler`.

Empat hal yang tidak bisa dibaca dari berkasnya sendiri:

- **Subfolder di `server/api/` adalah bagian URL.** Ini kebalikan dari `app/components/`, yang subfoldernya cuma jadi awalan nama komponen. `api/running-man/clips.get.ts` menghasilkan `/api/running-man/clips`.
- **Folder berkurung adalah satu-satunya pengecualiannya.** Segmen yang ditulis dalam kurung dibuang dari URL, sama seperti route group di `app/pages/`. Syaratnya satu: kurungnya harus diikuti garis miring — segmen terakhir yang berkurung (`next.(get).ts`) tidak dibersihkan dan tanda kurungnya ikut ke URL.
- **`server/utils/` dipindai rekursif,** jadi yang diekspor di subfoldernya bisa dipakai tanpa baris `import`. Ini kebalikan dari `app/composables/` yang hanya memindai level teratas — lihat [Composable tidak dikelompokkan dalam subfolder](#composable-tidak-dikelompokkan-dalam-subfolder).
- **Bentuk data yang menyeberang ke app tinggal di `shared/types/`.** Setelah melewati batas server, tipe tidak lagi bisa disimpulkan dari konstanta asalnya karena yang berpindah cuma JSON. `app/` tidak boleh mengimpor dari `server/`, jadi `shared/` satu-satunya tempat yang dibaca keduanya.

**Server ada karena pekerjaan nyata, bukan karena memindahkan konstanta.** Endpoint yang hanya mengembalikan angka tulisan tangan tidak menambah apa pun — ia cuma menambah lompatan dan satu tempat untuk salah ketik. Yang membuatnya bernilai justru tiga hal yang ada di sini: satu tempat yang tahu alamat sumbernya, satu tempat yang menentukan berapa lama hasil boleh dipakai, dan halaman yang tidak ikut gagal ketika pihak ketiga sedang tidak bisa dihubungi. Karena itu handler mengembalikan larik kosong ketika gagal, bukan melempar error.

Bentuk responsnya sengaja dijaga tetap. Kalau sumbernya berubah — alamat, nama kolom, atau mulai memerlukan kunci API — yang berubah hanya handler; halaman dan composable tidak ikut tersentuh.

Satu endpoint boleh punya query: `/api/running-man/clips?urutan=terpopuler`. Cache bawaan Nitro memakai `originalUrl` sebagai bagian kuncinya, jadi tiap nilai query punya salinan sendiri tanpa perlu kunci cache manual. Nilai yang tidak dikenal dijatuhkan ke urutan awal di server, **dan** kunci `useAsyncData` di sisi app ikut memuat urutannya — kalau tidak, berpindah tab akan membaca hasil cache urutannya yang lama, dan daftarnya tidak akan pernah berubah meski pilihannya berubah.

Pemuatan bertahap juga lewat query yang sama: `&offset` menentukan dari mana, `&limit` menentukan berapa banyak. Angkanya berbeda menurut pemakainya, dan yang paling perlu diperhatikan adalah yang **pemuatan pertama**: angka itu ikut ke dalam HTML saat halaman dirender di server, jadi ia menunda apa pun terlihat. Yang berikutnya diambil setelah halaman tampil, saat orang menggulir, jadi ia boleh lebih besar.

| Pemakai | `limit` | Ukuran |
|---|---|---|
| beranda | 20 | 8 KB |
| daftar klip, tiap pemuatan | 100 | 42 KB |
| halaman satu klip, bagian "Klip lain" | 15 | 5 KB |

Bagian "Klip lain" di halaman satu klip berisi lima belas baris dengan susunan tetap:

| Slot | Isi | Dari mana |
|---|---|---|
| 1 | klip terbaru | server, satu permintaan ke SBS |
| 2 | klip di atas klip yang ditonton, di urutan yang sedang dibaca | titipan daftar |
| 3 | klip di bawahnya | titipan daftar |
| 4–15 | dua belas klip acak | `/api/running-man/acak` |

Slot 2 dan 3 **dicari, bukan dititipkan**, dan pergantian itu memperbaiki satu bug nyata. Dulu keduanya diambil dari daftar yang barusan diketuk orang. Itu benar selama daftarnya urut — halaman daftar dan beranda memang urut — tapi begitu orang berpindah klip lewat "Klip lain", daftar itu daftar **acak**, jadi yang disebut tetangga ikut acak: di uji, klip 2020 dan 2015 muncul berdampingan dengan klip 2026.

Tetangga yang sebenarnya hanya bisa diketahui kalau posisi klip itu di arsip diketahui, dan SBS tidak menyediakan cara menanyakannya: yang ada hanya "berikan klip ke sekian", `search` diabaikan, dan tidak ada endpoint metadata per klip. Jadi posisinya dicari — `cariPosisiTanggal` di `server/utils/running-man/klip.ts` menjalankan **pencarian biner atas tanggal**, dan itu mungkin karena arsipnya urut menurun menurut tanggal (diuji: offset 0 menjawab 2026-10, offset 8000 menjawab 2013-12).

Ongkosnya sekitar 15 permintaan ke SBS untuk klip yang belum pernah dicari: 14 pencarian biner (satu klip per permintaan, ±2 KB) dan satu blok 100 klip di sekitar posisinya. Hasilnya dicache 10 menit lewat `defineCachedEventHandler`, dan titik-titik yang sudah diprobe diingat proses server — di uji, klip kedua dari tanggal yang sama menjawab dalam 0,4 detik, dan tanggal yang belum pernah dicari 1,6 detik. Angka ini jauh lebih kecil daripada membangun indeks seluruh arsip (9 permintaan, 19 MB), dan tidak rapuh saat jaringan server tersendat.

`useKlipSekitar` memakai **tanggal dari titipan daftar**; tanpa itu pencariannya tidak bisa dijalankan, jadi halaman yang dibuka lewat tautan langsung tidak punya tetangga dan dua slot itu diisi klip acak. Endpoint `/api/running-man/acak` **tidak dicache** — satu-satunya di proyek ini. Cache Nitro memakai URL sebagai kunci, jadi balasan yang tersimpan akan mengembalikan klip yang sama selama TTL-nya: acak yang diam, dan acak yang diam bukan acak. Ongkosnya nyata: satu kali membuka halaman klip berarti sekitar empat belas permintaan ke SBS, satu undian per klip, sekitar 2 KB masing-masing, dijalankan bersamaan. Empat belas, bukan satu, karena satu undian untuk banyak klip menghasilkan klip **berurutan dari satu episode** — di uji, seluruh barisnya jatuh di bulan yang sama, jadi yang acak cuma zamannya. Undian per klip itu harga dari acak yang benar.

`kecuali` di endpoint itu menerima **daftar** id yang dipisah koma, bukan satu id: yang perlu disingkirkan bukan cuma klip yang sedang ditonton, tapi juga dua tetangganya yang sudah tampil di slot 2 dan 3. Klip terbaru di slot 1 sengaja **selalu** dikirim walau idnya ada di `kecuali` — yang membuangnya halaman, karena hanya halaman yang tahu apa yang sedang tampil di atasnya.
Hanya halaman daftar klip yang menggulir, dan `useMuatKlipLagi` yang punya `IntersectionObserver`-nya. Halaman cuma mengikat `penanda` yang dikembalikannya ke elemen di ujung daftarnya; jangan menyalin pengintainya ke halaman, karena dua salinan akan berbeda diam-diam saat salah satunya diperbaiki. Bagian "Klip lain" di halaman satu klip sengaja **tidak** menggulir: isinya lima belas sekali, karena daftar di bawah pemutar bukan halaman arsip.

"Klip lain" memuat daftar acaknya **sendiri**, bukan memakai titipan dari halaman sebelumnya. Kalau memakai titipan, membuka klip dari beranda akan memberi daftar sependek daftar beranda, sedangkan dari halaman daftar isinya ratusan. Satu jalur pemuatan membuat isinya sama dari mana pun klipnya dibuka.

Tidak ada ikatan angka antara handler dan app. `offset` dihitung dari panjang daftar yang sudah dimiliki halaman, bukan dari ukuran halaman, jadi mengubah angkanya tidak membuat klip terlewat atau terulang. Yang perlu dijaga hanya di app: `useMuatKlipLagi` membandingkan `tambahan.length` dengan angka yang **diminta**, bukan dengan konstanta — balasan yang lebih pendek berarti arsipnya sudah habis.

Klip di halaman satu klip diputar **dari server SBS**, bukan lewat bingkai: player mereka di dalam bingkai pihak ketiga selalu gagal di Chrome karena cookie-nya diblokir, dan kegagalannya muncul sebagai `재생오류` dari mereka. `ClipPlayer` meminta sumbernya ke `play-api/1.0/sbs_vodall/preview/<id>`, dan kualitasnya ditentukan parameter `rscuse`: `05` memberi 1280x720 (6,24 Mbps), `01` memberi 856x480 (2,95 Mbps).

Playlist klip itu hanya berisi **satu** kualitas, jadi `hls.js` tidak punya apa pun untuk diturunkan saat jaringan melambat — videonya tersendat sampai selesai. Karena itu kualitasnya dipilih sejak awal lewat `navigator.connection`: mode hemat data atau 2G/3G atau perkiraan di bawah 3 Mbps memakai 480p, sisanya 720p. Peramban yang tidak menyediakan informasi itu — Safari di iPhone — tetap mendapat 720p.

Batas atas `limit` di handler 1000, dan itu batas SBS: diuji, SBS mengirim 1000 klip (2,2 MB) saat diminta, dan mengabaikannya di atas itu.

### Query bukan bagian dari route

Berpindah dari `?urutan=terbaru` ke `?urutan=terlama` **bukan** berpindah halaman. Namanya route-nya sama, hanya query-nya yang berbeda — jadi Vue Router memakai ulang instance komponennya dan `<script setup>` tidak dijalankan lagi.

Akibatnya tiga hal terjadi tanpa terlihat: data yang diambil saat setup masih milik query yang lama, `computed` yang dihitung sekali di dalam setup ikut basi, dan penanda seperti "yang aktif" tetap menunjuk nilai yang lama. Halamannya tidak error dan tidak melempar exception — hanya tidak berubah, dan itu terlihat seperti servernya yang salah.

Tiga cara mengatasinya, pilih yang paling kecil:

1. **Kunci `useAsyncData` ditulis sebagai fungsi, bukan teks.** Kunci reaktif diawasi, kunci teks diam — itu bedanya di `useAsyncData`, dan kunci teks di sini justru penyebabnya.
2. **Nilai dari `useRoute()` dibaca lewat `computed`,** bukan sekali di dalam setup.
3. **State turunan disalin ulang** lewat `watch` atas sumbernya, dengan `{ immediate: true }` supaya halaman tidak mulai kosong.

Cara lain yang tersedia — `definePageMeta({ key: route => route.fullPath })` — membuat seluruh komponen dibuat ulang. Berlebihan kalau yang perlu diperbarui cuma satu daftar, dan ia juga membuang state turunan yang justru perlu disimpan.

Yang membuat jenis bug ini lolos: pemeriksaan lewat alamat langsung selalu benar, karena halaman itu dirender dari awal. Baru terlihat ketika peramban yang berpindah tanpa memuat ulang halaman.

## Sistem warna

Seluruh warna terkumpul di `app/assets/css/main.css`, diimpor lewat `css: ['~/assets/css/main.css']` di `nuxt.config.ts`. Tema **gelap saja** — tidak ada mode terang dan tidak ada modul color-mode. Aksennya cyan murni `#00FFFF`.

File itu sudah menjelaskan dirinya sendiri di header: tiga lapisannya, larangan menulis hex langsung, dan alasan cyan murni ada di 400 bukan 500. **Nilai token, daftar ramp, dan daftar kelas tidak ditulis ulang di sini** — menyalinnya hanya berarti isinya bisa basi begitu `main.css` berubah.

Yang perlu diingat dari luar file itu:

- Warna baru masuk lewat lapisan 1, lalu diekspor ke lapisan 2. Jangan pernah melompati lapisan.
- Lapisan 3 tetap kosong. Token komponen baru hanya ditambah kalau ada komponen yang benar-benar butuh nadanya sendiri.
- Cyan murni tidak pernah jadi latar teks putih — kontrasnya 1,25:1.
- `.konten`, `.kartu`, `.tombol`, `.input`, `.badge`, `.tabel`, dan `.ganda` sudah ada. Pakai ulang, jangan ditulis ulang. Jangan dihapus hanya karena belum terpakai.
- `.kartu` menyertakan `:hover` yang menebalkan garis. Permukaan yang tidak bisa diklik ke mana pun perlu dimatikan, kalau tidak permukaannya terlihat bisa diklik padahal tidak ada yang terjadi:

```css
.acara:hover,
.jadwal:hover {
  border-color: var(--garis-halus);
}
```

### Menyesuaikan ukuran ikon

Ukuran ikon langsung lewat `font-size` pada `<Icon>`, dan kelas ditaruh di elemennya sendiri:

```vue
<Icon name="lucide:clock" class="meta__ikon" aria-hidden="true" />
```

```css
.meta__ikon {
  font-size: 0.875rem;
}
```

Jangan menulis `:deep(svg)`. `@nuxt/icon` merender ikon sebagai `<span class="iconify">` dan menggambarnya lewat mask CSS, bukan elemen `<svg>`.

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

### Perilaku

- Toast baru muncul di **atas**, bukan bawah.
- Durasi 3 detik.
- Maksimal **3** toast. Kalau lebih, yang paling lama keluar duluan.
- Ada tombol tutup manual, bisa juga lewat keyboard.
- Jarak antar toast 0.875rem.

### Gerak dan bar progres

Gerak dipakai `<TransitionGroup>` dari Vue, bukan animasi manual. Detail kelasnya ada di `Toaster.vue`.

Dua aturan yang tidak boleh dibalik, karena kalau dibalik toast-nya rusak dan tidak ada error yang muncul:

- **Bar progres dikendalikan sepenuhnya oleh CSS animation.** Durasi dan penghapusannya ikut bar itu. Jangan tambahkan timer JavaScript — itu yang bikin gerakan tersendat.
- **`.toast-move` jangan dihapus.** Tanpa itu, toast yang tersisa tidak meluncur mengisi tempat yang kosong.

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

- Pesan terjemahan disimpan di `app/i18n/locales/<code>.json`. Blok yang ada sekarang: `hero`, `cari`, `nav`, `pengaturan`, `slot`, dan `anggota`.
- Struktur kunci harus sama persis di semua file locale.
- Jangan menaruh kunci yang belum dipakai. Kalau sebuah komponen dihapus, kunci yang hanya dipakai komponen itu ikut dihapus dari ketiga file locale.
- Nilai yang bukan brand diterjemahkan. "Running Man" adalah nama acara dari Korea Selatan, bukan brand Rout, dan ditulis sama persis di `id`, `en`, dan `ko` karena itu nama resminya. Keterangannya di `slot.running_man` tetap diterjemahkan, karena penjelasan bukan nama. Kunci boleh Bahasa Indonesia, tapi nama folder dan file `.vue` tidak — aturan lengkapnya ada di [Penamaan](#penamaan).
- `restructureDir: 'app/i18n'` dan `langDir: 'locales'` digabung modul jadi satu path `app/i18n/locales`. Mengubah hanya `langDir` akan membuat modul mencari di `i18n/app/i18n/locales/` dan gagal dengan error ENOENT.
- `localePath` dan `$i18n.locales` tidak tersedia langsung di template. Panggil composable di `<script setup>`: `useLocalePath()`, `useSwitchLocalePath()`, dan `const { locales } = useI18n()`.
- Untuk link, pakai route name, bukan path: `$localePath('product-detail')`. Route name dijamin akurat, dan modul menghasilkan tipe sehingga salah ketik langsung terdeteksi IDE.
- **Params dan query lewat objek, bukan argumen kedua.** `localePath` menerima `(route, locale)` — argumen kedua adalah bahasa, bukan params. Menulis `localePath('nama-route', { id })` menghasilkan tautan yang dirender sebagai `<a>` **tanpa `href`**: tidak bisa diklik, tidak ada error, tidak ada peringatan. Yang benar `localePath({ name: 'nama-route', params: { id } })` dan `localePath({ name: 'nama-route', query: { urutan } })`. Ini pernah terjadi dua kali di halaman klip Running Man.
- `language` pada tiap locale wajib diisi, tidak opsional. Dipakai untuk pencocokan browser dan tag SEO.

### Daftar panjang di dalam locale

Pesan yang berisi banyak baris — deskripsi, daftar karier — **harus disimpan sebagai objek bernomor, bukan larik**:

```json
"karier": {
  "1": "2024년~ SBS “런닝맨”",
  "2": "2018 드라마 tvN “톱스타 유백이”"
}
```

Alasannya `@nuxtjs/i18n` menjalankan message compiler. Dalam mode itu `t()` mengembalikan string apa adanya, sedangkan larik akan ikut diserialisasi dan tampil sebagai teks biasa yang salah. `tm()` memang bisa mengembalikan larik, tapi hanya kalau pesan tidak lewat compiler — dan di proyek ini selalu lewat. Kalau dipakai di sini, `tm()` mengembalikan linked list internal `{ type, start, end, body }`, dan objek itu akan tampil sebagai JSON di halaman.

Objek bernomor menutup keduanya: `t()` tetap dipakai, hasilnya string di mode apa pun.

Dua aturan tambahan:

- **Nomor dimulai dari 1, tanpa celah.** Kalau ada celah, `t()` mengembalikan kunci yang tidak ada dan barisnya ikut hilang.
- **Pencarian berhenti di baris kosong.** Jadi kunci `1`, `2`, lalu `4` berarti hanya dua baris yang tampil — bukan tiga dengan satu kosong di tengah.

### Kunci yang hilang

`t()` untuk kunci yang tidak ada mengembalikan **kunci itu sendiri**, bukan string kosong. Bandingkan hasilnya dengan bentuk kunci itu, jangan dengan teks kosong — string kosong yang sah bisa berarti "sengaja tidak ada isinya", dan keduanya tidak boleh diperlakukan sama. Contoh pemakaiannya ada di `orang` pada blok `anggota`, dibaca lewat fungsi `baca` di `detail.vue`.

Jangan pakai `te()` untuk mengecek keberadaan kunci yang nilainya larik atau objek. `te()` hanya benar untuk nilai string atau angka; untuk larik dan objek ia mengembalikan `false` walaupun kuncinya ada.

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

Aturan itu berlaku untuk teks yang belum jadi. Teks yang **sudah final dan berasal dari sumber** tetap di file locale meski berbahasa Korea — misalnya isi profil cast di blok `anggota`. Alasannya teks itu bukan milik proyek: dia disalin dari sumber, dan menyalinnya ke template berarti menambah satu tempat yang harus dijaga sinkron dengan tiga file locale sekaligus.

`app/app.vue` sudah memasang `useLocaleHead()`, sehingga `<html lang>`, `dir`, `hreflang`, dan `canonical` otomatis tersedia per locale. Jangan menambahkan `useHead()` manual yang menimpanya.

## Sumber data Running Man

Data di `/detail` diambil dari tiga tempat, semuanya resmi:

| Yang diambil | Dari mana |
|---|---|
| Isi profil cast — nama, sapaan, deskripsi, karier, foto | `m.programs.sbs.co.kr/enter/runningman/cast/67779` |
| Status anggota — siapa yang masih aktif | `m.naver.com` |
| Data 지예은, karena tidak ada di SBS | `ko.wikipedia.org/wiki/지예은` |

```
# Halaman cast SBS
https://m.programs.sbs.co.kr/enter/runningman/cast/67779

# Cari status lewat berita, urutan terbaru lebih dulu
https://search.naver.com/search.naver?where=news&sort=1&query=런닝맨+출연진
```

Cara membaca hasil Naver: cari artikel yang menyebut **beberapa nama sekaligus** dalam satu kalimat. Itu lebih bisa dipercaya daripada beberapa artikel terpisah.

### Halaman SBS tidak boleh dipercaya untuk status

Halaman itu sudah lama tidak disentuh, dan isinya tidak cocok dengan keadaan sekarang:

- **지예은** bergabung sejak Desember 2024 dan tidak ada di sana sama sekali
- **이광수** dan **전소민** sudah keluar, tapi masih tercantum

Jadi `aktif` di data cast — ditulis di `app/pages/running-man/detail.vue` — diambil dari Naver, **bukan dari SBS**. Field itu tidak boleh diisi dari tebakan atau dari ingatan — kalau tidak ada sumbernya, biarkan kosong.

지예은 punya satu perbedaan lagi. SBS menulis sapaan dan deskripsi dengan nada sindiran khas acara, dan itu ikut dialirkan ke terjemahan. Wikipedia tidak punya kalimat seperti itu — hanya daftar acara. Jadi entri itu memakai **teks biasa, bukan candaan**, dan isinya diambil dari paragraf pertama serta bagian pendidikan di Wikipedia. Meniru nada SBS berarti mengarang candaan yang tidak pernah diucapkan siapa pun.

### Jangan menambahkan yang tidak ada

Tanggal lahir, asal, MBTI, tinggi, berat, dan zodiak **tidak tersedia** untuk cast Korea. Endpoint cast SBS punya semuanya itu untuk program lain, tapi tidak untuk Running Man, dan tidak ada sumber lain. Mengarangnya lebih buruk daripada tidak menampilkannya.

### Cara teksnya

Teks profil ditulis dalam bahasa Korea lalu diterjemahkan ke `id` dan `en` di `app/i18n/locales/<kode>.json`. Tiga aturan:

- **Judul acara ditulis dua bentuk**: padanannya lalu nama aslinya dalam kurung. Padanan supaya pembaca yang tidak bisa baca Korea punya pegangan; nama aslinya tetap ada karena itulah yang dipakai saat mencari. Padanannya **bukan judul resmi**.
- **Nama jaringan** (SBS, tvN, JTBC, MBC) tidak diterjemahkan. Itu nama perusahaan.
- **Deskripsi SBS berisi sindiran** yang bergantung pada konteks Korea. Terjemahannya boleh kehilangan humor, tapi maknanya harus benar. Sebaiknya diperiksa orang yang bisa membaca Korea sebelum dipakai untuk publik.

## Environment

Satu variabel yang dibaca kode, diambil di `nuxt.config.ts` tanpa nilai default:

```
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

Dipakai untuk `i18n.baseUrl` dan `runtimeConfig.public.siteUrl`, yang menghasilkan URL absolut pada tag `hreflang` dan `canonical`.

Kalau variabel ini kosong, tag SEO jatuh ke path relatif (`/id`, bukan `http://localhost:3000/id`) dan modul memberi peringatan `I18n baseUrl is required to generate valid SEO tag links` saat dev server berjalan.

Domain belum ditetapkan, masih `localhost`. Saat sudah ada domain, ganti nilainya di `.env` lalu restart. Tidak ada kode yang perlu disentuh.

Perhatikan: `baseUrl` **tidak boleh** ditulis sebagai function yang membaca `useRuntimeConfig()`. Nilai function tidak bisa diserialisasi ke runtime config, dan hasilnya tag SEO tetap relatif. Gunakan `process.env` langsung di `nuxt.config.ts`.

`.env` dibaca saat proses start, bukan saat hot reload. Ubah isinya lalu restart dev server, bukan andalkan HMR.

`.env` juga memuat **komentar yang bukan variabel** — catatan alamat sumber data Running Man. Tidak ada kode yang membacanya, dan tidak perlu. Gunanya supaya alamat sumber tidak hilang bersama percakapan tempat data itu ditemukan.

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

- `@nuxt/icon` aktif, jadi `<Icon name="lucide:home" />` bisa langsung dipakai tanpa import manual.
- `README.md` sudah disesuaikan dengan Rout. Konvensi lengkap ada di `AGENTS.md`.
