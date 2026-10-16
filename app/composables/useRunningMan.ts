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
 *  Satu bagian sudah jadi API dan karena itu TIDAK ada lagi di sini:
 *  jadwal tayang episode berikutnya, yang berubah sendiri setiap minggu
 *  mengikuti apa yang benar-benar sudah tayang di SBS. Sumbernya
 *  `useRunningManJadwal()`, aturannya di
 *  `server/utils/running-man/jadwal.ts`. Yang tetap tinggal di berkas ini
 *  cuma jam tayangnya, yang sama dari minggu ke minggu — lihat
 *  `JAM_TAYANG`.
 *
 *  Jumlah episodenya TIDAK ada di sini lagi. Sempat ditulis tangan, lalu
 *  basi begitu episode berikutnya tayang — angka mati tidak pernah
 *  memperbarui dirinya sendiri. Sekarang dihitung dari jadwal SBS yang
 *  sudah diambil halaman, lewat `episodeTercetak` di bawah.
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

/** Jam tayangnya, tetap, untuk kartu "Tayang berikutnya" di beranda.
 *
 *  Jamnya disimpan sebagai ANGKA, bukan sebagai tulisan "18.10 KST".
 *  Dua pemakainya butuh dua hal yang berbeda dari satu fakta yang sama:
 *  kartunya menuliskan jamnya dalam dua zona, dan hitung mundurnya
 *  menghitung ke titik waktu itu. Kalau yang disimpan cuma teks jadinya,
 *  hitung mundur harus membongkar teks itu lagi untuk tahu jam berapa —
 *  dan pembongkaran seperti itu diam-diam salah begitu bentuk teksnya
 *  berubah.
 *
 *  Sumbernya halaman program SBS sendiri, yang menulis jadwal ini sebagai
 *  kalimat:
 *
 *    매주 일요일 오후 6시 10분   — setiap Minggu 18.10 KST
 *
 *  Angka ini TIDAK bisa diambil dari API-nya sebagai angka: di sana
 *  jadwalnya cuma kalimat Korea seperti di atas, dan menerka-nerka arti
 *  kalimat itu di kode lebih rapuh daripada mencatatnya sekali di sini.
 *  Kalau SBS mengubah jam tayangnya, yang berubah cuma dua baris ini.
 *
 *  Yang perlu dicatat: sebelum ini kartu beranda menulis "17.50 WIB", dan
 *  itu salah dua kali — menitnya bukan 50, dan jam Korea bukan jam
 *  Indonesia. Nilainya tidak pernah berasal dari SBS, cuma ikut ditulis
 *  apa adanya dari ingatan. */
const JAM_TAYANG = {
  /** Jam tayang dalam waktu Korea, apa adanya dari SBS. */
  jam: 18,
  /** Menitnya. */
  menit: 10
}

/** Selisih WIB terhadap KST, dalam jam.
 *
 *  Dua jam, dan tetap: Indonesia bagian barat (UTC+7) dan Korea (UTC+9)
 *  sama-sama tidak memakai waktu musim panas. Kartu beranda memakainya
 *  untuk menulis jam yang sama dalam dua zona. */
const SELISIH_WIB = 2

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

/* Daftar statistik TIDAK ada di sini, dan memang tidak pernah ada.
 *
 * Sempat ada: `STATISTIK_TETAP` berisi satu kotak "Cast tetap: 7"
 * yang ditulis tangan. Angka itu benar sampai daftar cast berubah,
 * lalu basi tanpa ada yang memberitahu — masalah yang sama seperti
 * angka "822 episode" yang lebih dulu dihapus. Sekarang kedua angka
 * dihitung di halaman yang punya datanya, yaitu
 * `app/pages/running-man/detail.vue`, dan hanya halaman itu yang
 * menampilkan bagian statistik.
 *
 * "Musim" juga sengaja tidak ada. Running Man tidak membagi tayangnya
 * ke dalam musim — nomor episodenya terus naik sejak 2010 tanpa
 * restart, jadi menulis "15 musim" berarti mengarang batas yang tidak
 * pernah ada. */

/* Daftar episode TIDAK ada di sini, dan jumlah episodenya juga tidak.
 *
 * Dulu ada larik `EPISODE` berisi lima episode contoh, dipakai halaman
 * episode dan halaman pemutar. Keduanya sekarang membaca abyss.to lewat
 * `useDaftarEpisode()`.
 *
 * Jumlah episode acaranya pun tidak ditulis di sini. Sempat ditulis
 * `822` sebagai angka mati di `STATISTIK`: benar sampai episode
 * berikutnya tayang, lalu basi tanpa ada yang memberitahu, karena tidak
 * ada yang memperbarui angka mati. Sekarang dihitung dari jadwal SBS
 * yang sudah diambil halaman — lihat `episodeTercetak` di bawah.
 *
 * Yang tetap terpisah: jumlah episode yang tersedia untuk ditonton
 * (70, dari abyss) menjawab pertanyaan berbeda, dan menyamakan
 * keduanya membuat orang mengira ada ratusan baris yang gagal dimuat. */

/* Identitas lariknya dijaga tetap di luar fungsi. Kalau dibuat di dalam,
   setiap panggilan memakai larik baru, dan setiap `v-for` yang membacanya
   merender ulang tanpa ada yang berubah di layar. */
export function useRunningMan(
  /** Nomor episode yang tayang berikutnya, dari `useRunningManJadwal()`.
   *
   *  Opsional: halaman yang tidak punya angka ini tetap jalan, hanya
   *  tanpa kotak "Episode" — bukan dengan angka karangan. */
  nomorBerikutnya?: Ref<number | null>
) {
  /** Berapa episode yang sudah tayang, atau `null` kalau tidak diketahui.
   *
   *  Dihitung dari nomor tayang berikutnya: episode terakhir yang sudah
   *  tayang adalah satu less. Hitungan ini persis kebalikan dari yang
   *  dilakukan server di `berikutnyaDari()`, jadi tidak ada dugaan baru
   *  di dalamnya.
   *
   *  **Tidak ada angka cadangannya.** Kalau SBS sedang tidak bisa
   *  dihubungi, nomor terakhir tidak diketahui dan yang dikembalikan
   *  `null`, supaya pemanggil menyembunyikan barisnya. Angka cadangan
   *  adalah masalah yang sama seperti angka mati — tampil sebagai
   *  kepastian padahal sudah basi. */
  const episodeTercetak = computed(() => {
    const berikut = nomorBerikutnya?.value ?? null

    return berikut && berikut > 1 ? berikut - 1 : null
  })

  return {
    acara: ACARA,
    /* Jadwal tayang berikutnya TIDAK ada di sini: nomor dan tanggalnya
     * datang dari SBS lewat `useRunningManJadwal()`, karena keduanya
     * berubah sendiri setiap minggu. */
    jamTayang: JAM_TAYANG,
    selisihWib: SELISIH_WIB,
    tentang: TENTANG,
    episodeTercetak
  }
}
