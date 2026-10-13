/** Keberadaan panel pencarian yang melayang di tengah halaman.
 *
 *  Ada karena pemicunya dan panelnya hidup di dua tempat berbeda.
 *  Pemicunya ada di navbar bawah, yang terpasang sekali di app.vue
 *  pada semua halaman. Panelnya hidup di app/pages/(search).
 *  Keduanya perlu satu sumber yang sama — tanpa ini, navbar hanya
 *  bisa membuka panel lewat URL, dan kita kehilangan kendali atas
 *  kapan panel ditutup.
 *
 *  `useState` dipakai, bukan `ref` biasa, supaya nilainya ikut
 *  diserialisasi ke payload SSR. Kalau `ref`, server selalu
 *  merender panel tertutup lalu hydration menemukan perbedaan
 *  saat panel sedang dibuka.
 */

/** Kunci state, bukan kunci penyimpanan.
 *
 *  Isinya cuma status tampil, bukan pilihan orang. Hilang saat
 *  server direstart dan itu wajar — panel tidak pernah terbuka
 *  tanpa diminta pengguna lebih dulu. */
const KUNCI_TERBUKA = 'cari-terbuka'

/** Kunci state kueri.
 *
 *  Wajib terpisah dari KUNCI_TERBUKA. `useState` memakai kunci
 *  sebagai identitas nilai, jadi satu kunci untuk dua hal
 *  berarti keduanya jadi satu ref yang sama — dan nilainya
 *  bertipe boolean sekaligus string. */
const KUNCI_KUERI = 'cari-kueri'

/** Satu hasil pencarian.
 *
 *  Kerangka saja. Belum ada sumber data, jadi belum ada yang
 *  mengisi bentuk ini. Definisi-nya ditulis sekarang supaya
 *  tempat yang menampilkan hasil punya kontrak yang jelas sejak
 *  awal — bukan baru harus menebak bentuk datanya belakangan,
 *  saat tiga halaman sudah ikut bergantung padanya. */
export interface HasilCari {
  id: string
  judul: string
  keterangan: string
}

/** CONTOH sementara — lihat catatan panjang di atas konstantanya.
 *  Hapus bersama blok itu begitu pencarian sungguhan ada. */
const HASIL_CONTOH: HasilCari[] = [
  {
    id: 'contoh-1',
    judul: 'Judul pendek',
    keterangan: 'Keterangan paling pendek, untuk memastikan jarak antar dua baris teks tetap enak dibaca.'
  },
  {
    id: 'contoh-2',
    judul: 'Judul sengaja dibuat panjang supaya tidak muat dalam satu baris di layar sempit',
    keterangan: 'Keterangan ini sengaja dibuat lebih dari dua baris supaya batas pemotongannya terlihat di sini, bukan cuma di teori.'
  },
  {
    id: 'contoh-3',
    judul: 'Judul sedang',
    keterangan: 'Keterangan sedang.'
  },
  {
    id: 'contoh-4',
    judul: 'Contoh terakhir',
    keterangan: 'Empat baris supaya jarak antar kartu terlihat seragam, bukan cuma dua.'
  }
]

/** Kunci state hasil.
 *
 *  Terpisah dari KUNCI_KUERI supaya kueri boleh berubah tanpa
 *  hasil ikut berubah diam-diam. Kalau keduanya satu ref,
 *  mengetik huruf baru akan langsung mengganti daftar hasil yang
 *  masih sedang dibaca. */
const KUNCI_HASIL = 'cari-hasil'

export function useSearchOverlay() {
  const terbuka = useState<boolean>(KUNCI_TERBUKA, () => false)
  const kueri = useState<string>(KUNCI_KUERI, () => '')
  /* Awalnya diisi data contoh, bukan array kosong.
 *
 * Nanti `hasil` akan diisi pemanggil sungguhan, jadi nilai awal
 * ini hanya berlaku selama belum ada sumber data. Dipasang di
 * sini, bukan di `tutup()`, karena `tutup()` tidak lagi
 * menyentuh `hasil` — lihat catatan di sana. Kalau awalnya
 * kosong, daftar hasil akan tampil kosong dari awal padahal
 * isinya sebenarnya sudah ada.
 *
 * Disalin dari HASIL_CONTOH, bukan memakai konstantanya
 * langsung, supaya isinya tidak bisa berubah dari luar. */
const hasil = useState<HasilCari[]>(KUNCI_HASIL, () => [...HASIL_CONTOH])

  /** Kueri yang sudah dipangkas spasi di kedua ujungnya.
   *
   *  Dipakai untuk deciding "sudah ada yang diketik atau belum".
   *  Tanpa dipangkas, satu spasi saja sudah dianggap pencarian,
   *  dan halaman langsung menampilkan keadaan "tidak ada hasil"
   *  untuk teks yang sebenarnya kosong. */
  const kueriBersih = computed(() => kueri.value.trim())

  /* Boolean, bukan `kueriBersih.value !== ''` yang ditulis ulang
     di template. Dipakai di dua tempat, jadi nilainya dihitung
     sekali di sini supaya tidak bisa berbeda satu baris. */
  const adaKueri = computed(() => kueriBersih.value !== '')

  function buka() {
    terbuka.value = true
  }

  /** Menutup panel. Kueri dan hasil SENGAJA tidak dikosongkan.
   *
   *  Ini yang membuat halaman ini bekerja. `kueri` adalah milik
   *  halaman, bukan milik panel — panel cuma tempat mengetik,
   *  sedangkan blok hasilnya hidup di halaman dan bergantung
   *  pada `kueri` lewat `adaKueri`.
   *
   *  Kalau `kueri` ikut dikosongkan di sini, `adaKueri` langsung
   *  jadi false dan blok hasil hilang tepat setelah panel ditutup.
   *  Jadi hasil pencarian tidak akan pernah tampil, acetone pun
   *  tidak bisa.
   *
   *  Mengosongkannya juga membuat hasil pencarian tidak
   *  konsisten: begitu panel ditutup, semua yang diketik hilang
   *  dan daftar ikut lenyap.
   *
   *  Kueri lama masih terlihat ketika panel dibuka lagi, karena
   *  input itu `v-model` ke `kueri` — teksnya muncul kembali di
   *  dalam kolom, bukan hilang di layar. Itu yang diinginkan:
   *  orang yang salah menutup panel bisa melanjutkan, bukan
   *  mengetik ulang dari awal.
   *
   *  Kalau memang perlu mengosongkan, itu bukan urusan `tutup`.
   *  Panel sudah punya tombol hapus bawaan `type="search"` untuk
   *  membersihkan kolom tanpa menutup apa pun. */
  function tutup() {
    terbuka.value = false
  }

  return { terbuka, kueri, kueriBersih, adaKueri, hasil, buka, tutup }
}