/** Sumber episode Running Man dari abyss.to: satu tempat untuk alamatnya,
 *  bentuk mentahnya, cara memetakannya, dan aturan-aturan yang hanya bisa
 *  didapat dengan mengetes API-nya.
 *
 *  Berkas di `server/utils/` dipindai Nitro sampai ke subfolder, jadi
 *  isinya bisa dipakai tanpa baris `import`.
 *
 *  Struktur di sisi abyss, hasil pengujian 15 Oktober 2026:
 *
 *    Root
 *    ├── Running Man Thailand      ← nama mirip, berdiri berdampingan
 *    └── Running Man
 *        └── Episode 001 … Episode 070
 *            └── "Running Man Episode 1 Sub Indo.mp4"
 *
 *  Empat hal yang tidak bisa ditebak dari kode dan tidak boleh dilupakan:
 *
 *  1. **Dua folder bernama mirip.** "Running Man" dan "Running Man
 *     Thailand" berdiri berdampingan di root. Pencarian yang longgar —
 *     `startsWith`, atau "yang mengandung kata Running" — akan mengambil
 *     yang Thai, dan seluruh halaman lalu menunjuk ke acara yang salah.
 *     Cocokkan persis.
 *
 *  2. **Nomor ada di nama folder, bukan di nama berkas.** Foldernya
 *     `Episode 070`, berkasnya `Running Man Episode 70 Sub Indo.mp4`.
 *     Nol di depan ada di yang pertama saja. Ambil nomornya dari nama
 *     folder.
 *
 *  3. **`createdAt` bukan urutan episode.** Itu waktu unggah, dan
 *     unggahannya tidak selalu berurutan. Diuji pada 69 episode:
 *     urutan `createdAt:desc` berbeda dari urutan nomor pada **28
 *     posisi** — episode 52 diunggah paling akhir sehingga melompat ke
 *     urutan ke-10. Pakai `orderBy` dari abyss dan daftarnya salah
 *     tanpa error apa pun.
 *
 *  4. **`resolutions` bisa punya label di luar dokumentasi.** Daftar resmi
 *     menyebut SD, HD, FullHD, 2K, 4K; episode 13 punya `mHD` yang tidak
 *     disebut di sana. Jangan disaring ke daftar tetap.
 */

import type { Episode } from '#shared/types/episode'

/** Alamat API abyss. */
export const ALAMAT_ABYSS = 'https://api.abyss.to'

/** Alamat player. Slug video adalah id berkasnya, persis — tidak ada
 *  transformasi di antaranya. */
export const ALAMAT_PLAYER = 'https://player.abyssplayer.com'

/** Nama folder yang dicari di root, sudah dinormalkan. */
const NAMA_FOLDER = 'running man'

/** Berapa banyak item per halaman. Batasnya 100, itu batas abyss. */
const PER_HALAMAN = 100

/** Berapa banyak folder yang dibuka sekaligus. Tujuh puluh-something masih
 *  muat dalam satu halaman, jadi angka ini hanya jaga supaya kalau nanti
 *  arsipnya tumbuh, permintaan tidak ditarik sepuluh kali berturut-turut
 *  tanpa jeda. */
const BERSAMAAN = 10

/** Kunci API. Dibaca per panggilan, bukan sekali di modul — `useRuntimeConfig()`
 *  hanya bisa dipanggil dari dalam konteks request. */
function kunciApi(): string {
  return useRuntimeConfig().abyssKey || ''
}

/* Bentuk yang dipakai abyss di responsnya. Yang tidak dipetik di sini boleh
   tetap ada — field yang tidak dipetakan justru tidak ikut dikirim. */

interface FolderMentah {
  id?: string
  name?: string
}

interface BerkasMentah {
  id?: string
  name?: string
  size?: number
  status?: string
  resolutions?: string[]
  updatedAt?: string
}

/** Satu halaman isi folder.
 *
 *  `pageToken` dipakai di sini dan TIDAK pernah keluar ke halaman: kalau
 *  token ikut dikirim ke klien, orang bisa mengulang seluruh permintaan ini
 *  dari browsernya — dan jatah API-nya sama dengan jatah server. */
async function ambilHalaman<T>(
  jalur: string,
  kunci: string,
  param: Record<string, string> = {}
): Promise<{ items: T[]; token: string | null }> {
  const data = await $fetch<{ items?: T[]; pageToken?: string | null }>(
    `${ALAMAT_ABYSS}${jalur}`,
    {
      query: { key: kunci, maxResults: String(PER_HALAMAN), ...param }
    }
  )

  return { items: data.items || [], token: data.pageToken || null }
}

/** Seluruh isi satu folder, sampai halaman terakhir habis. */
async function ambilSemua<T>(
  jalur: string,
  kunci: string,
  param: Record<string, string> = {}
): Promise<T[]> {
  const terkumpul: T[] = []
  let token: string | null = null

  /* Query dirakit dulu, baru dipanggil.
   *
   * Ditulis berurutan seperti `ambilHalaman(..., { pageToken: token })`
   * membuat `halaman` dan `token` saling bergantung di dalam inisialisasi
   * masing-masing, dan TypeScript menolak menebaknya (TS7022). Pisahkan
   * dua langkah itu dan tipe keduanya tegas. */
  let halaman: { items: T[]; token: string | null }

  do {
    halaman = await ambilHalaman<T>(
      jalur,
      kunci,
      token ? { ...param, pageToken: token } : param
    )

    terkumpul.push(...halaman.items)
    token = halaman.token
  } while (token)

  return terkumpul
}

/** Menormalkan nama folder: huruf besar-kecil dan spasi berlipat tidak
 *  berpengaruh, supaya "Running  Man" dan "running man" tetap satu. */
function normalisasi(nama: string): string {
  return nama.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Folder program di root, atau null kalau tidak ketemu.
 *
 *  Persis, bukan longgar — lihat catatan 1 di header. Null, bukan error:
 *  pemanggilnya mengembalikan daftar kosong dengan log, bukan melempar
 *  yang membuat seluruh halaman mati. */
export async function cariFolder(
  nama: string,
  kunci: string
): Promise<string | null> {
  const isi = await ambilSemua<FolderMentah>('/v1/folders/list', kunci)

  const cocok = isi.find(satu => normalisasi(satu.name || '') === nama)

  return cocok?.id || null
}

/** Nomor episode dari nama folder, atau null kalau bukan pola episode.
 *
 *  Rentangnya dibiarkan longgar supaya "Episode 7" dan "Episode 007"
 *  sama-sama terbaca kalau nanti ada yang tidak konsisten. */
function keNomor(nama: string): number | null {
  const cocok = /episode\s*(\d+)/i.exec(nama)

  return cocok ? Number(cocok[1]) : null
}

/** Membelah nama berkas menjadi nama acara dan keterangan.
 *
 *    "Running Man Episode 70 Sub Indo.mp4"
 *                  -> acara = "Running Man"
 *                     label = "Sub Indo"
 *
 *  Ekstensi dibuang: ".mp4" bukan informasi, hanya noise di ujung baris.
 *  Pemecahannya pada pola "Episode <nomor>", bukan pada spasi terakhir —
 *  kalau nanti ada "Episode 70 Sub Indo 1080p", keterangannya tetap
 *  "Sub Indo 1080p", bukan "1080p" saja.
 *
 *  Nama berkas yang tidak memuat pola itu tidak dibuang: seluruhnya jadi
 *  acara, dan label kosong. Membuangnya berarti baris hilang padahal
 *  videonya bisa diputar. */
function pecahNama(
  nama: string,
  nomor: number
): { acara: string; label: string } {
  const bersih = nama.replace(/\.[a-z0-9]+$/i, '')

  const pola = new RegExp(`^(.*?)\\s*Episode\\s*0*${nomor}\\b(.*)$`, 'i')

  const cocok = pola.exec(bersih)

  if (!cocok) return { acara: bersih, label: '' }

  return { acara: cocok[1].trim(), label: cocok[2].trim() }
}

/** Satu episode dari foldernya, atau null kalau belum bisa diputar.
 *
 *  Berkas yang belum `ready` dilewati: player abyss menampilkan
 *  "slug does not exist" untuk yang masih diproses, jadi mengirimnya
 *  berarti membuat baris yang kelihatan bisa diketuk tapi tidak melakukan
 *  apa pun. Folder kosong ikut hilang dengan hal yang sama — `items`-nya
 *  kosong, dan episode 66 memang begitu.
 *
 *  Kalau ada beberapa berkas, yang dipilih adalah yang `updatedAt` paling
 *  baru. Episode 32 punya dua berkas yang namanya sama persis, jadi hari
 *  ini tidak ada bedanya — tapi kalau videonya diunggah ulang karena rusak,
 *  yang baru otomatis menang tanpa perlu disentuh. */
async function ambilSatu(
  folder: string,
  nomor: number,
  kunci: string
): Promise<Episode | null> {
  const isi = await $fetch<{ items?: BerkasMentah[] }>(
    `${ALAMAT_ABYSS}/v1/resources`,
    {
      query: { key: kunci, folderId: folder, type: 'files', maxResults: '100' }
    }
  )

  const berkas = (isi.items || [])
    .filter(satu => satu.status === 'ready' && satu.id)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0]

  if (!berkas?.id) return null

  const { acara, label } = pecahNama(berkas.name || '', nomor)

  return {
    nomor,
    acara,
    label,
    berkas: berkas.id,
    ukuran: berkas.size || 0,
    /* Apa adanya. Saringan ke daftar dokumentasi akan membuang `mHD`
     * milik episode 13 — lihat catatan 4 di header. */
    resolusi: berkas.resolutions || [],
    pemutar: `${ALAMAT_PLAYER}/${berkas.id}`
  }
}

/** Seluruh episode Running Man, nomor terbesar di atas.
 *
 *  Dua tahap: daftar folder dulu, lalu isi foldernya. Tahap kedua
 *  dijalankan beberapa folder sekaligus — tujuh puluh permintaan berurutan
 *  memakan waktu yang terasa, sementara sepuluh sekaligus mengisi
 *  semuanya dalam empat detik.
 *
 *  Hanya yang selesai dipetakan yang dikirim. Episode yang foldernya
 *  kosong atau belum diproses tidak muncul sama sekali, bukan muncul lalu
 *  gagal saat diketuk. */
export async function ambilEpisode(kunci: string): Promise<Episode[]> {
  if (!kunci) return []

  const folder = await cariFolder(NAMA_FOLDER, kunci)

  if (!folder) return []

  const isi = await ambilSemua<FolderMentah>('/v1/folders/list', kunci, {
    folderId: folder
  })

  /* Nomor diambil di sini, bukan nanti: folder yang namanya bukan pola
     episode tidak punya nomor, dan tidak bisa diurutkan. */
  const bertanda = isi
    .map(satu => ({ id: satu.id || '', nomor: keNomor(satu.name || '') }))
    .filter(
      (satu): satu is { id: string; nomor: number } =>
        Boolean(satu.id) && satu.nomor !== null
    )

  /* Numerik, bukan string dan bukan `createdAt`. Perbandingan string
     menempatkan "Episode 100" sebelum "Episode 99", karena '1' < '9' —
     benar selama nolnya tiga digit, salah begitu nomornya mencapai tiga
     digit. Angka yang dibandingkan. */
  bertanda.sort((a, b) => b.nomor - a.nomor)

  const hasil: Episode[] = []

  for (let mulai = 0; mulai < bertanda.length; mulai += BERSAMAAN) {
    const giliran = bertanda.slice(mulai, mulai + BERSAMAAN)

    const dapat = await Promise.all(
      giliran.map(satu => ambilSatu(satu.id, satu.nomor, kunci).catch(() => null))
    )

    for (const satu of dapat) {
      if (satu) hasil.push(satu)
    }
  }

  return hasil
}

/** Kunci API dari runtimeConfig, untuk handler. */
export function kunci(): string {
  return kunciApi()
}