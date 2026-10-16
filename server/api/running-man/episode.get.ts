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
 *  Cache-nya dua lapis, karena alur pemiliknya begitu: folder episode
 *  dibuat dulu, videonya diunggah belakangan. Build penuh (±70 permintaan,
 *  ±5 detik) tetap jalan tiap jam di belakang; tapi folder yang kemarin
 *  kosong dicek ulang di setiap permintaan (±0,6 detik per folder) dan
 *  **ditunggu**, jadi video yang baru diunggah muncul saat refresh tanpa
 *  menunggu jam berikutnya. Begitu videonya ketahuan, lapis cepatnya
 *  berhenti sendiri karena tidak ada lagi folder yang perlu dicek.
 *
 *  Folder episode yang **baru dibuat** ketahuannya dari daftar folder,
 *  dan daftar itu dicek tiap 60 detik — juga ditunggu, supaya folder
 *  yang dibuat bersamaan dengan videonya ikut muncul di refresh yang
 *  sama. Harganya satu permintaan ±0,6 detik untuk satu pengunjung tiap
 *  60 detik; di luar jendela itu tidak ada biaya tambahan sama sekali.
 *
 *  Pola di sini mengikuti `batasTersimpan` di `klip.ts`: diingat di modul,
 *  bukan di storage Nitro. Bedanya, yang lama tidak pernah kosong. */

import type { Episode } from '#shared/types/episode'

import type { FolderKosong } from '../../utils/running-man/episode'

/** Satu jam untuk build penuh. Lihat catatan di header. */
const TTL_SEKON = 3600

/** 60 detik untuk daftar folder. Episode baru (folder baru) ketahuannya
 *  dari sini, dan satu permintaan daftar folder tidak cukup murah untuk
 *  dijalankan di setiap permintaan — tapi cukup murah untuk ditunggu
 *  sesekali: satu pengunjung tiap 60 detik menunda ±0,6 detik. */
const CEK_FOLDER_SEKON = 60

/** Lima detik untuk pemeriksaan yang ditunggu. Folder yang kemarin kosong
 *  biasanya satu, jadi ±0,6 detik sudah kembali; batas ini hanya jaga
 *  supaya abyss yang menggantung tidak ikut menggantung halaman. Kalau
 *  batasnya kena, pemeriksaannya tetap jalan di belakang dan hasilnya
 *  dipakai permintaan berikutnya. */
const BATAS_TUNGGU_MS = 5000

/** Daftar terakhir yang benar-benar berisi episode, dan kapan diambil.
 *
 *  `null` berarti belum pernah berhasil. Itu berbeda dari `[]`, dan
 *  perbedaan itu yang penting: `[]` berarti "sudah dicoba dan jawabannya
 *  tidak ada", dan itu tidak boleh disimpan sama sekali. */
let tersimpan: Episode[] | null = null

let diambilPada = 0

/** Folder episode yang belum berisi video saat terakhir dicek. Selama
 *  daftar ini tidak kosong, setiap permintaan menanyakan ulang isinya
 *  dulu — inilah yang membuat video yang baru diunggah langsung muncul. */
let kurang: FolderKosong[] = []

/** Id folder "Running Man" di abyss, supaya cek daftar folder tidak perlu
 *  mencari dari root lagi. */
let folderInduk: string | null = null

/** Kapan daftar folder terakhir dicek, untuk jaga lima menit. Diisi juga
 *  saat build penuh, karena build penuh sudah meminta daftar itu. */
let dicekPada = 0

/** Build penuh yang sedang jalan, kalau ada. Dua permintaan bersamaan
 *  tidak boleh membangun dua kali — yang kedua ikut menumpang yang
 *  pertama. Tanpa ini, setiap refresh tepat setelah cache basi menarik
 *  ±70 permintaan ganda ke abyss. */
let sedangMuat: Promise<void> | null = null

/** Pemeriksaan folder kosong yang sedang jalan, kalau ada. Sama seperti
 *  di atas: yang datang belakangan menumpang, bukan meminta ulang. */
let sedangCek: Promise<void> | null = null

/** Pengecekan daftar folder yang sedang jalan, kalau ada. Jalur ini
 *  sekarang ditunggu permintaan (bukan di belakang), jadi penjaganya
 *  wajib ada: tanpa ini, dua refresh bersamaan tepat setelah jendela
 *  60 detik meminta daftar yang sama dua kali. */
let sedangFolder: Promise<void> | null = null

/** Build penuh dari abyss, dan ingat hasilnya kalau ada isinya.
 *
 *  Yang kosong **tidak** diingat, itu inti dari seluruh berkas ini. Kalau
 *  mengingatnya, satu kegagalan sementara akan bertahan di semua permintaan
 *  berikutnya sampai TTL habis — dan tidak ada yang bisa membedakannya dari
 *  "memang tidak ada episode-nya". */
async function muatPenuh(): Promise<void> {
  try {
    const hasil = await ambilEpisode(kunci())

    if (hasil.daftar.length) {
      tersimpan = hasil.daftar
      kurang = hasil.kurang
      folderInduk = hasil.folderId
      diambilPada = Date.now()
      dicekPada = diambilPada
    }
  } catch (error) {
    /* Kegagalan di sini tidak berarti halaman harus ikut gagal. Daftar
     * episode boleh kosong sementara bagian lain tetap tampil, dan lebih
     * baik kosong daripada melempar error yang membuat seluruh halaman
     * rusak. Yang perlu diketahui orang adalah akarnya, jadi dicatat di
     * server. */
    console.warn('[episode] gagal mengambil dari abyss:', error)
  }
}

/** Build penuh lewat penjaga, supaya tidak jalan dua kali bersamaan. */
function muatLatar(): Promise<void> {
  if (!sedangMuat) {
    sedangMuat = muatPenuh().finally(() => {
      sedangMuat = null
    })
  }

  return sedangMuat
}

/** Muat untuk permintaan pertama: belum ada yang bisa dilayani, jadi
 *  tunggu sampai selesai. */
async function muat(): Promise<Episode[]> {
  await muatLatar()

  return tersimpan || []
}

/** Cek ulang folder yang kemarin kosong, lalu gabungkan yang sudah berisi.
 *
 *  Penggabungannya tahan ganda: nomor yang sudah ada dilewati. Dua
 *  pemeriksaan yang tumpang tindih (satu ditunggu permintaan, satu jalan
 *  di belakang) bisa menemukan episode yang sama, dan tanpa saringan itu
 *  daftarnya berisi nomor kembar. */
async function cekSekarang(): Promise<void> {
  if (!kurang.length) return

  try {
    const { ketemu, masih } = await cekFolderKosong(kunci(), kurang)

    if (ketemu.length) {
      const ada = new Set((tersimpan || []).map(satu => satu.nomor))
      const tambahan = ketemu.filter(satu => !ada.has(satu.nomor))

      if (tambahan.length) {
        tersimpan = [...(tersimpan || []), ...tambahan].sort(
          (a, b) => b.nomor - a.nomor
        )
      }
    }

    kurang = masih
  } catch (error) {
    console.warn('[episode] gagal memeriksa folder kosong:', error)
  }
}

/** Cek yang ditunggu permintaan. Batas lima detiknya lewat `race`: yang
 *  kalah bukan dibatalkan — hasilnya tetap disimpan saat selesai, dan
 *  dipakai permintaan berikutnya. */
async function cekDitugu(): Promise<void> {
  if (!kurang.length) return

  if (!sedangCek) {
    sedangCek = cekSekarang().finally(() => {
      sedangCek = null
    })
  }

  await Promise.race([
    sedangCek,
    new Promise<void>(selesai => setTimeout(selesai, BATAS_TUNGGU_MS))
  ])
}

/** Cari folder episode yang baru dibuat sejak terakhir dicek.
 *
 *  Kalau ada folder baru, ia masuk antrean `kurang` dan isinya langsung
 *  diminta di sini juga — supaya daftar yang dikembalikan permintaan ini
 *  sudah termasuk videonya, bukan menunggu refresh berikutnya.
 *
 *  `dicekPada` dicatat sebelum meminta, bukan sesudah. Kalau dicatat
 *  sesudah, kegagalan berarti "coba lagi di permintaan berikutnya" — dan
 *  abyss yang sedang gangguan akan dihantam setiap ada pengunjung. */
async function cekFolderBaru(): Promise<void> {
  dicekPada = Date.now()

  try {
    const kode = kunci()

    if (!kode || !folderInduk) return

    const daftar = await ambilDaftarFolder(kode, folderInduk)

    const dikenal = new Set([
      ...(tersimpan || []).map(satu => satu.nomor),
      ...kurang.map(satu => satu.nomor)
    ])

    const baru = daftar.filter(satu => !dikenal.has(satu.nomor))

    if (!baru.length) return

    kurang.push(...baru)

    await cekSekarang()
  } catch (error) {
    console.warn('[episode] gagal memeriksa daftar folder:', error)
  }
}

/** Cek daftar folder yang ditunggu permintaan. Sama polanya dengan
 *  `cekDitugu`: menumpang kalau sudah ada yang jalan, dan batas lima
 *  detiknya lewat `race` supaya abyss yang menggantung tidak ikut
 *  menggantung halaman. */
async function cekFolderDitugu(): Promise<void> {
  if (!sedangFolder) {
    sedangFolder = cekFolderBaru().finally(() => {
      sedangFolder = null
    })
  }

  await Promise.race([
    sedangFolder,
    new Promise<void>(selesai => setTimeout(selesai, BATAS_TUNGGU_MS))
  ])
}

export default defineEventHandler(async (event) => {
  /* Belum pernah berhasil: tidak ada yang bisa dilayani, jadi tunggu. */
  if (!tersimpan) return muat()

  /* Masih ada folder yang belum berisi — alur "folder dulu, video
   * belakangan". Isinya ditanya ulang sekarang dan ditunggu, supaya
   * refresh langsung menampilkan video yang baru diunggah. Hanya folder
   * itu yang diminta, bukan seluruh arsip. */
  if (kurang.length) {
    await cekDitugu()
  }

  /* Jendela 60 detik lewat: tanyakan daftar folder sekarang dan tunggu.
   * Inilah yang menangkap folder episode yang baru dibuat — termasuk
   * yang langsung diisi videonya — supaya ikut muncul di refresh yang
   * sama, bukan refresh berikutnya. */
  if (Date.now() - dicekPada >= CEK_FOLDER_SEKON * 1000) {
    await cekFolderDitugu()
  }

  const sekarang = Date.now()
  const basi = sekarang - diambilPada >= TTL_SEKON * 1000

  /* Salinan lama dilayani seketika, dan yang baru diambil di belakang kalau
   * memang sudah basi.
   *
   * `waitUntil` membuat server tidak ikut menunggu proses itu. Tanpa itu,
   * halaman menggantung empat detik di setiap pembukaan setelah cache-nya
   * habis — persis yang harus dicegah oleh `swr: true` di `clips.get.ts`. */
  if (basi && event.waitUntil) {
    event.waitUntil(muatLatar())
  }

  return tersimpan
})
