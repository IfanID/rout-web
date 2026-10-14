/** Data acara Running Man untuk beranda dan halaman detail.
 *
 *  Dipisah ke sini supaya dua halaman itu membaca satu sumber yang
 *  sama. Kalau datanya ditulis di masing-masing halaman, begitu
 *  episode terbaru bertambah satu, dua tempat harus ikut berubah dan
 *  tidak ada yang mengingat kalau salah satu lupa.
 *
 *  Angka dan tanggalnya diambil dari artikel Wikipedia
 *  "Running Man (TV program)", dibaca per 13 Oktober 2026. Nilainya
 *  masih ditulis tangan di sini — begitu sumbernya jadi API, file
 *  ini yang berubah, bukan template halaman.
 *
 *  "Running Man" boleh muncul di nama file ini: itu nama acaranya,
 *  bukan nama produk Rout. Larangan nama produk berlaku untuk
 *  identifier milik Rout, dan nama acara justru sudah dipakai
 *  sebagai route `running-man`.
 */

/* Semua kelompok data ditulis sebagai objek yang kuncinya adalah
   id, bukan larik.

   Alasannya larik hanya bisa dibaca lewat angka. Angka itu diam-diam
   jadi rujukan yang rapuh: menggeser satu baris ikut mengubah isi
   tempat lain tanpa ada yang menyadarinya. Dengan kunci, maksudnya
   kelihatan di teksnya sendiri.

   `v-for` tetap bisa membaca bentuk ini — `v-for="(satu, id) in
   daftar"` — jadi tidak ada biaya dari pilihan ini. */

/** Identitas acara, tampilannya di kartu depan beranda.
 *
 *  Huruf "R" adalah mark yang sama dengan yang muncul di navbar dan
 *  pemicu slot tengah, hanya ukurannya jauh lebih besar. Mark-nya
 *  ditulis ulang di tiap halaman, bukan memakai
 *  NavigationSlotMark: ukuran komponen itu sudah terkunci ke 1.5rem
 *  oleh perhitungan tetesan navbar, dan aturan warna yang dipakai
 *  di sini juga tidak berlaku di navbar. Menggabungkannya berarti
 *  setiap perubahan ukuran di satu tempat ikut mengubah yang lain.
 *
 *  Begitu ada poster resmi, huruf ini tinggal diganti gambar dan
 *  blok yang memakainya hilang. */
const ACARA = {
  huruf: 'R',
  namaAsli: '런닝맨',
  jenis: 'Variety show Korea Selatan',
  status: 'Tayang',
  /* Tahun mulai tayang, sebagai angka terpisah.
   *
   * Bukan potongan dari `meta.mulai` yang isinya "Tayang sejak
   * 2010". Memotong string supaya bisa dipakai di kalimat lain
   * berarti setiap pemanggil harus tahu persis kata apa yang harus
   * dibuang — dan begitu teksnya diubah, pemanggilnya ikut salah
   * tanpa error. */
  sejak: '2010',
  meta: {
    jaringan: { ikon: 'lucide:tv', nilai: 'SBS' },
    mulai: { ikon: 'lucide:calendar-days', nilai: 'Tayang sejak 2010' },
    /* Rentang, bukan angka tunggal. Durasi yang tercatat adalah
       80–95 menit, jadi mengetik satu angka berarti mengarang
       presisi yang tidak ada. */
    durasi: { ikon: 'lucide:clock', nilai: '80–95 menit' }
  }
}

/** Episode yang belum tayang.
 *
 *  Sengaja dipisah dari `episode` di bawah, bukan digabung jadi
 *  satu daftar. Kalau keduanya berderet, tidak ada lagi yang
 *  menjawab pertanyaan "kapan tayang lagi" tanpa membaca seluruh
 *  daftar lebih dulu. */
const BERIKUTNYA = {
  nomor: 823,
  hari: 'Minggu, 18 Oktober 2026',
  jam: '17.50 WIB'
}

const TENTANG = {
  /* Deskripsi resmi SBS, disalin dari meta tag halaman programnya:
     *
     *   https://m.programs.sbs.co.kr/enter/runningman/main
     *   <meta name="description">
     *
     * Teks Korea aslinya diawali "[기획의도 by 유재석]", ditulis SBS
   * sendiri, lalu diterjemahkan ke sini.
   *
   * Dulu blok ini punya genre, nama produser, dan sutradara. Ketiganya
   * DIHAPUS, bukan karena salah, tapi karena tidak ada di situs resmi:
   * halaman `about` SBS kosong, dan endpoint publiknya
   * (`apis.sbs.co.kr/program-api/1.0/cast/runningman/67779`) hanya
   * memuat data cast. Kalau tidak ada di sana, claims itu tidak punya
   * sumber yang bisa ditunjuk.
   *
   * Objek bernomor, bukan satu string panjang, supaya tiap paragraf
   * jadi elemen terpisah di halaman. */
  ringkas: {
    "1": "[Rencana produksi oleh Yoo Jae-suk (유재석)]",
    "2": "Di tengah masa ketika program variety terus menghilang dari layar, ini adalah salah satu program variety terbesar Korea yang selama lebih dari sepuluh tahun bertanggung jawab atas Minggu malam.",
    "3": "Ciri program ini adalah banyaknya bintang dan anggota yang mengerjakan misi bersama, dan dari semua unsur yang sebuah variety show punya, program ini hanya memusatkan perhatian pada satu: tertawa."
  }
}

/** "Musim" sengaja tidak ada. Running Man tidak membagi tayangannya
 *  ke dalam musim — nomor episodenya terus naik sejak 2010 tanpa
 *  restart, jadi menulis "15 musim" berarti mengarang batas yang
 *  tidak pernah ada. */
const STATISTIK = {
  /* `jumlah` adalah bentuk angkanya, terpisah dari `nilai` yang
     sudah diformat untuk ditampilkan.

     Dua-duanya dipakai: `nilai` untuk teks, `jumlah` untuk membandingkan
     — misalnya "menampilkan 5 dari 822". Kalau jumlah diambil dari
     `nilai`, setiap yang membandingkan harus tahu bahwa itu string,
     dan membandingkan angka dengan string kebetulan berhasil karena
     bahasa membenarkannya memaksa ke angka — bukan karena itu
     benar-benar angka. */
  /* Hanya dua angka ini yang tidak sudah tampil di kartu depan.

     Dulu ada empat. "80–95" dan "16 tahun tayang" dihapus karena
     kartu depan sudah menuliskannya lebih persis — "80–95 menit"
     dan "Tayang sejak 2010". Dua bentuk dari fakta yang sama di
     satu halaman cuma bikin pembaca mengira itu dua informasi
     berbeda, dan yang lebih pendek selalu kalah benar.

     Kalau nanti muncul angka yang juga sudah ada di kartu, jangan
     ditaruh di sini. */
  episode: { ikon: 'lucide:tv', nilai: '822', label: 'Episode', jumlah: 822 },
  cast: { ikon: 'lucide:users', nilai: '7', label: 'Cast tetap', jumlah: 7 }
}

/** Episode yang sudah tayang, terbaru di atas.
 *
 *  TIDAK ada judul episode. Running Man memang tidak memberi judul
 *  pada episodenya, dan mengarang judul demi kolom yang terlihat
 *  penuh akan menyesatkan. Nomor, tanggal, dan tamu adalah tiga hal
 *  yang benar-benar ada.
 *
 *  `tamu` juga belum lengkap. Daftar tamu yang tercatat disusun dari
 *  beberapa tabel yang tidak memuat semua tamu, jadi isinya berarti
 *  "tamu yang tercatat", bukan "semua tamu episode itu".
 *
 *  Belum ada pemuatan lebih banyak maupun penomoran halaman. Keduanya
 *  butuh keputusan bentuk dulu: tombol "Muat lagi" atau daftar
 *  bersambung yang terus menambah ke bawah. Menebak sekarang hanya
 *  menambah kode yang nanti harus dibongkar. */
const EPISODE = [
  { nomor: 822, tanggal: '11 Oktober 2026', tamu: 'Heo Kyung-hwan' },
  { nomor: 821, tanggal: '4 Oktober 2026', tamu: 'Heo Kyung-hwan' },
  { nomor: 820, tanggal: '27 September 2026', tamu: 'San' },
  {
    nomor: 819,
    tanggal: '20 September 2026',
    tamu: 'Heo Kyung-hwan, Miyeon, Lee Joo-yeon'
  },
  { nomor: 818, tanggal: '13 September 2026', tamu: 'Kwon Eun-bi' }
]

/* Identitas objeknya dijaga tetap di luar fungsi. Kalau objeknya
   dibuat di dalam, setiap panggilan memakai objek baru, dan setiap
   `v-for` yang membacanya merender ulang tanpa ada yang berubah di
   layar. */
export function useRunningMan() {
  return {
    acara: ACARA,
    berikutnya: BERIKUTNYA,
    tentang: TENTANG,
    statistik: STATISTIK,
    episode: EPISODE
  }
}
