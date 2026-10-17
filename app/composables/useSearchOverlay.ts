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
 *  diserialisasi ke payload SSR. Kalau `ref`, server selalu merender
 *  panel tertutup lalu hydration menemukan perbedaan saat panel
 *  sedang dibuka.
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
 *  sebagai identitas nilai, jadi satu kunci untuk dua hal berarti
 *  keduanya jadi satu ref yang sama — dan nilainya bertipe boolean
 *  sekaligus string. */
const KUNCI_KUERI = 'cari-kueri'

/** Kunci state kelompok yang popupnya sedang dibuka.
 *
 *  Terpisah dari kueri dan dari status panel. Nilainya cuma nama
 *  kelompok (`episode`, `klip`, …), bukan daftar hasil — hasilnya tetap
 *  dihitung di halaman yang punya `useCari`, supaya dialog tidak
 *  membuat instance `useCari` kedua. */
const KUNCI_KELOMPOK = 'cari-kelompok'

export function useSearchOverlay() {
  const terbuka = useState<boolean>(KUNCI_TERBUKA, () => false)
  const kueri = useState<string>(KUNCI_KUERI, () => '')
  const kelompokTerbuka = useState<string | null>(KUNCI_KELOMPOK, () => null)

  /** Kueri yang sudah dipangkas spasi di kedua ujungnya.
 *
 *  Yang membutuhkannya bukan tampilan, tapi dua perbandingan: debounce
 *  yang menjadwalkan pencarian, dan pembanding `kueriBersih === qTunda`
 *  yang menentukan apakah keadaan di panel cari masih relevan.
 *
 *  Tanpa dipangkas, mengetik lalu dihapus kembali akan membandingkan
 *  "j" dengan " j" — dua ketikan yang terlihat sama di kolom tapi
 *  dianggap berbeda oleh kode. */
  const kueriBersih = computed(() => kueri.value.trim())

  function buka() {
    terbuka.value = true
  }

  /** Menutup panel. Kueri SENGAJA tidak dikosongkan.
   *
   *  `kueri` adalah milik halaman, bukan milik panel — panel cuma tempat
   *  mengetik, sedangkan blok hasilnya hidup di halaman. Kalau `kueri`
   *  ikut dikosongkan di sini, blok hasil langsung hilang tepat setelah
   *  panel ditutup.
   *
   *  Kueri lama masih terlihat ketika panel dibuka lagi, karena input
   *  itu `v-model` ke `kueri` — teksnya muncul kembali di dalam kolom,
   *  bukan hilang di layar. Itu yang diinginkan: orang yang salah
   *  menutup panel bisa melanjutkan, bukan mengetik ulang dari awal.
   *
   *  Kalau memang perlu mengosongkan, itu bukan urusan `tutup`. Panel
   *  punya tombol hapus sendiri di dalam kolomnya — `type="button"`,
   *  bukan submit — yang membersihkan teks tanpa menutup apa pun.
   *
   *  Tombol itu sengaja tidak membuat panel ikut menutup, dan itu bukan
   *  kelalaian: orang yang menghapus teks sedang menulis ulang, dan
   *  mencabut panel tepat saat dia butuh menulis adalah kesalahan yang
   *  tidak bisa dibatalkan dengan satu ketukan. */
  function tutup() {
    terbuka.value = false
  }

  /** Membuka popup daftar lengkap satu kelompok. */
  function bukaKelompok(jenis: string) {
    kelompokTerbuka.value = jenis
  }

  function tutupKelompok() {
    kelompokTerbuka.value = null
  }

  return {
    terbuka,
    kueri,
    kueriBersih,
    kelompokTerbuka,
    buka,
    tutup,
    bukaKelompok,
    tutupKelompok
  }
}
