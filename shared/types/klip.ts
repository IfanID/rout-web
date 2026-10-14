/** Bentuk satu klip tayang, sebagaimana menyeberang dari `server/api` ke app.
 *
 *  Di `shared/types/` karena dipakai dua sisi: handler di
 *  `server/api/running-man/clips.get.ts` yang mengirimnya, dan komponen
 *  `PreviewList.vue` yang menampilkannya. Bukan di `server/` karena `app/`
 *  tidak boleh mengimpor dari sana, dan bukan juga di `app/` karena server
 *  yang memiliki datanya.
 *
 *  Berisi katak yang sudah jadi: tanggal dalam bentuk ISO, durasi dalam
 *  detik. Format yang dilihat orang — tanggal menurut bahasa yang sedang
 *  dipakai, durasi `01:19` — dikerjakan di komponen, bukan di sini. Kalau
 *  salah satunya ikut diformat di server, satu bahasa akan terbaca di
 *  semua bahasa. */

export interface Klip {
  /** Id klip dari SBS, dipakai sebagai bagian URL halaman klip. */
  id: string
  /** Judul klip, apa adanya dari SBS. */
  judul: string
  /** Sudah ditulis lengkap, misalnya "Episode 822". */
  episode: string
  /** Tanggal tayang, `YYYY-MM-DD`. Kosong kalau SBS tidak mengirimnya. */
  tanggal: string
  /** Durasi dalam detik, bukan `MM:SS`. */
  detik: number
  /** Thumbnail 16:9. Sudah dipaksa jadi `https`. */
  gambar: string
}