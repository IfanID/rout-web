/** Bentuk satu episode Running Man, sebagaimana menyeberang dari
 *  `server/api` ke app.
 *
 *  Di `shared/types/` karena dipakai dua sisi: handler di
 *  `server/api/running-man/episode.get.ts` yang mengirimnya, dan
 *  `app/composables/useRunningManEpisode.ts` yang membacanya. Bukan di
 *  `server/` karena `app/` tidak boleh mengimpor dari sana, dan bukan juga
 *  di `app/` karena server yang memiliki datanya.
 *
 *  Semuanya sudah berupa katak, bukan bentuk mentah dari abyss: tanggal
 *  tidak ada, durasi tidak ada, dan id yang dikirim ke halaman bukan id
 *  folder melainkan id berkasnya — yang itu juga slug untuk player-nya.
 *  Pemetaannya ada di `server/utils/running-man/episode.ts`. */

export interface Episode {
  /** Nomor episode sebagai angka, bukan "070".
   *
   *  Nol di depan dibuang karena yang dibandingkan selalu angka, dan
   *  `"9" > "70"` benar secara leksikografis tapi salah secara makna.
   *  Untuk ditampilkan, format ulang di komponen. */
  nomor: number

  /** Nama acara, diambil dari bagian nama berkas sebelum nomornya:
   *  "Running Man Episode 70 Sub Indo.mp4" -> "Running Man".
   *
   *  Boleh kosong kalau nama berkasnya tidak memuat pola itu — baris
   *  tetap tampil, hanya judulnya hilang. */
  acara: string

  /** Keterangan setelah nomornya, dipisah dari judulnya:
   *  "Running Man Episode 70 Sub Indo.mp4" -> "Sub Indo".
   *
   *  Sifatnya boleh kosong, dan itu bukan berarti ada yang salah. Subtitle
   *  Running Man ada di dalam video, bukan di abyss sebagai berkas
   *  terpisah — sudah diperiksa, semua 69 berkas punya daftar subtitle
   *  kosong. Jadi "Sub Indo" di sini satu-satunya tempat informasi itu
   *  tercatat. Unggahan berikutnya yang tanpa subtitle akan otomatis
   *  punya kolom ini kosong, bukan menampilkan lencana yang berbohong. */
  label: string

  /** Id berkas di abyss, dipakai sebagai bagian URL player-nya.
   *
   *  BUKAN id folder. Foldernya dipanggil "Episode 070" dan tidak punya
   *  video di dalamnya — yang punya video adalah berkasnya. */
  berkas: string

  /** Ukuran berkas dalam byte, bukan "0,87 GB". */
  ukuran: number

  /** Kualitas yang benar-benar ada, apa adanya dari abyss:
   *  `["SD", "HD"]`, `["HD"]`, `["mHD", "HD"]`.
   *
   *  TIDAK boleh disaring ke daftar tetap. Daftar di dokumentasi abyss
   *  menyebut `SD`, `HD`, `FullHD`, `2K`, `4K` — tapi episode 13 punya
   *  `mHD` yang tidak disebut di sana. Saringan seperti itu akan diam-diam
   *  membuang satu kualitas yang benar-benar bisa diputar. */
  resolusi: string[]

  /** Alamat player siap pakai: `https://player.abyssplayer.com/<berkas>`.
   *
   *  Dibentuk di server supaya halaman tidak menyusunnya sendiri dari
   *  slug — alamat player adalah urusan abyss, dan kalau bentuknya berubah,
   *  yang berubah hanya satu tempat. */
  pemutar: string
}