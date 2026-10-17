/** Indeks pencarian untuk seluruh arsip klip Running Man.
 *
 *  Kenapa ada di sini, bukan di browser: arsipnya sekitar 8.800 klip.
 *  Mengirim semuanya ke peramban setiap kali halaman dibuka berarti
 *  sekitar 19 MB untuk sesuatu yang mungkin tidak dipakai. Server
 *  menyimpannya sekali di memori, lalu setiap pencarian hanya membaca
 *  memori itu — tidak ada permintaan ke SBS saat orang mengetik.
 *
 *  Sumbernya sama dengan halaman klip: `ambilKlip()` di `klip.ts`.
 *  Bedanya di granularitas. Halaman meminta 20–100 klip; indeks meminta
 *  1.000 per batch supaya seluruh arsip selesai dalam sembilan
 *  permintaan, bukan delapan puluh delapan.
 *
 *  Tiga aturan yang menjaga beban tetap kecil:
 *
 *  1. Build bertahap. Batch pertama langsung bisa dicari; sisanya jalan
 *     di belakang. Batch pertama didahulukan, lalu sisanya 2–3 sekaligus.
 *  2. Hasilnya disimpan ke `.data/indeks-klip.json`. Restart membaca
 *     file, bukan SBS.
 *  3. Refresh hanya mengambil 100 klip terbaru, bukan seluruh arsip.
 *     Sapu penuh untuk membuang klip yang sudah dihapus cukup sebulan
 *     sekali.
 *
 *  Semua state di sini adalah state proses. Kalau server dijalankan di
 *  lebih dari satu instance, tiap instance punya indeksnya sendiri —
 *  sama seperti cache episode di handler episode.get.ts. */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { Klip } from '#shared/types/klip'
import type {
  JawabanCari,
  KandidatKlip,
  KeadaanIndeks,
  StatusIndeksKlip
} from '#shared/types/cari'
import {
  buatBidang,
  siapkanKueri,
  skorBidang,
  bandingKandidat,
  type BidangCari,
  type KandidatUrut
} from '#shared/utils/cari'

import { ambilKlip, SORT_TERBARU } from './klip'

/** Versi bentuk file. Dinaikkan kalau isi baris berubah; file lama lalu
 *  dibuang dan dibangun ulang, bukan dibaca dengan bentuk yang salah. */
const VERSI = 1

/** Satu batch build. Seribu adalah batas SBS per permintaan, jadi angka
 *  ini sekaligus jumlah klip paling banyak yang bisa diambil sekali
 *  jalan. */
const UKURAN_BATCH = 1000

/** Berapa batch yang diambil bersamaan setelah batch pertama. Tiga cukup
 *  untuk memangkas waktu tunggu, tanpa membuat 19 MB tiba sekaligus. */
const BATCH_BERSAMA = 3

/** Refresh hanya perlu seratus klip terbaru. Klip baru masuk beberapa
 *  kali seminggu; kalau lebih dari seratus, halaman berikutnya diambil
 *  sampai bertemu id lama. */
const UKURAN_REFRESH = 100

/** Enam jam. Cukup sering untuk menangkap klip baru tanpa menjadikan
 *  SBS sebagai tempat latihan. */
const TTL_REFRESH_MS = 6 * 60 * 60 * 1000

/** Sebulan sekali arsip dipindai ulang dari awal untuk membuang klip
 *  yang sudah dihapus SBS. Ini satu-satunya operasi 19 MB setelah build
 *  pertama. */
const JEDA_SAPU_MS = 30 * 24 * 60 * 60 * 1000

/** Setelah gagal, jangan coba lagi di setiap permintaan. */
const JEDA_GAGAL_MS = 60 * 1000

/** Permintaan pertama boleh menunggu sebentar supaya batch pertama
 *  sempat masuk. Lebih lama dari ini, halaman hasil lebih baik tampil
 *  dengan keterangan “sedang disiapkan”. */
const TUNGGU_AWAL_MS = 1500

/** Batas tunggu refresh ringan yang dipicu kueri angka. */
const TUNGGU_REFRESH_MS = 2000

/** Berapa hasil klip yang dikirim untuk satu pencarian. */
const BATAS_HASIL = 20

/** Lokasi file. `.data/` sudah ada di `.gitignore`. */
const JALUR = join(process.cwd(), '.data', 'indeks-klip.json')

interface Entri {
  id: string
  judul: string
  episode: number | null
  tanggal: string
  detik: number
  gambar: string
  bidang: BidangCari[]
}

let indeks: Entri[] = []
let idTerdapat = new Set<string>()

let keadaan: KeadaanIndeks = 'kosong'
let lengkap = false
let diperbarui: string | null = null
let offsetTercapai = 0
let galat = false
let gagalPada = 0
let refreshTerakhir = 0
let refreshRinganPada = 0

/** Kapan sapu penuh terakhir. Dipisah dari `diperbarui` karena refresh
 *  enam jam selalu memperbarui `diperbarui` — kalau sapu memakai nilai
 *  itu, sapu penuh tidak akan pernah jalan. */
let sapuTerakhir = 0

/** Satu tugas berat (build/refresh/sapu) dalam satu waktu. */
let tugas: Promise<void> | null = null

/** Muat dari disk hanya sekali, dan semua pemanggil menunggu yang sama. */
let memuat: Promise<void> | null = null
let sudahMuat = false

function jeda(ms: number): Promise<void> {
  return new Promise(selesai => setTimeout(selesai, ms))
}

/** Memberi napas ke event loop. Satu batch 1.000 klip adalah JSON
 *  sekitar 2,2 MB; memprosesnya tanpa jeda membuat permintaan lain
 *  menunggu di belakangnya. */
function napas(): Promise<void> {
  return new Promise(selesai => setImmediate(selesai))
}

function nomorEpisode(teks: string): number | null {
  const cocok = /(\d+)/.exec(teks || '')

  return cocok ? Number(cocok[1]) : null
}

function keEntri(klip: Klip): Entri {
  const episode = nomorEpisode(klip.episode)
  const tanggal = klip.tanggal ? klip.tanggal.replace(/-/g, ' ') : ''

  /* Alias ini yang membuat `episode 822`, `822회`, dan `822` sama-sama
   * menemukan klip dari episode itu, walaupun judul aslinya berbahasa
   * Korea dan tidak memuat angka tersebut. */
  const alias = [
    episode ? `episode ${episode} ep ${episode} ${episode}회 ${episode}화` : '',
    tanggal
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id: klip.id,
    judul: klip.judul,
    episode,
    tanggal: klip.tanggal,
    detik: klip.detik,
    gambar: klip.gambar,
    bidang: [
      buatBidang(klip.judul, 1, true),
      buatBidang(alias, 0.8)
    ]
  }
}

function tambahBanyak(klip: readonly Klip[], depan: boolean): number {
  const baru: Entri[] = []

  for (const satu of klip) {
    if (!satu.id || idTerdapat.has(satu.id)) continue

    const entri = keEntri(satu)

    idTerdapat.add(entri.id)
    baru.push(entri)
  }

  if (!baru.length) return 0

  /* Menyalin larik lebih mahal daripada mendorong satu per satu, tapi
   * ini hanya terjadi saat ada klip baru. Sekali sebulan untuk sapu
   * penuh, dan beberapa kali saat build pertama. */
  indeks = depan ? [...baru, ...indeks] : [...indeks, ...baru]

  return baru.length
}

/* ============================================================
   Penyimpanan
   ============================================================ */

interface IsiBerkas {
  versi: number
  diperbarui: string | null
  lengkap: boolean
  offset: number
  /** Epoch ms sapu penuh terakhir. Berkas versi lama tidak punya ini. */
  sapu?: number
  entri: unknown[]
}

function barisDari(entri: Entri): unknown[] {
  return [
    entri.id,
    entri.judul,
    entri.episode,
    entri.tanggal,
    entri.detik,
    entri.gambar
  ]
}

function entriDariBaris(baris: unknown): Entri | null {
  if (!Array.isArray(baris) || baris.length < 6) return null

  const [id, judul, episode, tanggal, detik, gambar] = baris

  if (typeof id !== 'string' || !id) return null
  if (typeof judul !== 'string') return null

  const nomor = typeof episode === 'number' && Number.isFinite(episode) ? episode : null
  const tanggalAman = typeof tanggal === 'string' ? tanggal : ''
  const detikAman = typeof detik === 'number' && Number.isFinite(detik) ? detik : 0
  const gambarAman = typeof gambar === 'string' ? gambar : ''
  const aliasTanggal = tanggalAman ? tanggalAman.replace(/-/g, ' ') : ''

  const alias = [
    nomor ? `episode ${nomor} ep ${nomor} ${nomor}회 ${nomor}화` : '',
    aliasTanggal
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id,
    judul,
    episode: nomor,
    tanggal: tanggalAman,
    detik: detikAman,
    gambar: gambarAman,
    bidang: [
      buatBidang(judul, 1, true),
      buatBidang(alias, 0.8)
    ]
  }
}

async function muatDariDisk(): Promise<void> {
  if (memuat) return memuat

  memuat = (async () => {
    try {
      const teks = await readFile(JALUR, 'utf8')
      const isi = JSON.parse(teks) as Partial<IsiBerkas>

      if (isi.versi !== VERSI || !Array.isArray(isi.entri)) return

      const baru: Entri[] = []
      const idBaru = new Set<string>()

      for (const baris of isi.entri) {
        const entri = entriDariBaris(baris)

        if (!entri || idBaru.has(entri.id)) continue

        idBaru.add(entri.id)
        baru.push(entri)
      }

      if (!baru.length) return

      indeks = baru
      idTerdapat = idBaru
      lengkap = isi.lengkap === true
      keadaan = lengkap ? 'lengkap' : 'sebagian'
      diperbarui = typeof isi.diperbarui === 'string' ? isi.diperbarui : null
      offsetTercapai =
        typeof isi.offset === 'number' && isi.offset >= 0 ? isi.offset : baru.length
      refreshTerakhir = diperbarui ? Date.parse(diperbarui) || 0 : 0
      sapuTerakhir = typeof isi.sapu === 'number' ? isi.sapu : 0
    } catch (error) {
      /* Berkas yang belum ada adalah keadaan normal pada instalasi
       * pertama. Yang perlu dicatat hanya kegagalan lain — file rusak,
       * izin ditolak — karena itu berarti build ulang, bukan sekadar
       * “belum pernah dibangun”. */
      const kode = (error as { code?: string }).code

      if (kode !== 'ENOENT') {
        console.warn('[cari] gagal membaca indeks klip:', error)
      }

      indeks = []
      idTerdapat = new Set()
    } finally {
      sudahMuat = true
    }
  })()

  return memuat
}

/** Antrean tulis, supaya dua penyimpanan tidak berebut file sementara
 *  yang sama. */
let antreSimpan: Promise<void> = Promise.resolve()

function simpan(): Promise<void> {
  const isi: IsiBerkas = {
    versi: VERSI,
    diperbarui,
    lengkap,
    offset: offsetTercapai,
    sapu: sapuTerakhir,
    entri: indeks.map(barisDari)
  }

  antreSimpan = antreSimpan
    .then(async () => {
      await mkdir(dirname(JALUR), { recursive: true })

      const sementara = `${JALUR}.tmp`

      await writeFile(sementara, JSON.stringify(isi), 'utf8')
      await rename(sementara, JALUR)
    })
    .catch(error => {
      /* Gagal menulis tidak boleh mematikan pencarian. Indeksnya tetap
       * ada di memori; yang hilang hanya kemampuan melanjutkan setelah
       * restart. */
      console.warn('[cari] gagal menyimpan indeks klip:', error)
    })

  return antreSimpan
}

/* ============================================================
   Membangun dan menyegarkan
   ============================================================ */

async function tambahBatch(offset: number, depan: boolean = false): Promise<number> {
  const klip = await ambilKlip(offset, UKURAN_BATCH, SORT_TERBARU)

  tambahBanyak(klip, depan)

  return klip.length
}

async function bangunPenuh(): Promise<void> {
  let awal = offsetTercapai

  /* Kalau belum ada apa pun, mulai dari nol. Kalau sebelumnya berhenti
   * di tengah, lanjutkan dari checkpoint — bukan mengulang 19 MB. */
  if (!indeks.length) awal = 0

  if (!indeks.length) {
    const panjang = await tambahBatch(0)

    if (!panjang) throw new Error('arsip klip kosong')

    offsetTercapai = panjang
    keadaan = 'sebagian'
    diperbarui = new Date().toISOString()

    await simpan()
  }

  let offset = offsetTercapai

  /* Berhenti saat batch mengembalikan NOL klip, bukan saat batch tidak
   * penuh.
   *
   * Ini yang pernah memotong satu klip dari arsip, dan gejalanya muncul
   * jauh dari sini: klip terakhir itu tidak ada di indeks, jadi halaman
   * satu klip tidak bisa mencari judulnya dan jatuh ke teks cadangan —
   * padahal videonya tetap bisa diputar.
   *
   * "Kurang dari 1.000" hanya berarti rentang itu melewati ujung arsip,
   * bukan bahwa arsip habis tepat di situ. Terbukti: batch di offset
   * 8.000 menjawab 872 klip, tapi SBS masih punya satu klip di offset
   * 8.872 — jadi batch terakhir yang tidak penuh menyisakan sisipan yang
   * tidak pernah diambil. Arsip sebenarnya 8.873 klip, indeks lama
   * 8.872.
   *
   * Batch kosong adalah satu-satunya jawaban yang tidak bisa ditafsirkan
   * lain. Onkosnya satu permintaan per build, dan ukurannya nol byte. */
  for (;;) {
    const gelombang: number[] = []

    for (let i = 0; i < BATCH_BERSAMA; i++) {
      gelombang.push(offset + i * UKURAN_BATCH)
    }

    const hasil = await Promise.all(
      gelombang.map(satu => ambilKlip(satu, UKURAN_BATCH, SORT_TERBARU))
    )

    let selesai = false

    for (const klip of hasil) {
      tambahBanyak(klip, false)
      offset += klip.length

      if (klip.length === 0) {
        selesai = true
        break
      }
    }

    offsetTercapai = offset
    keadaan = 'sebagian'
    diperbarui = new Date().toISOString()

    await simpan()

    if (selesai) break

    /* Beri kesempatan permintaan lain dilayani sebelum gelombang
     * berikutnya diurai. */
    await napas()
  }

  lengkap = true
  keadaan = 'lengkap'
  diperbarui = new Date().toISOString()
  offsetTercapai = indeks.length
  sapuTerakhir = Date.now()

  await simpan()
}

async function segarkan(): Promise<void> {
  if (!lengkap) return

  const baru: Klip[] = []
  let berhenti = false

  /* Biasanya satu permintaan saja: halaman pertama sudah memuat id yang
   * dikenal. Kalau ada lebih dari seratus klip baru, lanjut ke halaman
   * berikutnya sampai batas lima — sisanya ditangkap refresh berikutnya
   * atau sapu penuh. */
  for (let halaman = 0; halaman < 5 && !berhenti; halaman++) {
    const klip = await ambilKlip(halaman * UKURAN_REFRESH, UKURAN_REFRESH, SORT_TERBARU)

    if (!klip.length) break

    for (const satu of klip) {
      if (idTerdapat.has(satu.id)) {
        berhenti = true
        break
      }

      baru.push(satu)
    }

    if (klip.length < UKURAN_REFRESH) break
  }

  if (baru.length) {
    tambahBanyak(baru, true)
    offsetTercapai = indeks.length
  }

  diperbarui = new Date().toISOString()
  refreshTerakhir = Date.now()

  await simpan()
}

/** Sapu penuh: bangun larik baru, lalu tukar sekaligus.
 *
 *  Selama proses ini berjalan, `indeks` lama tetap dipakai melayani
 *  pencarian. Kalau gagal di tengah, larik lama tidak tersentuh. */
async function sapuPenuh(): Promise<void> {
  const baru: Entri[] = []
  const idBaru = new Set<string>()

  for (let offset = 0; ; offset += UKURAN_BATCH) {
    const klip = await ambilKlip(offset, UKURAN_BATCH, SORT_TERBARU)

    for (const satu of klip) {
      if (!satu.id || idBaru.has(satu.id)) continue

      idBaru.add(satu.id)
      baru.push(keEntri(satu))
    }

    /* NOL, bukan "kurang dari 1.000" — alasannya sama seperti di
     * `bangunPenuh`. Kalau di sini masih memakai batas ukuran batch,
     * sapu bulanan akan memotong ulang klip terakhir itu setiap bulan
     * setelah ia berhasil masuk sekali. */
    if (klip.length === 0) break

    await napas()
  }

  if (!baru.length) throw new Error('arsip klip kosong saat sapu penuh')

  indeks = baru
  idTerdapat = idBaru
  lengkap = true
  keadaan = 'lengkap'
  offsetTercapai = baru.length
  diperbarui = new Date().toISOString()
  refreshTerakhir = Date.now()
  sapuTerakhir = refreshTerakhir

  await simpan()
}

/** Menjalankan satu tugas berat. Pemanggil berikutnya menumpang tugas
 *  yang sama, bukan memulai yang kedua.
 *
 *  `jenis` menentukan cara kegagalan dilaporkan. Kegagalan build berarti
 *  cakupan indeks belum lengkap, dan itu harus terlihat. Kegagalan
 *  refresh atau sapu penuh tidak mengubah data yang sudah ada — data
 *  lama tetap sah, jadi jangan menurunkan status menjadi "sebagian"
 *  hanya karena pembaruan gagal. */
function jalankan(
  fn: () => Promise<void>,
  jenis: 'build' | 'segarkan' | 'sapu' = 'build'
): Promise<void> {
  if (tugas) return tugas

  tugas = (async () => {
    try {
      await fn()
      galat = false
    } catch (error) {
      gagalPada = Date.now()

      if (jenis === 'build') {
        galat = true
        keadaan = indeks.length ? 'sebagian' : 'gagal'
      }

      console.warn(`[cari] gagal ${jenis} indeks klip:`, error)
    } finally {
      tugas = null
    }
  })()

  return tugas
}

/** Dipanggil handler sebelum mencari. Tidak pernah melempar error:
 *  pencarian harus tetap bisa dijawab dengan data yang ada. */
export async function siapkanIndeks(
  event?: { waitUntil?: (p: Promise<unknown>) => void }
): Promise<void> {
  await muatDariDisk()

  const sekarang = Date.now()

  if (!indeks.length) {
    if (tugas) {
      await Promise.race([tugas, jeda(TUNGGU_AWAL_MS)])
      return
    }

    if (sekarang - gagalPada < JEDA_GAGAL_MS) return

    const jalan = jalankan(bangunPenuh)

    await Promise.race([jalan, jeda(TUNGGU_AWAL_MS)])
    return
  }

  /* Indeks ada tapi belum lengkap: lanjutkan build di belakang, jangan
   * tahan permintaan yang sudah bisa dijawab sebagian. */
  if (!lengkap && !tugas && sekarang - gagalPada >= JEDA_GAGAL_MS) {
    const jalan = jalankan(bangunPenuh)

    if (event?.waitUntil) event.waitUntil(jalan)
    else void jalan

    return
  }

  if (lengkap && !tugas && sekarang - gagalPada >= JEDA_GAGAL_MS) {
    if (sekarang - refreshTerakhir >= TTL_REFRESH_MS) {
      const jalan = jalankan(segarkan, 'segarkan')

      if (event?.waitUntil) event.waitUntil(jalan)
      else void jalan

      return
    }

    if (sekarang - sapuTerakhir >= JEDA_SAPU_MS) {
      const jalan = jalankan(sapuPenuh, 'sapu')

      if (event?.waitUntil) event.waitUntil(jalan)
      else void jalan
    }
  }
}

/* ============================================================
   Pencarian
   ============================================================ */

function bonusKebaruan(tanggal: string, sekarang: number): number {
  const waktu = Date.parse(`${tanggal}T00:00:00.000Z`)

  if (!Number.isFinite(waktu)) return 0

  const hari = Math.max(0, (sekarang - waktu) / 86_400_000)

  /* Klip baru sedikit lebih tinggi kalau skornya sama. Setelah sekitar
   * setahun, bonusnya habis — tanggal tua tidak boleh mengalahkan
   * kecocokan judul yang lebih baik. */
  return Math.max(0, 30 - 5 * Math.log2(1 + hari))
}

interface SkorEntri extends KandidatUrut {
  entri: Entri
  skor: number
  tanggal: string
  id: string
}

/** Mengambil satu halaman hasil.
 *
 *  Seluruh kecocokan diurutkan, lalu dipotong `offset`/`limit`. Untuk
 *  arsip 8.800 baris ini masih beberapa milidetik; memotong dengan
 *  top-K akan membuat halaman kedua tidak bisa diambil tanpa mengulang
 *  perhitungan yang sama. */
function cariDiIndeks(
  kueri: string,
  offset: number = 0,
  limit: number = BATAS_HASIL
): { kandidat: KandidatKlip[]; jumlah: number } {
  const siap = siapkanKueri(kueri)

  if (!siap.token.length || !indeks.length) {
    return { kandidat: [], jumlah: 0 }
  }

  const sekarang = Date.now()
  const semua: SkorEntri[] = []

  for (const entri of indeks) {
    const dasar = skorBidang(siap, entri.bidang)

    if (dasar === null) continue

    semua.push({
      entri,
      skor: Math.round(dasar + bonusKebaruan(entri.tanggal, sekarang)),
      tanggal: entri.tanggal,
      id: entri.id
    })
  }

  semua.sort(bandingKandidat)

  return {
    kandidat: semua.slice(offset, offset + limit).map(satu => ({
      id: satu.entri.id,
      judul: satu.entri.judul,
      episode: satu.entri.episode,
      tanggal: satu.entri.tanggal,
      detik: satu.entri.detik,
      gambar: satu.entri.gambar,
      skor: satu.skor
    })),
    jumlah: semua.length
  }
}

export function statusIndeks(): StatusIndeksKlip {
  return {
    keadaan,
    terindeks: indeks.length,
    diperbarui,
    sedang: Boolean(tugas),
    galat
  }
}

/** Satu klip dari indeks, atau `null` kalau idnya tidak dikenal.
 *
 *  Dipakai halaman satu klip untuk mengisi judul dan metanya sendiri.
 *  Tanpa ini, halaman itu hanya bisa mendapatkan judul dari daftar yang
 *  barusan diketuk — jadi tautan langsung, tautan yang dibagikan,
 *  refresh, dan hasil pencarian semuanya berakhir dengan judul
 *  cadangan.
 *
 *  Sengaja **tidak** menunggu `siapkanIndeks()`. Halaman klip tidak
 *  boleh ikut tertahan build indeks: kalau klipnya belum ada, yang
 *  benar adalah judul cadangan, bukan halaman yang menggantung.
 *
 *  Satu `find`, bukan Map per id. Ada lima tempat yang mengubah array
 *  `indeks` — muat dari disk, prepend, append, tukar saat sapu penuh,
 *  dan `catatKlip` — jadi Map berarti satu invariant baru yang harus
 *  dijaga di kelima tempat itu. Memindai 8.872 entri sekali per
 *  halaman tidak terasa, dan indeksnya sudah dipindai penuh untuk
 *  setiap pencarian. */
export function cariKlipById(id: string): Klip | null {
  const entri = indeks.find((satu) => satu.id === id)

  if (!entri) return null

  return {
    id: entri.id,
    judul: entri.judul,
    /* Bentuknya sama dengan `keEpisode` di `klip.ts`: nomor jadi
     * "Episode 777", dan `null` jadi kosong — bukan "Episode 0" untuk
     * klip dari 2010 yang memang belum punya nomor. */
    episode: entri.episode ? `Episode ${entri.episode}` : '',
    tanggal: entri.tanggal,
    detik: entri.detik,
    /* `gambar` sudah https: `keEntri` memetakan dari `Klip`, dan
     * penggantiannya terjadi di `petakanKlip`. */
    gambar: entri.gambar
  }
}

/** Jawaban satu pencarian klip.
 *
 *  Kalau kuerinya memuat angka, indeksnya sudah lengkap, tetapi tidak
 *  ada klip yang cocok, arsipnya dicek ulang sekali: bisa jadi klip
 *  untuk episode itu baru diunggah setelah refresh terakhir. Dibatasi
 *  sekali per menit supaya tidak menjadi jalan pintas membanjiri SBS. */
export async function jawabCari(
  kueri: string,
  offset: number,
  limit: number,
  event?: { waitUntil?: (p: Promise<unknown>) => void }
): Promise<JawabanCari> {
  await siapkanIndeks(event)

  let hasil = cariDiIndeks(kueri, offset, limit)

  if (
    offset === 0 &&
    hasil.jumlah === 0 &&
    /\d/.test(kueri) &&
    keadaan === 'lengkap' &&
    !galat &&
    Date.now() - refreshRinganPada >= JEDA_GAGAL_MS
  ) {
    refreshRinganPada = Date.now()

    const jalan = jalankan(segarkan, 'segarkan')

    await Promise.race([jalan, jeda(TUNGGU_REFRESH_MS)])

    if (event?.waitUntil) event.waitUntil(jalan)

    hasil = cariDiIndeks(kueri, offset, limit)
  }

  return {
    kandidat: hasil.kandidat,
    jumlah: hasil.jumlah,
    status: statusIndeks()
  }
}

/** Menyerap klip yang barusan diambil halaman klip.
 *
 *  Ini yang membuat halaman Running Man tidak sia-sia: 20 klip yang
 *  tampil di beranda dan 100 klip yang dimuat daftar ikut memperbarui
 *  bagian terbaru indeks, tanpa permintaan tambahan ke SBS.
 *
 *  Hanya menambah id yang belum dikenal. Tidak pernah menandai indeks
 *  lengkap, dan tidak menyimpan ke disk setiap kali — data ini akan ikut
 *  tersimpan pada refresh berikutnya. */
export function catatKlip(klip: readonly Klip[]): void {
  if (!sudahMuat || !klip.length) return

  tambahBanyak(klip, true)
}
