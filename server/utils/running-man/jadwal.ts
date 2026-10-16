/** Sumber jadwal tayang Running Man: episode terakhir yang sudah tayang,
 *  dan hitungan tanggal untuk episode berikutnya.
 *
 *  Dipakai satu handler, `server/api/running-man/jadwal.get.ts`, tapi
 *  logikanya tinggal di sini karena aturan tanggalnya perlu bisa diuji
 *  terpisah dari endpoint-nya — lihat `berikutnyaDari` yang menerima
 *  tanggal "hari ini" sebagai argumen, bukan membacanya sendiri.
 *
 *  Berkas di `server/utils/` dipindai Nitro sampai ke subfolder, jadi
 *  isinya bisa dipakai tanpa baris `import`. */

import type { Jadwal } from '#shared/types/jadwal'

/** Alamat episode penuh di menu 다시보기.
 *
 *  `55286` adalah id menu 다시보기 Running Man, dan `vod` di tengah
 *  alamat itu yang membedakannya dari `clip` — lihat catatan di bawah.
 *  Didapat dari `program-api/1.0/menu/runningman`, yang juga memberi
 *  daftar menu program ini beserta id-nya.
 *
 *  Yang penting di alamat ini cuma tiga bagian: `runningman` nama
 *  programnya, `55286` id menu 다시보기, dan
 *  `program-api/3.0/main/contents` endpoint daftar isi menu. Yang
 *  terakhir itu yang dipakai halaman utama SBS sendiri untuk mengisi
 *  bagian 다시보기, jadi bentuk jawabannya ikut halaman itu. */
const SUMBER =
  'https://static.apis.sbs.co.kr/program-api/3.0/main/contents/runningman/vod/55286'

/** Satu item cukup: yang dibutuhkan hanya episode terakhir.
 *
 *  Isinya 2 KB untuk satu item — separuhnya teks sinopsis, yang tidak
 *  ikut dibaca. Mengambil daftar penuh hanya menambah berat tanpa
 *  menambah jawaban. */
const JUMLAH = 1

/** Bentuk yang dipakai SBS. Yang tidak dipetik di sini boleh tetap ada. */
interface EpisodeMentah {
  content?: { contentnumber?: number }
  /** Tanggal tayang, tetapi dengan titik: `2026.10.11`. */
  broaddate?: string
}

/** Episode terakhir yang diketahui tayang, dipakai kalau SBS tidak bisa
 *  dihubungi.
 *
 *  Ini juga jadi lantai: kalau jawaban SBS lebih tua dari ini, yang
 *  dipakai pasangan nomor dan tanggal dari sini — pelindung dari daftar
 *  yang terpotong atau jawaban lama yang masih tersimpan di perantara.
 *
 *  Tanggalnya bukan tebakan: 11 Oktober 2026 adalah tanggal tayang
 *  episode 822 di 다시보기 SBS. Begitu episode berikutnya muncul,
 *  nilainya tidak perlu disentuh — angka dari SBS yang menang, dan
 *  yang di sini cuma dipakai saat SBS tidak menjawab. */
export const TERAKHIR_DIKETAHUI: Jadwal = { nomor: 822, tanggal: '2026-10-11' }

/** Berapa kali penggeseran seminggu boleh diulang sebelum menyerah.
 *
 *  Sepuluh tahun. Batas ini ada bukan karena aturannya butuh, tapi supaya
 *  `while` di `berikutnyaDari` tidak pernah bisa berputar tanpa henti
 *  kalau tanggalnya suatu saat berbentuk aneh. */
const PUTARAN_MAKS = 520

/** `2026.10.11` jadi `2026-10-11`, atau string kosong kalau tidak dikenali.
 *
 *  Titiknya diganti, bukan ditolak: SBS memakai titik di endpoint ini dan
 *  tanda hubung di endpoint klip, dan dua bentuk penulisan tanggal dari
 *  satu pihak yang sama sebaiknya tidak memaksa dua pemetaan.
 *
 *  Kalau bentuknya di luar dugaan, yang dikembalikan string kosong —
 *  bukan tanggal yang dikira-kira. `new Date()` menerima banyak bentuk
 *  sekaligus dan hasilnya berbeda-beda per mesin, sedangkan string kosong
 *  punya arti yang jelas: tanggalnya tidak terbaca. */
function keTanggal(nilai: string): string {
  const bersih = (nilai || '').replace(/\./g, '-').slice(0, 10)

  return /^\d{4}-\d{2}-\d{2}$/.test(bersih) ? bersih : ''
}

/** Tanggal ditambah sekian hari, hasilnya `YYYY-MM-DD`.
 *
 *  Dihitung lewat `Date.UTC`, bukan tanggal lokal. Selisih zona dan
 *  perubahan waktu musim panas tidak boleh ikut campur: yang dihitung
 *  cuma jarak hari antara dua tanggal kalender, dan itu tidak punya jam. */
function tambahHari(tanggal: string, hari: number): string {
  /* Ketiganya bertipe `number | undefined`, karena destructuring tidak
   * menjamin panjang array. Karena itu pemeriksaan bentuknya ditulis
   * eksplisit di bawah, bukan diserahkan ke `Date.UTC` yang akan menerima
   * `undefined` dan menghasilkan `NaN` tanpa jejaknya. */
  const [tahun, bulan, tanggalnya] = tanggal.split('-').map(Number)

  /* Yang mempersempit tipe di sini `typeof`, bukan `Number.isInteger`.
   *
   * `Number.isInteger` mengembalikan `boolean`, bukan `value is number`, jadi
   * TypeScript tidak bisa tahu setelah pemeriksaannya bahwa variabelnya
   * sudah pasti bukan `undefined`. `typeof` bisa, karena hanya dia yang
   * menyempitkan tipe di Bahasa TypeScript.
   *
   * Bentuk yang tidak terbaca DILEMPAR, bukan dikembalikan apa adanya.
   *
   * Melempar di sini terdengar berlebihan, tapi justru itu yang benar:
   * pemanggilnya — `jadwal.get.ts` dan `jadwal-push.ts` — sudah punya
   * `catch` yang jatuh ke `TERAKHIR_DIKETAHUI`. Kalau tanggal rusak
   * dikembalikan apa adanya, string itu justru terkirim ke peramban, dan
   * `Intl.DateTimeFormat.format()` di sana melempar saat render sehingga
   * seluruh halaman ikut rusak — di titik yang jauh lebih sulit
   * ditelusuri daripada satu error di server. */
  if (
    typeof tahun !== 'number' ||
    typeof bulan !== 'number' ||
    typeof tanggalnya !== 'number'
  ) {
    throw new Error(`tanggal tidak terbaca: ${tanggal}`)
  }

  /* Pengaman kedua, untuk bentuk yang sudah number tapi bukan bilangan
   * bulat. Jalur ini nyaris tidak akan terjadi karena bentuknya sudah lolos
   * `keTanggal` — tapi `Date.UTC` menerima pecahan dan Ergebnis akhirnya
   * bukan tanggal kalender, jadi dicegah di sini juga. */
  if (!Number.isInteger(tahun) || !Number.isInteger(bulan) || !Number.isInteger(tanggalnya)) {
    throw new Error(`tanggal tidak terbaca: ${tanggal}`)
  }

  const waktu = Date.UTC(tahun, bulan - 1, tanggalnya) + hari * 86400000

  return new Date(waktu).toISOString().slice(0, 10)
}

/** Tanggal hari ini menurut zona Korea (KST), bukan zona server.
 *
 *  Tanggal di 다시보기 adalah tanggal siaran Korea, dan yang dibandingkan
 *  dengannya harus tanggal dengan acuan yang sama. KST dua jam di depan
 *  WIB: pukul 22.00–24.00 WIB sudah lewat tengah malam di Korea, jadi
 *  tanggal Korea sudah berganti sehari sementara tanggal Indonesia belum.
 *  Membandingkan tanggal SBS dengan tanggal server — yang bisa UTC —
 *  membuat kartunya bergeser sehari tanpa alasan yang kelihatan.
 *  Sembilan jam ditambahkan, lalu tanggalnya diambil. */
export function hariIniKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

/** Episode terakhir yang sudah tayang, dari menu 다시보기 SBS.
 *
 *  **Menu `vod`, bukan `clip`, dan itu bukan pilihan gaya.** Yang dicari
 *  di sini adalah "episodenya sudah bisa ditonton ulang atau belum", dan
 *  itu dijawab oleh episode penuhnya. Daftar klip menjawab pertanyaan yang
 *  berbeda: klip 예고보기 (teaser) terbit SEBELUM episodenya tayang, dan
 *  teaser untuk episode 18 Oktober kemarin masih bertanda episode 822 —
 *  jadi daftar klip yang dipakai di sini akan bilang episodenya sudah
 *  tayang padahal belum.
 *
 *  Bukti bahwa yang dibaca memang episode penuh: `playtime` di daftar ini
 *  6.085 detik (sekitar 101 menit), sedangkan di daftar klip 58 detik.
 *
 *  Melempar kalau jawabannya tidak bisa dibaca — pemanggilnya yang
 *  memutuskan apa yang dipakai sebagai gantinya. Handler di atas memakai
 *  `TERAKHIR_DIKETAHUI`, supaya halamannya tidak ikut gagal hanya karena
 *  SBS sedang tidak bisa dihubungi. */
export async function ambilTerakhir(): Promise<Jadwal> {
  const data = await $fetch<{ list?: EpisodeMentah[] }>(
    `${SUMBER}?platform=pc&limit=${JUMLAH}`
  )

  const satu = data?.list?.[0]

  const nomor = Number(satu?.content?.contentnumber)
  const tanggal = keTanggal(satu?.broaddate || '')

  /* Dua-duanya wajib. Nomor tanpa tanggal tidak bisa dihitung tanggal
   * berikutnya, dan tanggal tanpa nomor tidak bisa dipakai menaikkan
   * tracking — dua-duanya setengah jawaban, dan setengah jawaban di sini
   * lebih buruk daripada jawaban cadangan yang utuh. */
  if (!Number.isInteger(nomor) || nomor <= 0 || !tanggal) {
    throw new Error('bentuk jawaban SBS tidak dikenal')
  }

  return { nomor, tanggal }
}

/** Episode berikutnya, beserta tanggal tayangnya.
 *
 *  Nomornya satu di atas episode terakhir, dan tanggalnya dihitung dari
 *  tanggal tayang episode terakhir:
 *
 *    tanggal = terkecil dari (tanggal terakhir + 7 hari × k), k ≥ 1,
 *              yang tidak lebih tua dari hari ini
 *
 *  Maksudnya: Running Man tayang mingguan, jadi episode berikutnya
 *  seharusnya tayang seminggu setelah yang terakhir. Kalau tanggal itu
 *  sudah lewat dan episodenya tetap tidak muncul di 다시보기, berarti
 *  minggu itu memang tidak ada tayangan — dan tanggalnya digeser seminggu
 *  lagi, berulang, sampai jatuh di hari ini atau di depan.
 *
 *  Yang bikin aturan ini perlu ada bukan teori: di data SBS sendiri, gap
 *  episode 820 (13 September 2026) ke 821 (4 Oktober 2026) itu 21 hari.
 *  Tanpa penggeseran, kartunya akan menulis tanggal yang sudah lewat dua
 *  minggu dan terus begitu.
 *
 *  Tanda `>=` dipakai, bukan `>`: di hari tayang, episode yang belum
 *  muncul di 다시보기 tetap berarti "tayang hari ini", bukan "minggu
 *  depan". Yang di depan baru dipakai begitu harinya benar-benar lewat.
 *
 *  Soal hari Minggu: semua tanggal di 다시보기 jatuh hari Minggu — dicek
 *  pada dua puluh item terakhir — jadi penambahan 7 hari selalu mendarat
 *  di hari Minggu juga. `berikutnyaDari` tidak menghitung sendiri hari
 *  apa tanggalnya; ia mempercayai tanggal itu apa adanya.
 *
 *  `hariIni` masuk sebagai argumen, bukan dibaca di dalam fungsi, supaya
 *  aturannya bisa diuji dengan tanggal apa pun. */
export function berikutnyaDari(terakhir: Jadwal, hariIni: string): Jadwal {
  /* Nomor dan tanggalnya diambil dari SATU sumber, tidak dicampur.
   *
   * Kalau jawaban SBS lebih tua dari yang sudah kita ketahui — daftar
   * yang terpotong, jawaban lama yang masih tersimpan di perantara —
   * yang dipakai pasangan dari `TERAKHIR_DIKETAHUI`, bukan nomor dari
   * sana dan tanggal dari sini. Campuran seperti itu menghasilkan
   * "Episode 823" dengan tanggal yang sudah lewat sebulan, dan itu lebih
   * buruk daripada jawaban cadangan yang utuh. */
  const pakaiCadangan = terakhir.nomor < TERAKHIR_DIKETAHUI.nomor

  const dasar = pakaiCadangan ? TERAKHIR_DIKETAHUI : terakhir

  const nomor = dasar.nomor + 1

  let tanggal = tambahHari(dasar.tanggal, 7)

  let putaran = 0

  while (tanggal < hariIni && putaran < PUTARAN_MAKS) {
    tanggal = tambahHari(tanggal, 7)
    putaran++
  }

  return { nomor, tanggal }
}
