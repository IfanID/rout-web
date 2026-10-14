/** Sumber klip SBS: satu tempat untuk alamatnya, bentuk mentahnya, cara
 *  memetakannya, dan cara mencari posisi sebuah klip di arsipnya.
 *
 *  Dipakai tiga handler — yang berurutan, yang acak, dan yang mencari
 *  tetangga — jadi pemetaannya harus ada di satu tempat. Kalau disalin,
 *  begitu SBS menambah atau mengganti satu kolom, hanya salah satunya yang
 *  ikut diperbaiki dan halaman yang lain diam-diam kehilangan kolom itu.
 *
 *  Berkas di `server/utils/` dipindai Nitro sampai ke subfolder, jadi
 *  isinya bisa dipakai tanpa baris `import`. Ini kebalikan dari
 *  `app/composables/`, yang hanya memindai level teratas. */

import type { Klip } from '#shared/types/klip'

/** Alamat daftar klip program ini.
 *
 *  `S01_V0000330171` adalah programId lengkap Running Man, bukan
 *  `runningman` — lihat catatan di handler berurutannya kalau perlu
 *  memastikan ulang. */
export const SUMBER_KLIP =
  'https://static.apis.sbs.co.kr/play-api/1.0/clip/sbs_vodall/S01_V0000330171'

/** Urutan yang dikenal SBS di parameter `sort`. */
export const SORT_TERBARU = 'new'
export const SORT_TERLAMA = 'old'
export const SORT_TERPOPULER = 'top'

/* Bentuk yang dipakai SBS di responsnya. Yang tidak dipetik di sini boleh
   tetap ada — field yang tidak dipetakan justru tidak ikut dikirim ke
   halaman. */
export interface KlipMentah {
  mediaid?: string
  title?: string
  broaddate?: string
  playtime?: number
  content?: { contentnumber?: number }
  thumb?: { medium?: string }
}

/** Tanggal dari `2026-10-11T18:00:00.000Z` jadi `2026-10-11`.
 *
 *  Jamnya dibuang, bukan diterjemahkan: yang ditampilkan hanya tanggalnya,
 *  dan zona waktu di string itu milik SBS — kalau ikut dihitung, tanggalnya
 *  bisa bergeser satu hari menurut zona tempat peramban berada.
 *
 *  Kalau bentuknya di luar dugaan, dikembalikan string kosong. `new Date()`
 *  menerima banyak bentuk sekaligus dan hasilnya berbeda-beda per peramban,
 *  sedangkan string kosong punya arti yang jelas: bagian tanggalnya memang
 *  tidak ada. */
function keTanggal(iso: string): string {
  const tanggal = (iso || '').slice(0, 10)

  return /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : ''
}

/** Nomor episode, atau string kosong.
 *
 *  Klip lama memakai `contentnumber: 0` — klip dari 2010 belum punya nomor
 *  episode. Ditulis apa adanya, hasilnya "Episode 0", yang terlihat seperti
 *  episode yang memang bernomor nol. Kosong lebih benar: barisnya tetap
 *  terbaca, hanya tidak mengarang episode. */
function keEpisode(nomor?: number): string {
  return nomor ? `Episode ${nomor}` : ''
}

export function petakanKlip(satu: KlipMentah): Klip | null {
  /* Tanpa id tidak ada halaman yang bisa dibuka untuk klip ini, jadi
     dilewati saja daripada mengirim baris yang tidak bisa diketuk. */
  if (!satu.mediaid) return null

  return {
    id: satu.mediaid,
    judul: satu.title || '',
    episode: keEpisode(satu.content?.contentnumber),
    tanggal: keTanggal(satu.broaddate || ''),
    detik: satu.playtime || 0,
    /* `http` dinaikkan jadi `https`. Alamat dari SBS masih http, dan di
     * halaman kita browser akan menolaknya sebagai mixed content — fotonya
     * tidak muncul, tanpa pesan error yang berguna. */
    gambar: (satu.thumb?.medium || '').replace(/^http:\/\//, 'https://')
  }
}

/** Mengambil satu halaman klip dari SBS, sudah dipetakan.
 *
 *  Bentuk responsnya larik polos, sedangkan endpoint SBS yang lain
 *  membungkusnya di `{ list: … }` — jadi keduanya diterima di sini. API-nya
 *  tidak resmi, dan bentuk jawabannya bisa berubah tanpa pemberitahuan. */
export async function ambilKlip(
  offset: number,
  limit: number,
  sort: string
): Promise<Klip[]> {
  const alamat =
    `${SUMBER_KLIP}?offset=${offset}&limit=${limit}` +
    `&sort=${sort}&search=&cliptype=&date_type=broaddate`

  const data = await $fetch<KlipMentah[] | { list?: KlipMentah[] }>(alamat)

  const list = Array.isArray(data) ? data : data.list || []

  return list.map(petakanKlip).filter((satu): satu is Klip => satu !== null)
}

/** Tebakan awal saat mencari batas arsip, lalu dibelah dua sampai ada
 *  isinya. Dipilih tinggi dengan sengaja: kalau arsipnya bertambah, yang
 *  menyesuaikan tebakan ini, bukan kodenya. */
const TEBAKAN_BATAS = 10240

/** Batas arsip yang sudah ditemukan, diingat selama proses server hidup. */
let batasTersimpan = 0

/** Offset klip terakhir di arsip — dipakai untuk mengundi offset acak dan
 *  untuk mempersempit pencarian posisi.
 *
 *  Dua tahap, dan tahap kedua bukan pemanis: berhenti di tebakan pertama
 *  yang berisi menghasilkan batas yang bisa **separuh** dari yang
 *  sebenarnya — offset 10240 kosong lalu 5120 berisi, padahal arsipnya
 *  sampai sekitar 8872. Akibatnya undiannya cuma menjangkau paruh terbaru,
 *  dan di uji tahun yang muncul berhenti di 2019.
 *
 *  Kalau pencariannya gagal, yang dikembalikan nol dan **bukan** diingat
 *  sebagai nol — nol berarti "arsipnya tidak terbaca", dan itu keadaan yang
 *  layak dicoba lagi di permintaan berikutnya. */
export async function batasArsip(): Promise<number> {
  if (batasTersimpan) return batasTersimpan

  const adaIsi = async (offset: number) => {
    try {
      return (await ambilKlip(offset, 1, SORT_TERBARU)).length > 0
    } catch {
      /* Gangguan sesaat saat mencari batas diperlakukan sebagai "belum
       * ketemu", bukan sebagai kegagalan seluruh permintaan. */
      return false
    }
  }

  let atas = TEBAKAN_BATAS + 1
  let bawah = 0

  let uji = TEBAKAN_BATAS

  while (uji > 0) {
    if (await adaIsi(uji)) {
      bawah = uji
      break
    }

    atas = uji
    uji = Math.floor(uji / 2)
  }

  if (!bawah) return 0

  while (atas - bawah > 1) {
    const tengah = Math.floor((bawah + atas) / 2)

    if (await adaIsi(tengah)) bawah = tengah
    else atas = tengah
  }

  batasTersimpan = bawah

  return bawah
}

/** Titik-titik yang sudah diperiksa saat mencari posisi.
 *
 *  Arsipnya urut menurun menurut tanggal, jadi setiap titik yang diketahui
 *  mempersempit pencarian berikutnya: dua klip dari episode yang sama
 *  tanggalnya sama, dan pencariannya jadi jauh lebih pendek daripada yang
 *  pertama. Jumlahnya dibatasi supaya tidak tumbuh selamanya. */
const titik: { offset: number; tanggal: string }[] = []

const BATAS_TITIK = 400

function catatTitik(offset: number, tanggal: string) {
  if (!tanggal) return

  titik.push({ offset, tanggal })

  if (titik.length > BATAS_TITIK) titik.shift()
}

async function tanggalDi(offset: number): Promise<string> {
  try {
    return (await ambilKlip(offset, 1, SORT_TERBARU))[0]?.tanggal || ''
  } catch {
    return ''
  }
}

/** Mencari offset yang tanggalnya sama dengan `tanggal`.
 *
 *  Pencarian biner, dan urutan arsipnya yang membuatnya mungkin: SBS
 *  menyusunnya dari yang terbaru ke yang terlama, jadi tanggal di offset
 *  semakin lama semakin tua — tidak pernah bolak-balik. Diuji: offset 0
 *  menjawab 2026-10, offset 8000 menjawab 2013-12.
 *
 *  Yang dikembalikan adalah offset yang **cocok**, bukan offset klipnya
 *  sendiri: pada satu tanggal ada puluhan klip (satu episode menghasilkan
 *  banyak klip), jadi pemanggilnya yang kemudian mencari klipnya di sekitar
 *  offset ini.
 *
 *  Kalau tanggalnya tidak ketemu persis, yang dikembalikan posisi terdekat
 *  — lebih baik daripada menyerah, karena pemanggilnya tetap mencari di
 *  sekitar situ. */
export async function cariPosisiTanggal(tanggal: string): Promise<number> {
  const batas = await batasArsip()

  if (!batas) return 0

  let kiri = 0
  let kanan = batas

  /* Memakai titik yang sudah diketahui lebih dulu, supaya pencariannya
   * tidak mengulang pemeriksaan yang sama. */
  for (const satu of titik) {
    if (satu.tanggal > tanggal) {
      /* Tanggalnya lebih baru dari yang dicari, jadi yang dicari ada di
       * offset yang lebih besar. */
      kiri = Math.max(kiri, satu.offset + 1)
    } else if (satu.tanggal < tanggal) {
      kanan = Math.min(kanan, satu.offset - 1)
    }
  }

  while (kiri <= kanan) {
    const tengah = Math.floor((kiri + kanan) / 2)

    const diTengah = await tanggalDi(tengah)

    if (!diTengah) {
      kanan = tengah - 1
      continue
    }

    catatTitik(tengah, diTengah)

    if (diTengah === tanggal) return tengah

    if (diTengah > tanggal) kiri = tengah + 1
    else kanan = tengah - 1
  }

  /* Tidak ketemu persis: batas kirinya, yaitu titik terdekat dari sisi yang
   * lebih tua. */
  return Math.max(0, Math.min(kiri, batas))
}
