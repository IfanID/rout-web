/** Notifikasi episode Running Man yang baru tayang.
 *
 *  Dipasang sekali di `app.vue`, jadi bekerja di halaman mana pun — bukan
 *  hanya di halaman Running Man. Alasannya Toaster-nya global, dan pemanggilnya
 *  harus setara: kalau pemanggilnya hidup di satu halaman saja, toast bisa
 *  naik dari halaman yang tidak pernah memasangnya.
 *
 *  **Pemicunya sudah ada, tidak perlu dibangun apa-apa.** Endpoint
 *  `/api/running-man/jadwal` mengembalikan episode BERIKUTNYA yang akan
 *  tayang. Begitu satu episode benar-benar tayang, SBS menaruhnya di menu
 *  kembali tonton, dan nomornya naik satu:
 *
 *      822 tayang  ->  SBS menambah 822  ->  nomor 823  ->  824
 *
 *  Yang diberi tahu adalah `nomor - 1`, yaitu episode yang baru saja
 *  tayang — bukan nomornya sendiri, karena nomor itu yang justru belum
 *  tayang dan sudah tercetak di kartu beranda.
 *
 *  **Nomor tidak pernah berubah tanpa SBS menambah episode.** Di
 *  `berikutnyaDari()`, `nomor` dihitung dari nomor terakhir saja, sedangkan
 *  "hari ini" hanya menggeser tanggal: kalau tanggal digeser seminggu karena
 *  minggu itu memang tidak ada tayang, nomornya tetap. Jadi satu angka ini
 *  cukup, tanpa sumber kedua yang bisa berbeda dengan yang pertama.
 *
 *  **Dicek tiap muat halaman, bukan tiap detik.** Episode rilis sekali
 *  seminggu, sedangkan halaman hanya hidup beberapa detik. Menunggu sampai
 *  SBS mengunggah episode itu sambil membukanya tiap saat berarti hampir
 *  tidak pernah menangkap apa pun — padahal begini, siapa pun yang membuka
 *  situs hari Rabu langsung tahu episode Senin lalu sudah ada.
 *
 *  Yang disimpan hanya satu angka: nomor episode terakhir yang pernah dilihat
 *  orang ini. Tanpa itu, notifikasi akan muncul setiap kali halaman dibuka
 *  sepanjang minggu, karena nomornya tetap sampai minggu berikutnya — dan
 *  bunyi berulang bukan lagi notifikasi.
 *
 *  Sepadan dengan `useLabelEpisode.ts`: kunci pakai isi, bukan nama produk,
 *  karena `localStorage` bertahan jauh lebih lama dari kode ini. Letak
 *  pemeriksaan dan penyimpanan sengaja satu berkas — kalau terpisah, keduanya
 *  bisa diam-diam berbeda versi, dan itu terdengar sebagai toast yang bunyi
 *  ulang atau tidak bunyi sama sekali. */

/** Kunci localStorage. Pakai isi, bukan nama produk — lihat catatan di atas. */
const KUNCI_SIMPAN = 'episode-terakhir-dilihat'

/** Berapa lama toast ini bertahan, dalam milidetik.
 *
 *  Bukan `DURASI_DEFAULT` dari `useNotifications.ts`, dan default itu
 *  sengaja tidak diubah: toast label episode memanggilnya tanpa argumen
 *  kedua, jadi ikut berubah kalau default itu ikut diubah. Enam detik karena
 *  pesannya menyuruh orang membaca satu nomor episode — tiga detik sudah
 *  hampir habis sebelum matanya sampai ke situ. */
const DURASI = 6000

export function useEpisodeBaru() {
  const { t } = useI18n()
  const { notify } = useNotifications()
  const { catat } = useAktivitas()

  /* Memakai `useRunningManJadwal()` dan bukan `useAsyncData` sendiri, meski
   * kuncinya sama.
   *
   * `useAsyncData` menggabungkan dua permintaan dengan kunci sama hanya kalau
   * opsi keduanya cocok, dan yang dibandingkan adalah identitas fungsi — bukan
   * teksnya. Handler yang ditulis ulang di sini akan menjadi fungsi terpisah,
   * apa pun isinya, dan hasilnya peringatan `NUXT_E3004` plus dua permintaan
   * untuk data yang sama di halaman `/running-man`.
   *
   * Lewat composable yang sama, pemanggilannya satu: handler-nya di-hoist
   * module-level di `useRunningManJadwal.ts`, jadi ketiganya benar-benar
   * digabung dan halaman `/running-man` tidak melakukan round-trip dua kali.
   *
   * Panggilannya tanpa `await`. Yang perlu terjadi untuk mendaftarkan dirinya
   * ke registry `useAsyncData` sudah terjadi saat fungsinya dipanggil — jadi
   * jadwal tetap ikut ter-render di server dan ikut masuk ke payload. Yang
   * ditunggu nanti adalah `Ref`-nya, untuk dipasang pengintai. */
  const jadwal = useRunningManJadwal()

  /** Nomor episode terakhir yang pernah dilihat, atau `null` kalau belum ada.
   *
   *  Yang tersimpan bisa saja bukan angka: `localStorage` bisa diubah dari
   *  console peramban, dan isinya bukan hal yang perlu dipercaya begitu
   *  masuk. Bentuk yang tidak terbaca dianggap sama dengan belum ada —
   * bukan nol, yang akan membuat semua episode setelahnya terlihat "baru".
   *
   *  Dipanggil dari `onMounted` di bawah: `localStorage` hanya ada di
   *  browser. */
  function baca(): number | null {
    const nomor = Number(localStorage.getItem(KUNCI_SIMPAN))

    return Number.isInteger(nomor) && nomor > 0 ? nomor : null
  }

  function tulis(nomor: number) {
    localStorage.setItem(KUNCI_SIMPAN, String(nomor))
  }

  /** Satu episode baru, atau beberapa sekaligus. */
  function lapang(nomor: number | undefined) {
    /* Datanya belum datang, atau SBS tidak bisa dihubungi. Keduanya berakhir
     * sama: tidak ada yang bisa diceritakan, dan angka yang tersimpan tidak
     * boleh ikut berubah. */
    if (typeof nomor !== 'number' || !Number.isInteger(nomor) || nomor <= 0) return

    const tersimpan = baca()

    /* Kunjungan pertama: angka baru ditulis, tapi TIDAK diberi tahu.
     *
     * Tanpa penjaga ini orang yang pertama kali membuka situs mendapat
     * "822 episode baru" — bukan kabar, cuma daftar. Kunjungan pertama memang
     * tidak punya apa pun untuk dibandingkan, jadi satu-satunya hal yang bisa
     * dilakukan adalah mencatat keadaan sekarang. */
    if (tersimpan === null) {
      tulis(nomor)
      return
    }

    const jarak = nomor - tersimpan

    /* Nomor turun, atau sama. Jangan diberi tahu — dan jangan juga ditulis
     * apa pun, karena menyimpan angka yang lebih rendah akan membuat
     * kunjungan berikutnya yang bunyi sebagai "1 episode baru" padahal tidak
     * ada yang tayang.
     *
     * Secara normal ini tidak akan terjadi: `pakaiCadangan` di
     * `berikutnyaDari()` membuat nomor ter-floor di
     * `TERAKHIR_DIKETAHUI.nomor + 1`. Tapi kalau nilai cadangan itu pernah
     * diturunkan di commit yang salah, orang tidak boleh menerima
     * "Episode 800 baru tayang". */
    if (jarak <= 0) return

    /* Kunci dan parameternya ditulis SEKALI di sini, lalu dipakai dua kali:
     * toast yang muncul sekarang, dan catatan riwayat yang tersimpan.
     *
     * Ditulis dua kali berarti dua tempat yang bisa berbeda — dan
     * perbedaannya baru ketahuan jauh kemudian, saat toast berbunyi
     * "Episode 823" tapi riwayatnya berbunyi "Episode 822". Satu sumber,
     * dua pemakai. */
    const kunci = jarak === 1 ? 'episode_baru.satu' : 'episode_baru.banyak'
    const param = jarak === 1 ? { nomor: nomor - 1 } : { jumlah: jarak }

    notify.sukses(t(kunci, param), DURASI)

    /* Riwayat disimpan dengan kunci dan parameter yang sama, bukan kalimat
     * jadinya — supaya baris lamanya di halaman `/aktivitas` ikut berubah
     * bahasa mengikuti yang sedang dibaca. Lihat `useAktivitas.ts`.
     *
     * Dicatat SEBELUM `tulis()` di bawah. Urutannya penting: kalau angka
     * episode lebih dulu ditulis, lalu pencatatan gagal, episode ini hilang
     * dari riwayat dan tidak akan pernah dicatat lagi — nomornya sudah
     * dianggap sudah dilihat orang ini. */
    catat(kunci, param)

    /* Ditulis setelah diberi tahu, bukan sebelumnya. Kalau penulisan ini
     * gagal, orang itu masih diberi tahu sekali lagi di kunjungan berikutnya
     * — lebih baik daripada sebaliknya, yaitu tidak pernah sama sekali. */
    tulis(nomor)
  }

  /* Hanya di browser.
   *
   * Toast yang dirender di server akan ikut masuk ke HTML yang dikirim, dan
   * state-nya ikut ter-serialize ke payload — jadi orang akan melihat
   * notifikasi yang masa hidupnya sudah habis begitu halamannya sampai. Alasan
   * yang sama membuat `useHitungMundur.ts` mengembalikan `null` sebelum
   * terpasang.
   *
   * `immediate` karena `jadwal` sudah selesai sebelum `onMounted` jalan: kalau
   * hanya menunggu perubahan, halaman yang memang meminta jadwal di server
   * tidak akan pernah memicu apa pun di browser — orang baru diberi tahu
   * setelah berpindah halaman. */
  onMounted(async () => {
    const ref = await jadwal

    watch(ref, satu => lapang(satu?.nomor), { immediate: true })
  })
}