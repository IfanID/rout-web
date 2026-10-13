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

   Alasannya halaman ini dipakai di dua halaman, dan larik hanya bisa
   dibaca lewat angka (`jadwal[1]`). Angka itu diam-diam jadi rujukan
   yang rapuh: menggeser satu baris di daftar beranda ikut mengubah
   isi halaman detail tanpa ada yang menyadarinya. Dengan kunci,
   kedua halaman menulis `jadwal.jam.nilai` dan maksudnya kelihatan
   di teksnya sendiri.

   `v-for` tetap bisa membaca bentuk ini — `v-for="(satu, id) in
   jadwal"` — jadi tidak ada biaya dari pilihan ini. */

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

/** Jadwal tetap: pola yang berulang tiap minggu dan tidak pernah
 *  berubah.
 *
 *  Tiap baris menyimpan ikonnya. Jadwal ini dibaca berulang, jadi
 *  ikon membuat orang mengenali barisnya sebelum sempat membaca
 *  katanya — "hari" dan "jam" bisa tertukar di layar sempit kalau
 *  semuanya cuma teks. Ikon ikut datanya, bukan ditulis di halaman,
 *  supaya halaman tidak perlu tahu baris mana yang pakai ikon apa. */
const JADWAL = {
  /* Jam 16.50 KST ditulis jadi 17.50 WIB. KST satu jam di depan
     WIB, dan halaman ini ditulis untuk pembaca Indonesia —
     menampilkan jam Korea membuat orang salah menghitung kapan
     acaranya mulai. */
  hari: { ikon: 'lucide:calendar-days', label: 'Hari', nilai: 'Minggu' },
  jam: { ikon: 'lucide:clock', label: 'Jam', nilai: '17.50 WIB' },
  pemancar: { ikon: 'lucide:tv', label: 'Pemancar', nilai: 'SBS' },
  /* Hanya Netflix. Platform streaming lain tidak tercatat di sumber,
     jadi menambahkannya berarti mengarang. */
  streaming: { ikon: 'lucide:play', label: 'Streaming', nilai: 'Netflix' }
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
  ringkas:
    'Running Man adalah acara variety show dari Korea Selatan yang tayang sejak 2010 di SBS. Tujuh cast bergantian mengerjakan misi dan lomba yang hampir selalu berakhir tanpa pemenang yang jelas. Di balik semua kekacauan itu, tiap episode selalu punya satu tim dengan satu target yang harus diselesaikan lebih dulu.',
  meta: {
    genre: { ikon: 'lucide:clapperboard', nilai: 'Game show, variety, komedi' },
    produksi: { ikon: 'lucide:building-2', nilai: 'SBS, SangSang, Urban Works' },
    sutradara: { ikon: 'lucide:video', nilai: 'Kim Sol-maro' }
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
  episode: { ikon: 'lucide:tv', nilai: '822', label: 'Episode', jumlah: 822 },
  cast: { ikon: 'lucide:users', nilai: '7', label: 'Cast tetap', jumlah: 7 },
  durasi: { ikon: 'lucide:clock', nilai: '80–95', label: 'Menit' },
  usia: { ikon: 'lucide:calendar-range', nilai: '16', label: 'Tahun tayang', jumlah: 16 }
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
    jadwal: JADWAL,
    berikutnya: BERIKUTNYA,
    tentang: TENTANG,
    statistik: STATISTIK,
    episode: EPISODE
  }
}