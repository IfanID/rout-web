/** Aturan pencocokan dan penilaian pencarian.
 *
 *  Satu berkas untuk dua sisi: server memakainya untuk arsip klip,
 *  browser memakainya untuk halaman, anggota cast, dan episode. Kalau
 *  aturannya ditulis dua kali, dua hasil bisa berbeda untuk kueri yang
 *  sama — dan perbedaannya tidak akan terlihat sebagai bug, cuma sebagai
 *  urutan yang terasa aneh.
 *
 *  Tidak ada impor Nuxt di sini, jadi berkas ini bisa diuji langsung
 *  dengan `node --test`.
 */

/** Satu bidang teks yang boleh dicocokkan.
 *
 *  `cari` sudah dinormalisasi dan dihitung SEKALI saat indeks dibangun.
 *  Menormalisasi ulang 8.800 judul di setiap ketikan hanya membuang
 *  waktu tanpa mengubah hasil. */
export interface BidangCari {
  /** Teks yang sudah lewat `normalisasi()`. */
  cari: string
  /** Bentuk tanpa spasi, hanya untuk bidang yang mengizinkan `utuh`. */
  cariUtuh?: string
  /** Bobot bidang. Judul 1, alias 0,8, keterangan 0,6. */
  bobot: number
  /** Ikut dicocokkan dalam bentuk tanpa spasi — untuk nama seperti
   *  `Ji-hyo` yang sering ditulis `jihyo`. */
  utuh?: boolean
}

/** Kueri yang sudah siap dipakai berulang kali.
 *
 *  `skorBidang` dipanggil ribuan kali untuk satu kueri. Kalau setiap
 *  panggilan memecah token dan menormalkan ulang, pekerjaan itu
 *  diulang ribuan kali juga. */
export interface KueriCari {
  asli: string
  q: string
  qUtuh: string
  token: string[]
}

const PEMISAH = /[^\p{L}\p{N}]+/gu
const DIAKRITIK = /\p{M}+/gu

/** Bentuk baku untuk pencocokan, bukan untuk ditampilkan.
 *
 *  Urutannya penting: NFC dulu supaya Hangul bulat, lalu huruf kecil,
 *  lalu NFD hanya untuk membuang tanda diakritik Latin, lalu NFC lagi.
 *  Kalau NFD dijalankan paling akhir, Hangul ikut terpecah menjadi jamo
 *  dan tidak lagi cocok dengan kueri yang ditulis sebagai suku kata.
 */
export function normalisasi(teks: string): string {
  return (teks || '')
    .normalize('NFC')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIAKRITIK, '')
    .normalize('NFC')
    .replace(PEMISAH, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Menyiapkan kueri sekali, lalu dipakai untuk semua kandidat. */
export function siapkanKueri(teks: string): KueriCari {
  const q = normalisasi(teks)
  const token = q ? [...new Set(q.split(' '))] : []

  return {
    asli: teks,
    q,
    qUtuh: token.join(''),
    token
  }
}

/** Membuat satu bidang dari teks asli. Dipakai pemanggil yang membangun
 *  indeks kecil (halaman, cast, episode) dan tidak menyimpan hasilnya
 *  lama. */
export function buatBidang(
  teks: string,
  bobot: number = 1,
  utuh: boolean = false
): BidangCari {
  const cari = normalisasi(teks)

  return {
    cari,
    cariUtuh: utuh ? cari.replace(/ /g, '') : undefined,
    bobot,
    utuh
  }
}

/** Nilai satu bidang untuk satu kueri.
 *
 *  Angkanya sengaja berjarak lebar supaya perbedaan jenis kecocokan
 *  tidak kalah oleh selisih bobot bidang. Urutannya: sama persis,
 *  awalan judul, awalan kata, lalu potongan di tengah. */
function nilaiPola(teks: string, kueri: string): number {
  if (!teks) return 0
  if (teks === kueri) return 1200
  if (teks.startsWith(kueri)) return 1000 - Math.min(80, teks.length - kueri.length)
  if (teks.includes(` ${kueri}`)) return 850
  if (teks.includes(kueri)) return 700
  return 0
}

function semuaTokenDi(kueri: KueriCari, teks: string): boolean {
  return kueri.token.every(satu => teks.includes(satu))
}

function semuaDiAwalKata(kueri: KueriCari, teks: string): boolean {
  const kata = teks.split(' ')

  return kueri.token.every(satu => kata.some(k => k.startsWith(satu)))
}

/** Skor satu kandidat, atau `null` kalau tidak cocok.
 *
 *  Semua token wajib muncul di salah satu bidang. Ini yang menjaga
 *  `running man` tidak memunculkan semua klip hanya karena kata `man`
 *  kebetulan ada. */
export function skorBidang(
  kueri: KueriCari,
  bidang: readonly BidangCari[]
): number | null {
  if (!kueri.token.length) return null

  const adaDiSemua = kueri.token.every(satu =>
    bidang.some(
      b => b.cari.includes(satu) || Boolean(b.cariUtuh?.includes(satu))
    )
  )

  if (!adaDiSemua) return null

  let terbaik = 0
  let tambahan = 0

  for (const b of bidang) {
    let nilai = 0

    if (b.cari) {
      nilai = nilaiPola(b.cari, kueri.q)

      /* Tidak ada kecocokan utuh, tapi semua token tersebar di bidang
       * ini. Masih relevan, hanya lebih lemah daripada frasa utuh. */
      if (!nilai && semuaTokenDi(kueri, b.cari)) {
        nilai = semuaDiAwalKata(kueri, b.cari) ? 620 : 520
      }

      /* Bentuk tanpa spasi. Batasnya dua karakter supaya satu huruf
       * tidak mencocokkan hampir semua judul. */
      if (b.utuh && kueri.qUtuh.length >= 2) {
        const utuh = b.cariUtuh ?? b.cari.replace(/ /g, '')

        if (utuh === kueri.qUtuh) nilai = Math.max(nilai, 1150)
        else if (utuh.startsWith(kueri.qUtuh)) nilai = Math.max(nilai, 960)
        else if (utuh.includes(kueri.qUtuh)) nilai = Math.max(nilai, 680)
      }
    }

    const berbobot = nilai * b.bobot

    if (berbobot > terbaik) {
      tambahan += terbaik * 0.15
      terbaik = berbobot
    } else {
      tambahan += berbobot * 0.15
    }
  }

  return Math.round(terbaik + Math.min(140, tambahan))
}

/** Kueri yang terlalu pendek untuk dicari.
 *
 *  Satu huruf Latin hampir selalu menghasilkan terlalu banyak hal yang
 *  tidak berhubungan. Satu angka tetap berguna (nomor episode), dan satu
 *  suku kata Hangul membawa informasi yang jauh lebih banyak daripada
 *  satu huruf Latin. */
export function terlaluPendek(kueri: string): boolean {
  const q = normalisasi(kueri)

  if (!q) return false
  if (q.length >= 2) return false
  if (/[0-9]/.test(q)) return false
  if (/[\u3131-\uD7A3]/.test(q)) return false

  return true
}

/** Satu potongan teks yang cocok atau tidak, untuk dirender sebagai
 *  `<mark>`. Dipotong dari teks ASLI, bukan dari bentuk normalisasi,
 *  supaya huruf besar dan tanda baca tetap seperti aslinya. */
export interface PotonganSorot {
  teks: string
  cocok: boolean
}

/** Urutan hasil yang sama untuk server dan browser.
 *
 *  Dipakai juga saat memotong halaman: kalau urutannya berbeda antara
 *  halaman pertama dan halaman berikutnya, satu hasil bisa muncul dua
 *  kali atau terlewat. Karena itu perbandingannya harus satu tempat.
 *
 *  Skor menurun, lalu tanggal terbaru, lalu id — tie-break yang tidak
 *  bergantung pada urutan larik sumber. */
export interface KandidatUrut {
  skor: number
  tanggal?: string
  id?: string
  judul?: string
}

export function bandingKandidat(a: KandidatUrut, b: KandidatUrut): number {
  if (b.skor !== a.skor) return b.skor - a.skor

  const tanggalA = a.tanggal || ''
  const tanggalB = b.tanggal || ''

  if (tanggalA !== tanggalB) return tanggalA < tanggalB ? 1 : -1

  const idA = a.id || a.judul || ''
  const idB = b.id || b.judul || ''

  if (idA === idB) return 0

  return idA < idB ? -1 : 1
}

function lolosRegex(teks: string): string {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Potongan sorotan untuk satu teks.
 *
 *  Token yang tidak ditemukan di teks asli — misalnya karena beda
 *  diakritik atau karena tanda hubung dibuang saat normalisasi — tidak
 *  dipaksakan. Teksnya tetap tampil utuh, hanya tanpa sorotan.
 */
export function sorotan(teks: string, kueri: string): PotonganSorot[] {
  const token = siapkanKueri(kueri).token

  if (!teks || !token.length) return [{ teks, cocok: false }]

  const rentang: { mulai: number; akhir: number }[] = []

  for (const satu of token) {
    let pola: RegExp

    try {
      pola = new RegExp(lolosRegex(satu), 'giu')
    } catch {
      continue
    }

    for (const cocok of teks.matchAll(pola)) {
      const mulai = cocok.index

      if (mulai === undefined) continue

      rentang.push({ mulai, akhir: mulai + cocok[0].length })
    }
  }

  if (!rentang.length) return [{ teks, cocok: false }]

  rentang.sort((a, b) => a.mulai - b.mulai || a.akhir - b.akhir)

  const gabung: { mulai: number; akhir: number }[] = []

  for (const satu of rentang) {
    const terakhir = gabung[gabung.length - 1]

    if (terakhir && satu.mulai <= terakhir.akhir) {
      terakhir.akhir = Math.max(terakhir.akhir, satu.akhir)
    } else {
      gabung.push({ ...satu })
    }
  }

  const potongan: PotonganSorot[] = []
  let posisi = 0

  for (const satu of gabung) {
    if (satu.mulai > posisi) {
      potongan.push({ teks: teks.slice(posisi, satu.mulai), cocok: false })
    }

    potongan.push({ teks: teks.slice(satu.mulai, satu.akhir), cocok: true })
    posisi = satu.akhir
  }

  if (posisi < teks.length) {
    potongan.push({ teks: teks.slice(posisi), cocok: false })
  }

  return potongan
}

/* ============================================================
   Keadaan tampilan
   ============================================================ */

export type KeadaanIndeks = 'kosong' | 'sebagian' | 'lengkap' | 'gagal'

export type FaseCari = 'awal' | 'pendek' | 'memuat' | 'hasil' | 'kosong' | 'galat'

export interface MasukanKeadaan {
  kueri: string
  jumlahHasil: number
  memuat: boolean
  galat: boolean
  indeks: KeadaanIndeks
  terindeks: number
  online: boolean
}

export interface KeadaanCari {
  fase: FaseCari
  /** Belum final: indeks klip belum lengkap, atau sumbernya gagal. */
  sementara: boolean
  indeks: KeadaanIndeks
  offline: boolean
  memperbarui: boolean
  /** Indeks sama sekali belum berisi apa pun. */
  indeksKosong: boolean
  /** Pencarian klip gagal, bukan sekadar belum lengkap. */
  indeksGagal: boolean
}

/** Satu tempat yang memutuskan keadaan mana yang menang.
 *
 *  Template tidak boleh menebak-nebak lewat beberapa `v-if` terpisah:
 *  begitu ada dua kondisi benar bersamaan, pesannya bisa saling
 *  bertentangan. Semua aturan prioritasnya ada di sini dan diuji
 *  sebagai tabel. */
export function tentukanKeadaan(m: MasukanKeadaan): KeadaanCari {
  const adaKueri = normalisasi(m.kueri) !== ''
  const pendek = adaKueri && terlaluPendek(m.kueri)

  const dasar = {
    indeks: m.indeks,
    offline: !m.online,
    indeksKosong: m.indeks === 'kosong',
    indeksGagal: m.indeks === 'gagal'
  }

  if (!adaKueri) {
    return {
      ...dasar,
      fase: 'awal',
      sementara: false,
      memperbarui: false
    }
  }

  if (pendek) {
    return {
      ...dasar,
      fase: 'pendek',
      sementara: false,
      memperbarui: false
    }
  }

  if (m.galat && m.jumlahHasil === 0) {
    return {
      ...dasar,
      fase: 'galat',
      sementara: true,
      memperbarui: false
    }
  }

  if (m.memuat && m.jumlahHasil === 0) {
    return {
      ...dasar,
      fase: 'memuat',
      sementara: m.indeks !== 'lengkap',
      memperbarui: false
    }
  }

  if (m.jumlahHasil > 0) {
    return {
      ...dasar,
      fase: 'hasil',
      sementara: m.indeks !== 'lengkap',
      memperbarui: m.memuat
    }
  }

  return {
    ...dasar,
    fase: 'kosong',
    /* Nol hasil belum final selama arsip klip belum selesai dicari. */
    sementara: m.indeks !== 'lengkap',
    memperbarui: false
  }
}
