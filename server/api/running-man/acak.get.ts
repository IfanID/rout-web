/** GET /api/running-man/acak — klip acak dari seluruh arsip.
 *
 *  Dipakai bagian "Klip lain" di halaman satu klip: sepuluh baris, satu di
 *  antaranya klip terbaru, sisanya acak. Menggulir meminta sepuluh lagi.
 *
 *  Sumber: https://m.programs.sbs.co.kr/enter/runningman/main#clip-64958
 *
 *  TIDAK dicache, dan ini satu-satunya endpoint di proyek ini yang begitu.
 *  Cache Nitro memakai URL sebagai kunci, jadi balasan yang tersimpan akan
 *  mengembalikan sepuluh klip yang **sama** selama TTL-nya — acak yang diam,
 *  dan acak yang diam bukan acak. Ongkosnya nyata: tiap gulir menyentuh SBS
 *  sekali (sekitar 43 KB untuk sepuluh klip), dan itu tidak bisa dihilangkan
 *  selama yang diminta memang undian baru.
 *
 *  Parameter:
 *  - `n`       berapa klip yang diminta, dibatasi `JUMLAH_MAKS`.
 *  - `pertama` kalau bernilai `1`, baris pertama diisi klip terbaru.
 *  - `kecuali` daftar id yang tidak boleh ikut, dipisah koma — halaman
 *              mengirim klip yang sedang ditonton beserta dua tetangganya
 *              yang sudah tampil di slot 2 dan 3, supaya bagian acaknya
 *              tidak mengulang salah satunya. */

import type { Klip } from '#shared/types/klip'

/** Berapa klip paling banyak satu permintaan. Batas ini ada supaya query
 *  yang dikarang orang tidak menarik satu halaman besar dari SBS. */
const JUMLAH_MAKS = 50

const JUMLAH_AWAL = 10

/* Batas arsip tidak lagi dicari di sini: `batasArsip()` di
 * `server/utils/running-man/klip.ts` yang mencarinya, karena endpoint
 * "sekitar" juga membutuhkannya. Dua salinan pencarian yang sama akan
 * menghasilkan dua kali ongkos untuk jawaban yang sama. */
function bilangan(nilai: unknown, bawaan: number, maks: number) {
  const angka = Number(nilai)

  if (!Number.isInteger(angka) || angka < 1) return bawaan

  return Math.min(angka, maks)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const n = bilangan(query.n, JUMLAH_AWAL, JUMLAH_MAKS)
  const pertama = String(query.pertama || '') === '1'
  /* Daftar, bukan satu id: yang perlu disingkirkan bukan cuma klip yang
   * sedang ditonton, tapi juga tetangganya yang sudah tampil di slot 2 dan
   * 3 — kalau tidak, klip yang sama muncul dua kali di satu layar. */
  const kecuali = String(query.kecuali || '')
    .split(',')
    .map(satu => satu.trim())
    .filter(Boolean)

  const hasil: Klip[] = []

  /* Slot pertama: klip terbaru, apa pun urutan yang sedang dibaca orang di
   * halaman daftar. Selalu dikirim, termasuk saat justru klip itu yang
   * sedang ditonton — yang membuangnya halaman, bukan server, karena hanya
   * halaman yang tahu apa yang sedang tampil di atasnya. Kalau dibuang di
   * sini, slotnya hilang tanpa jejak dan daftarnya jadi lebih pendek. */
  if (pertama) {
    try {
      const terbaru = await ambilKlip(0, 1, SORT_TERBARU)
      if (terbaru[0]) hasil.push(terbaru[0])
    } catch {
      /* Gagal mengambil klip terbaru tidak boleh membatalkan undiannya —
       * sisanya tetap diisi klip acak. */
    }
  }

  /* Dicari sekali, lalu diingat proses server sampai mati. */
  const batas = await batasArsip()

  /* Tiap klip diundi SENDIRI-SENDIRI, bukan satu undian untuk sepuluh klip.
   *
   * Mengundi offset lalu mengambil sepuluh klip sekaligus terlihat hemat —
   * satu permintaan untuk satu halaman — tapi hasilnya sepuluh klip
   * berurutan dari satu episode: di uji, seluruh barisnya jatuh di bulan
   * yang sama. Yang acak cuma zamannya, bukan klipnya. Satu undian per
   * klip memberi sepuluh klip yang benar-benar tak berhubungan.
   *
   * Ongkosnya sepuluh permintaan kecil (±2 KB masing-masing, dijalankan
   * bersamaan), bukan satu permintaan besar. Itu harga dari acak yang
   * benar, dan tidak bisa dihilangkan dengan API ini. */
  let ronde = 0

  while (hasil.length < n && ronde < 3 && batas) {
    ronde++

    /* Satu undian lebih banyak daripada yang kurang: undian bisa jatuh pada
     * klip yang sudah terpilih atau pada klip yang sedang ditonton, dan
     * kelebihan itu yang menutupinya. */
    const kurang = n - hasil.length
    const undian = Array.from({ length: kurang + 1 }, () =>
      Math.floor(Math.random() * batas)
    )

    const dapat = await Promise.all(
      undian.map(offset =>
        ambilKlip(offset, 1, SORT_TERBARU)
          .then(satu => satu[0] ?? null)
          .catch(() => null)
      )
    )

    for (const satu of dapat) {
      if (hasil.length >= n) break
      if (!satu) continue
      if (kecuali.includes(satu.id)) continue
      if (hasil.some(sudah => sudah.id === satu.id)) continue

      hasil.push(satu)
    }
  }

  return hasil
})