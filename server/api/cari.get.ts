/** GET /api/cari?q=... — pencarian arsip klip Running Man.
 *
 *  Hanya klip yang dilayani di sini. Halaman, anggota cast, dan episode
 *  dicari di browser: teksnya harus mengikuti bahasa pemakai, dan
 *  jumlahnya kecil. Klip tidak bisa diperlakukan begitu — arsipnya
 *  sekitar 8.800 baris, dan judulnya berbahasa Korea apa adanya.
 *
 *  Endpoint ini TIDAK menyentuh SBS pada setiap permintaan. Indeksnya
 *  dibangun bertahap di `server/utils/running-man/indeks-klip.ts`, dan
 *  pencarian hanya membaca memori. Satu-satunya pengecualian adalah
 *  kueri angka yang tidak menemukan apa pun: arsip dicek ulang sekali
 *  untuk menangkap klip yang baru diunggah.
 *
 *  Kegagalan sumber tidak dilempar sebagai error. Hasil dari sumber lain
 *  tetap harus tampil, dan status indeks memberi tahu apa yang sedang
 *  terjadi. */

import type { JawabanCari } from '#shared/types/cari'

/** Batas panjang kueri. URL bisa dibagikan, dan teks 10.000 karakter
 *  tidak akan pernah menjadi kata kunci yang berguna. */
const PANJANG_MAKS = 120

/** Jumlah hasil kalau pemanggil tidak menentukan. Halaman hasil
 *  campuran memakai angka ini. */
const LIMIT_AWAL = 20

/** Batas atas satu permintaan. Halaman kelompok klip meminta 50; angka
 *  ini hanya jaring pengaman supaya URL yang diketik manual tidak
 *  meminta seluruh arsip sekaligus. */
const LIMIT_MAKS = 100

/** Batas offset. 8.872 adalah ukuran arsip sekarang; batas ini hanya
 *  mencegah angka tak terbatas dari URL. */
const OFFSET_MAKS = 20_000

export default defineEventHandler(async (event): Promise<JawabanCari> => {
  const kueri = getQuery(event)

  /* Query bisa berupa larik kalau orang menulis `?q=a&q=b`. Yang dipakai
   * elemen pertama, sama seperti pembacaan `?urutan=` di handler klip. */
  const mentah = kueri.q
  const teks = Array.isArray(mentah) ? mentah[0] : mentah
  const q = String(teks ?? '').trim().slice(0, PANJANG_MAKS)

  const offsetDiminta = Number(kueri.offset)
  const offset =
    Number.isInteger(offsetDiminta) && offsetDiminta > 0
      ? Math.min(offsetDiminta, OFFSET_MAKS)
      : 0

  const limitDiminta = Number(kueri.limit)
  const limit =
    Number.isInteger(limitDiminta) && limitDiminta > 0
      ? Math.min(limitDiminta, LIMIT_MAKS)
      : LIMIT_AWAL

  if (!q) {
    /* Kueri kosong tidak boleh memicu build. Membuka halaman lalu
     * menghapus kata kunci bukan alasan untuk menarik 19 MB dari SBS. */
    return {
      kandidat: [],
      jumlah: 0,
      status: statusIndeks()
    }
  }

  return jawabCari(q, offset, limit, event)
})
