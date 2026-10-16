/** Satu titik jadwal Running Man: nomor episode dan tanggal tayangnya,
 *  sebagaimana menyeberang dari `server/api/running-man/jadwal.get.ts`
 *  ke app.
 *
 *  Dipakai untuk dua titik yang berbeda — episode terakhir yang sudah
 *  tayang, dan episode berikutnya yang belum — karena bentuknya memang
 *  sama: satu nomor dan satu tanggal. Yang membedakan cuma dari mana
 *  angkanya datang.
 *
 *  Di `shared/types/` karena dibaca dua sisi: handler yang mengirimnya
 *  dan `app/composables/useRunningManJadwal.ts` yang membacanya. `app/`
 *  tidak boleh mengimpor dari `server/`, jadi ini satu-satunya tempat
 *  yang bisa dibaca keduanya.
 *
 *  Tanggalnya ISO (`2026-10-18`), BUKAN teks jadi seperti "Minggu, 18
 *  Oktober 2026". Nama hari dan nama bulan bergantung bahasa yang sedang
 *  dibaca, dan itu dibentuk di komponen — aturan yang sama dipakai
 *  tanggal klip di `PreviewList.vue`. Kalau server yang mengirim teks
 *  jadinya, pembaca `/en` dan `/ko` ikut kebagian teks Indonesia. */
export interface Jadwal {
  /** Nomor episode. */
  nomor: number

  /** Tanggal tayangnya menurut SBS, `YYYY-MM-DD`. */
  tanggal: string
}
