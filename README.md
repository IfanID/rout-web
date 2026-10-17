# Respawn Outbase

Situs Rout. Aplikasi web berbasis Nuxt seputar acara Running Man — jadwal
tayang, daftar episode, arsip klip, dan profil cast — dengan antarmuka tiga
bahasa.

| Nama | Peran |
|---|---|
| **Respawn Outbase** | Nama panjang produk |
| **Rout** | Singkatan dari Respawn Outbase |

## Stack

| Paket | Versi |
|---|---|
| nuxt | 4.6.0 |
| vue | 3.5.43 |
| vue-router | 5.3.1 |
| @nuxtjs/i18n | 10.6.0 |
| @nuxt/icon | 2.5.1 |
| @iconify-json/lucide | 1.2.142 |
| hls.js | 1.7.3 |

Runtime pengembangan: Node v26.10.0, npm 12.1.0.

`vue-router` tidak dipakai langsung — routing disusun dari berkas di
`app/pages/`. `hls.js` dipakai pemutar klip Running Man.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Server pengembangan tersedia di `http://localhost:3000`. Akar `/` mengarahkan
ke `/en`.

## Environment

Salin `.env.example` menjadi `.env` lebih dulu:

```bash
cp .env.example .env
```

Tiga variabel yang dibaca kode:

| Variabel | Dipakai untuk |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | URL absolut pada tag `hreflang` dan `canonical` |
| `NUXT_PUBLIC_YOUTUBE_LIVE` | Bagian live di `/running-man`; kosong berarti bagiannya tidak dirender |
| `ABYSS_API_KEY` | Daftar episode dari abyss.to |

`ABYSS_API_KEY` sengaja tidak masuk `runtimeConfig.public`: bagian itu ikut
terkirim ke browser, dan kunci yang sampai ke klien bukan lagi kunci. Kosong
berarti halaman episode tampil kosong, bukan error.

`.env` dibaca saat proses start, bukan saat hot reload — ubah isinya lalu
restart dev server. Berkas itu tidak ikut ter-commit.

`.env.example` juga memuat catatan alamat sumber data Running Man. Tidak ada
kode yang membacanya; gunanya supaya alamat sumber tidak hilang.

## Multi bahasa

Tiga locale dengan awalan URL, termasuk untuk bahasa default:

```
/en  /id  /ko
```

Berkas terjemahan ada di `app/i18n/locales/<code>.json` dengan blok `hero`,
`cari`, `pengaturan`, `slot`, `nav`, `anggota`, `statistik`, `episode_baru`,
dan `aktivitas`. Struktur kunci harus sama persis di ketiga berkas.

## Halaman

Semua alamat diawali kode bahasa, misalnya `/id/running-man`.

| Alamat | Isi |
|---|---|
| `/` | Beranda: judul dan tagline |
| `/running-man` | Episode berikutnya, hitung mundur, pintasan, klip terbaru, live YouTube |
| `/running-man/detail` | Tentang acara, pengenalan anggota, statistik |
| `/running-man/episode` | Daftar episode |
| `/running-man/episode/streaming` | Menonton satu episode |
| `/running-man/preview` | Seluruh arsip klip |
| `/running-man/preview/:id` | Memutar satu klip |
| `/search` | Pencarian seluruh situs: halaman, anggota, episode, dan klip |
| `/settings` | Slot tengah navbar dan bahasa |
| `/profile` | Profil — masih data contoh |
| `/aktivitas` | Riwayat aktivitas di perangkat ini |

## Pencarian

Pencarian punya dua lapis. Halaman, anggota cast, dan episode dicari di browser:
jumlahnya kecil dan teksnya ikut bahasa pemakai. Klip dicari di server — arsipnya
±8.800 baris, jadi tidak dikirim ke peramban setiap kali halaman dibuka.

Server menyimpan indeks seluruh arsip di memori, dan searching hanya membaca
memori itu: tidak ada permintaan ke SBS saat orang mengetik. Indeks dibangun
bertahap, disimpan di `.data/indeks-klip.json`, lalu disegarkan enam jam sekali
dengan 100 klip terbaru dan dipindai penuh sebulan sekali.

`.data/` sudah ada di `.gitignore` dan dibuat ulang sendiri. Hapus berkasnya kalau
ingin indeks dibangun dari nol; biayanya sekitar 9 permintaan ke SBS.

`shared/utils/cari.ts` dipakai server dan browser sekaligus, jadi urutan hasil
untuk satu kueri sama dari mana pun dibaca.

## Perintah

```bash
npm run dev        # server pengembangan
npm run build      # build produksi
npm run generate   # static generate
npm run preview    # pratinjau hasil build
npm test           # uji aturan pencarian tanpa Nuxt
```

## Struktur

```
rout-web/
├── nuxt.config.ts            Modul, sistem warna, runtimeConfig, i18n
├── app/
│   ├── app.vue               Root: SEO head, Header, Toaster, <NuxtPage />
│   ├── assets/css/main.css   Sistem warna, satu-satunya sumber warna
│   ├── components/
│   │   ├── navigation/       Header, BottomNav, LocaleSwitcher, SearchOverlay,
│   │   │                     SearchGroupDialog, slot/
│   │   ├── notification/     Toaster, AktivitasBell
│   │   ├── AiringCountdown.vue  Hitung mundur ke episode berikutnya
│   │   ├── ClipPlayer.vue       Pemutar satu klip
│   │   ├── LivePlayer.vue       Pemutar live YouTube
│   │   ├── PreviewList.vue      Daftar klip
│   │   ├── PreviewSort.vue      Tab urutan klip
│   │   └── SearchResultRow.vue  Satu baris hasil pencarian
│   ├── composables/          useCari dan useCariHalaman untuk pencarian,
│   │                         useRunningMan* untuk data Running Man
│   ├── i18n/locales/         en.json, id.json, ko.json
│   └── pages/                Routing berbasis berkas; daftar alamat ada di atas
├── server/
│   ├── api/
│   │   ├── cari.get.ts       Pencarian klip di indeks proses
│   │   └── running-man/      Endpoint data Running Man
│   ├── plugins/              Pemanasan indeks saat produksi hidup
│   └── utils/running-man/    Pengambilan dari SBS dan abyss.to, plus indeks klip
├── shared/
│   ├── types/                Tipe yang menyeberang dari server ke app
│   └── utils/cari.ts         Normalisasi, skor, sorotan, urutan hasil
├── test/cari.test.ts         Uji aturan pencarian
└── public/                   favicon, robots.txt, foto anggota
```

## Dokumentasi

[`AGENTS.md`](./AGENTS.md) berisi konvensi proyek: aturan bahasa, format
commit, konvensi routing dan komponen, organisasi folder, sistem warna, catatan
pencarian, serta catatan teknis dan sumber data Running Man.

## Referensi

- [Dokumentasi Nuxt](https://nuxt.com/docs/getting-started/introduction)
- [Dokumentasi Nuxt i18n](https://i18n.nuxtjs.org/docs/getting-started)
