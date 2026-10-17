/** Bentuk hasil pencarian yang menyeberang dari server ke app, dan yang
 *  dipakai bersama oleh sumber statis di browser.
 *
 *  `HasilCari` sengaja menyimpan NAMA RUTE, bukan URL jadi. URL bergantung
 *  pada locale, dan itu hanya diketahui `localePath` di sisi app. Kalau
 *  server mengirim path, tautannya akan selalu jatuh ke satu bahasa.
 */

export type JenisCari = 'halaman' | 'anggota' | 'episode' | 'klip'

/** Satu kandidat klip dari indeks server.
 *
 *  Lebih ringkas daripada `Klip`: yang dibutuhkan halaman hasil hanya
 *  teks dan gambar, bukan seluruh bentuk yang dipakai pemutar.
 */
export interface KandidatKlip {
  id: string
  judul: string
  episode: number | null
  tanggal: string
  detik: number
  gambar: string
  skor: number
}

export type KeadaanIndeks = 'kosong' | 'sebagian' | 'lengkap' | 'gagal'

export interface StatusIndeksKlip {
  keadaan: KeadaanIndeks
  /** Berapa klip yang sudah masuk indeks. */
  terindeks: number
  /** Kapan indeks terakhir diperbarui, ISO. `null` kalau belum pernah. */
  diperbarui: string | null
  /** Build atau refresh sedang berjalan. */
  sedang: boolean
  /** Sumber terakhir gagal. Data lama (kalau ada) tetap dipakai. */
  galat: boolean
}

export interface JawabanCari {
  kandidat: KandidatKlip[]
  /** Total klip yang cocok, bukan hanya yang dikirim. */
  jumlah: number
  status: StatusIndeksKlip
}

/** Satu hasil yang siap ditampilkan.
 *
 *  Dipakai untuk keempat sumber, termasuk halaman dan cast yang tidak
 *  pernah melewati server. Karena itu `rute` berupa nama route: masing-
 *  masing pemanggil menyelesaikannya dengan `localePath({ name })`. */
export interface HasilCari {
  jenis: JenisCari
  /** Unik per sumber, misalnya `klip:OC482018079`. */
  id: string
  judul: string
  keterangan: string
  /** Nama route Nuxt, bukan path. */
  rute: string
  params?: Record<string, string>
  query?: Record<string, string>
  hash?: string
  /** Untuk pengurutan cadangan dan tampilan. */
  tanggal?: string
  /** Foto cast atau thumbnail klip. */
  gambar?: string
  /** Durasi klip dalam detik. */
  detik?: number
  /** Angka besar di sisi kiri baris, misalnya nomor episode. */
  lencana?: string
  skor: number
}
