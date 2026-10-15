/** GET /api/running-man/episode — episode Running Man yang ada di abyss.to.
 *
 *  Satu endpoint untuk seluruh halaman. Tidak ada endpoint per episode,
 *  dan itu pilihan: respons daftar ini sudah memuat slug video, jadi
 *  halaman pemutar tidak pernah menyentuh abyss lagi — ia hanya mencari
 *  di daftar yang sudah ada. Kalau slug tidak ikut dikirim, setiap
 *  pembukaan halaman streaming jadi satu permintaan lagi.
 *
 *  Bentuk respons dan pemetaannya ada di `server/utils/running-man/episode.ts`.
 *  Berkas itu yang tahu kenapa foldernya dicari persis, kenapa nomornya
 *  diambil dari nama folder bukan `createdAt`, dan kenapa daftar ini
 *  memakai `orderBy` abyss hanya untuk pagination — bukan untuk mengurutkan.
 *
 *  **Cache-nya ditulis tangan, bukan `defineCachedEventHandler`.** Itu karena
 *  `opts.validate` di fungsi itu DITIMPA oleh validate bawaannya — lihat
 *  `_opts` di `nitropack/dist/runtime/internal/cache.mjs`: `...opts` ditulis
 *  lebih dulu, `validate` menimpanya sesudahnya, jadi validate kustom
 *  dibuang tanpa satu pun peringatan. Dan validate bawaan hanya menolak
 *  `code >= 400`, jadi larik kosong tetap lolos.
 *
 *  Konsekuensinya kalau tidak ditulis tangan: satu gangguan sesaat mengunci
 *  halaman kosong selama **satu jam penuh**. Gejalanya tidak keras — halaman
 *  tetap hidup, navigasinya jalan, daftarnya saja yang kosong, dan tidak ada
 *  apa pun yang menunjuk ke penyebabnya.
 *
 *  Pola di sini mengikuti `batasTersimpan` di `klip.ts`: diingat di modul,
 *  bukan di storage Nitro. Bedanya, yang lama tidak pernah kosong. */

import type { Episode } from '#shared/types/episode'

/** Satu jam. Lihat catatan di header. */
const TTL_SEKON = 3600

/** Daftar terakhir yang benar-benar berisi episode, dan kapan diambil.
 *
 *  `null` berarti belum pernah berhasil. Itu berbeda dari `[]`, dan
 *  perbedaan itu yang penting: `[]` berarti "sudah dicoba dan jawabannya
 *  tidak ada", dan itu tidak boleh disimpan sama sekali. */
let tersimpan: Episode[] | null = null

let diambilPada = 0

/** Ambil dari abyss, dan ingat hasilnya kalau ada isinya.
 *
 *  Yang kosong **tidak** diingat, itu inti dari seluruh berkas ini. Kalau
 *  mengingatnya, satu kegagalan sementara akan bertahan di semua permintaan
 *  berikutnya sampai TTL habis — dan tidak ada yang bisa membedakannya dari
 *  "memang tidak ada episode-nya".
 *
 *  Kalau gagal tapi masih punya salinan lama, yang dikembalikan salinan
 *  lama. Daftar kosong lebih jujur daripada salmon, tapi salinan yang
 *  basi masih jauh lebih berguna daripada tidak ada apa-apa. */
async function muat(): Promise<Episode[]> {
  try {
    const hasil = await ambilEpisode(kunci())

    if (hasil.length) {
      tersimpan = hasil
      diambilPada = Date.now()
    }

    return hasil
  } catch (error) {
    /* Kegagalan di sini tidak berarti halaman harus ikut gagal. Daftar
     * episode boleh kosong sementara bagian lain tetap tampil, dan lebih
     * baik kosong daripada melempar error yang membuat seluruh halaman
     * rusak. Yang perlu diketahui orang adalah akarnya, jadi dicatat di
     * server. */
    console.warn('[episode] gagal mengambil dari abyss:', error)

    return tersimpan || []
  }
}

export default defineEventHandler(async (event) => {
  /* Belum pernah berhasil: tidak ada yang bisa dilayani, jadi tunggu. */
  if (!tersimpan) return muat()

  const basi = Date.now() - diambilPada >= TTL_SEKON * 1000

  /* Salinan lama dilayani seketika, dan yang baru diambil di belakang kalau
   * memang sudah basi.
   *
   * `waitUntil` membuat server tidak ikut menunggu proses itu. Tanpa itu,
   * halaman menggantung empat detik di setiap pembukaan setelah cache-nya
   * habis — persis yang harus dicegah oleh `swr: true` di `clips.get.ts`. */
  if (basi && event.waitUntil) {
    event.waitUntil(muat())
  }

  return tersimpan
})