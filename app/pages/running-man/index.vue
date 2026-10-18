<script setup lang="ts">
/* Beranda Running Man: satu kartu — tayang berikutnya — lalu pintasan
 * ke tiga halaman lain, klip terbaru, dan tayangan live.
 *
 *   /running-man                       halaman ini
 *   /running-man/detail                informasi acara
 *   /running-man/episode               daftar episode
 *   /running-man/episode/streaming     menonton
 *   /running-man/preview               daftar klip
 *   /running-man/preview/:id           satu klip
 *
 * Berkasnya `index.vue`, bukan `running-man.vue`, dan itu syarat,
 * bukan gaya penulisan. Berkas `running-man.vue` tidak boleh berdiri
 * bersama folder `running-man/` yang bernama sama: kalau keduanya ada,
 * route di bawah folder itu menjadi CHILD dari route beranda, bukan
 * saudara. Vue Router merender parent lebih dulu dan hanya menampilkan
 * child lewat `<router-view>` milik parent — dan beranda ini tidak punya
 * satu pun. Gejalanya bukan 404, bukan peringatan di console, dan
 * semua tautannya tetap berfungsi: `/running-man/detail` hanya membuka
 * isi beranda. Bug yang lolos dari pemeriksaan biasa.
 *
 * Dengan `index.vue`, nama route mentahnya `running-man/index`, bukan
 * `running-man`, sehingga pencarian parent di `toVueRouter4` gagal
 * cocok dan `detail` tetap jadi saudara dengan path absolut. Nama route
 * akhirnya tetap `running-man`, karena `index` di ujung nama route
 * dibuang.
 *
 * Tetesan navbar diwarisi lewat awalan path `/running-man/`, jadi
 * kolom `dalam` di useMiddleSlot.ts dibiarkan kosong untuk bagian ini.
 * Lihat catatan fungsi `milik` di BottomNav.vue.
 *
 * Yang tampil di sini sengaja cuma satu kartu, karena orang yang
 * masuk lewat slot tengah navbar sedang menanyakan satu hal: "tayang
 * lagi kapan?". Jadwal, tentang acara, dan statistiknya semuanya
 * ada di halaman detail.
 *
 * Di bawahnya ada bagian klip — tiga yang terlihat sekaligus, limabelas
 * yang tersedia lewat gulir di dalam kotaknya sendiri. Datanya nyata,
 * diambil dari SBS lewat /api/running-man/clips.
 *
 * Sifatnya berbeda dari kartu di atas: kartu menjawab pertanyaan yang
 * sudah dibawa orang, klip menawarkan yang belum terpikir olehnya.
 * Karena itu ia duduk di bawah kartu dan pintasannya, dan yang
 * ditampilkan hanya sebagian — daftar penuh menjawab pertanyaan lain,
 * dan punya halamannya sendiri di /running-man/preview.
 *
 * Ketiga klip pertama sengaja tidak menumpuk panjang ke bawah: bagian
 * ini menawarkan, bukan mendaftar, dan limabelas baris di tengah
 * beranda mendorong bagian live jauh ke bawah halaman. Kotaknya
 * digulir, dan kartu keempat mengintip sedikit sebagai penanda bahwa
 * di bawahnya masih ada isi.
 *
 * Di antara keduanya ada dua kartu pintasan. Dulu dua perintahnya
 * berupa tombol yang berbagi satu baris; di layar lebar keduanya jadi
 * dua permukaan sepanjang setengah halaman yang isinya cuma tiga kata.
 * Sekarang keduanya berbentuk kartu berisi kalimat penjelas, supaya
 * permukaan selebar itu punya isi yang menjelaskannya.
 *
 * Yang sengaja TIDAK dibuatkan kartu di situ adalah daftar klip:
 * pintunya sudah ada di bagian "예고보기" di bawah, dan dua tautan ke
 * halaman yang sama di satu halaman hanya menambah pilihan yang
 * hasilnya sama.
 *
 * Paling paling bawah ada bagian live YouTube. Alamatnya bukan ditulis
 * di halaman ini, tapi dibaca dari .env, dan bagian itu hilang sendiri
 * kalau variabelnya kosong — jadi judulnya tidak pernah berdiri tanpa
 * isi di bawahnya. Tayangannya mulai sendiri saat halaman dibuka, dan
 * selalu tanpa suara dulu karena itu aturan playback otomatis di
 * semua peramban; makanya ada satu kalimat kecil di bawahnya.
 *
 * Kartu tayang sengaja bukan tautan. Kalau kartu ikut jadi tautan,
 * isinya jadi dua perintah dalam satu tempat — "ini yang akan tayang"
 * dan "buka yang lengkap" — dan kartu tidak bisa menampilkan hover
 * tanpa ikut menyiratkan bahwa ia bisa diklik. Yang bisa diketuk di
 * halaman ini sudah punya bentuknya sendiri: kartu pintasan di bawah
 * kartu tayang.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Running Man". Nama
 * acara dari Korea Selatan itu bukan brand Rout dan bukan teks yang
 * perlu diterjemahkan, sama seperti di useMiddleSlot.ts. */

definePageMeta({
  /* Halaman ini di-mount ulang setiap kali query berubah.
   *
   * Tanpa itu, berpindah tab hanya mengganti URL: route-nya sama persis,
   * jadi Vue Router memakai ulang instance komponennya dan `<script setup>`
   * tidak dijalankan lagi — datanya tetap milik urutan yang lama, dan
   * tabelnya terlihat tidak berubah padahal sudah pindah.
   *
   * `key` yang ikut `fullPath` membuat setiap query terbaca sebagai halaman
   * baru bagi Nuxt: setup, pengambilan data, dan pengintai ikut dibuat dari
   * nol. Halaman daftar punya catatan yang sama. */
  key: route => route.fullPath
})

const localePath = useLocalePath()

/* `t` dipakai untuk judul bagian klip. `locale` sendiri bukan untuk
 * terjemahan, tapi untuk `Intl.DateTimeFormat` di bawah. */
const { t, locale } = useI18n()

/* Jadwal tayang episode berikutnya — nomor dan tanggalnya.
 *
 * Dua-duanya datang dari SBS lewat `useRunningManJadwal()`, bukan ditulis
 * di sini: nomornya naik sendiri begitu episodenya muncul di 다시보기,
 * dan tanggalnya digeser seminggu sendiri kalau minggu itu memang tidak
 * ada tayangan. Aturannya di `server/utils/running-man/jadwal.ts`.
 *
 * Boleh `null` kalau permintaannya gagal; di kartu, bagian episode dan
 * tanggalnya disembunyikan kalau begitu — lihat catatan di templatenya. */
const jadwal = await useRunningManJadwal()

/* Nomor tayang berikutnya, jadi yang sudah tayang bisa dihitung: satu less.
 *
 * Yang dikembalikan hanya bentuk angkanya, bukan objek jadwalnya, karena
 * yang dibutuhkan `useRunningMan` memang cuma angka itu. `null` kalau
 * jadwalnya tidak diketahui — dan itu diteruskan apa adanya ke bawah, bukan
 * diisi angka cadangan. */
const jadwalNomor = computed(() => jadwal.value?.nomor ?? null)

/* Dipanggil setelah `jadwal`, bukan sebelumnya: jumlah episode sudah tayang
 * dihitung dari nomor tayang berikutnya, jadi halaman ini yang tahu urutan
 * pemanggilannya. */
const { acara, jamTayang, selisihWib, episodeTercetak } = useRunningMan(
  jadwalNomor
)

/* Tanggalnya dibentuk DI SINI, bukan dikirim jadi dari server.
 *
 * Yang datang dari server adalah tanggal ISO, dan nama hari serta nama
 * bulannya bergantung bahasa yang sedang dibaca — aturan yang sama
 * dipakai tanggal klip di PreviewList.vue. Kalau server yang mengirim
 * "Minggu, 18 Oktober 2026", pembaca `/en` dan `/ko` ikut kebagian teks
 * Indonesia.
 *
 * `T00:00:00` sengaja ditambahkan, sama seperti di PreviewList.vue:
 * tanpa itu `new Date('2026-10-18')` dibaca sebagai tengah malam UTC dan
 * di wilayah yang sehari lebih ke belakang tanggalnya bergeser ke 17.
 *
 * Pembuat formatnya dibuat sekali per bahasa, bukan sekali per render. */
const formatHari = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
)

const hariTayang = computed(() =>
  jadwal.value
    ? formatHari.value.format(new Date(`${jadwal.value.tanggal}T00:00:00`))
    : ''
)

/* Jam tayangnya dalam dua zona, dihitung dari satu angka.
 *
 * `JAM_TAYANG` menyimpan jam Korea — itu yang tertulis di halaman SBS —
 * dan WIB-nya dikurangi `selisihWib`. Menyimpan dua tulisan jam sekaligus
 * berarti dua tempat yang harus diubah begitu SBS mengganti jadwalnya.
 *
 * Pengurangan itu tidak pernah memindahkan tanggalnya: selisihnya cuma
 * dua jam, dan tayangannya sore — 18.10 KST jadi 16.10 WIB, hari yang
 * sama. Kalau suatu saat SBS memindahkan jam tayangnya ke dini hari,
 * tanggal di kartunya harus ikut dihitung ulang. */
const duaAngka = (nilai: number) => String(nilai).padStart(2, '0')

const jamWib = computed(
  () => `${jamTayang.jam - selisihWib}.${duaAngka(jamTayang.menit)} WIB`
)

const jamKst = computed(
  () => `${jamTayang.jam}.${duaAngka(jamTayang.menit)} KST`
)

/* Live YouTube, dibaca dari .env lewat runtimeConfig.
 *
 * Alamatnya tidak ditulis di sini supaya mengganti tayangannya cukup
 * mengedit satu baris di .env lalu restart, bukan ikut mengubah halaman
 * yang ikut ter-commit. Yang ditulis juga tidak dibatasi pada satu
 * bentuk: id video polos dan alamat youtube.com lengkap sama-sama
 * dibaca di LivePlayer.vue, jadi hasil salinan tombol Bagikan bisa
 * ditempel apa adanya.
 *
 * Tanpa `trim()` nilai kosong dari .env masih berisi spasi, dan
 * `v-if` di bawah akan menganggapnya terisi — bagiannya tampil dengan
 * kotak yang tidak bisa memutar apa pun. */
const liveYoutube = useRuntimeConfig().public.youtubeLive.trim()

/* Klip tayang: limabelas, tiga yang terlihat sekaligus.
 *
 * Datanya nyata, dari SBS lewat /api/running-man/clips — bukan dummy.
 *
 * Angka ini TIDAK menentukan berapa yang terlihat. Yang terlihat tiga,
 * dan itu diatur lewat bentuk `gulir` pada `PreviewList`: tingginya
 * dibatasi tiga kartu, sisanya digulir di dalam kotaknya. Limabelas
 * masih di bawah jatah `HALAMAN_BERANDA` (20), jadi menaikkannya tidak
 * menambah satu pun permintaan ke SBS.
 *
 * Kenapa tidak tiga saja: bagian ini bukan daftar yang dibaca sampai
 * habis, tapi bagian yang menawarkan tontonan. Tiga memberi contoh
 * yang cukup untuk memutuskan, dan dua belas sisanya menunggu di
 * kotak yang sama — tanpa mendorong bagian live jauh ke bawah.
 *
 * Halaman /running-man/preview memakai daftar yang sama persis dari
 * composable yang sama, jadi berpindah ke sana tidak meminta ulang. */
const JUMLAH_KLIP = 15

const clips = await useRunningManClips(HALAMAN_BERANDA)

/* `computed` karena `clips` reaktif: `.value`-nya berubah sendiri saat
 * urutannya diganti, dan bagian ini harus ikut berubah tanpa setup
 * dijalankan ulang. */
const klipTampil = computed(() => clips.value.slice(0, JUMLAH_KLIP))

/* Urutan ikut dibawa ke halaman daftar, supaya "Lihat lebih banyak" membuka
   halaman yang urutannya sama dengan yang sedang dilihat — bukan selalu
   yang terbaru. */
const urutan = urutanKlip(useRoute().query.urutan)

/* Dua halaman lain di bawah Running Man, sebagai kartu bukan tombol.
 *
 * Semula halaman ini punya dua tombol di tempat yang sama: "Semua
 * detail" dan "Semua episode". Di layar lebar keduanya berbagi lebar
 * 552px untuk tiga kata, dan tombol sebesar itu terbaca sebagai bilah.
 *
 * Bentuknya kartu karena penjelasannya ikut: dengan kalimat penjelas,
 * permukaan yang bisa diketuk jadi masuk akal sebesar itu — bukan
 * tombol raksasa yang isinya cuma judul halaman sebelah.
 *
 * Halaman klip TIDAK punya kartu di sini, dan itu disengaja: daftar
 * klip punya pintunya sendiri di bagian "예고보기" bawah, yaitu tombol
 * "Lihat lebih banyak" yang tujuannya sama persis — `/running-man/preview`
 * dengan urutan yang sedang dibaca. */
const jalan = [
  {
    ke: localePath('running-man-detail'),
    ikon: 'lucide:book-open',
    /* Judulnya menyebut isi, bukan sifat halamannya. "Semua detail"
     * tidak menjelaskan apa pun — detail tentang apa — sedangkan halaman
     * tujuannya berisi tentang acara, anggota, dan statistik. */
    judul: 'Info acara',
    /* Kata "Jadwal" sengaja tidak ada: halaman detail tidak memuat
     * jadwal sama sekali — bagiannya cuma tentang acara, anggota, dan
     * statistik. Menulisnya di sini berarti menjanjikan isi yang tidak
     * ada di halaman tujuan. */
    keterangan: 'Tentang acara, anggota, dan statistik',
    label: ''
  },
  {
    /* Tanpa kartu di sini, daftar episode tidak punya pintu dari
     * beranda sama sekali — navbar bawah tidak punya item ke sana, dan
     * halaman lain hanya menautkan ke atas. Satu-satunya tautan lain
     * yang menyebutnya ada di halaman streaming, dan itu hanya bisa
     * dibuka dari halaman ini juga. */
    ke: localePath('running-man-episode'),
    ikon: 'lucide:list-video',
    judul: 'Semua episode',
    keterangan: 'Daftar episode yang bisa ditonton',
    /* Badge di bawah keterangan, bukan teks yang ditempel di
     * kalimatnya. Sama seperti banner di halaman episode — supaya orang
     * tahu sebelum membuka, bukan sesudah. Warnanya ikut `.badge--info`,
     * jadi dua tempat yang bilang hal yang sama tidak memakai dua warna
     * berbeda. */
    label: 'Subtitle Indonesia'
  }
]
</script>

<template>
  <main class="konten running-man">
    <h1 class="konten__judul">Running Man</h1>

    <!-- Ikon diambil dari data acara, bukan ditulis di sini:
         `acara.meta.jaringan.ikon` sudah berisi `lucide:tv` untuk SBS,
         jadi tampilan dan datanya tidak bisa berbeda. -->
    <p class="konten__sub running-man__sub">
      <Icon
        :name="acara.meta.jaringan.ikon"
        class="running-man__sub-ikon"
        aria-hidden="true"
      />
      Tayang setiap Minggu di SBS.
    </p>

    <!-- Kartu ini bukan tautan dan tidak punya control di dalamnya,
         jadi `aria-hidden` pada mark dan ikon sudah cukup — tidak ada
         yang perlu dibaca orang yang memakai screen reader dari dalam
         kartu, karena h1 di atas sudah menyebut nama acaranya. -->
    <div class="kartu tayang">
      <!-- Mark huruf yang sama dengan yang di navbar dan di slot
           tengah. `aria-hidden` karena h1 di atas sudah menyebut nama
           acaranya; membacakan huruf "R" sekali lagi hanya menambah
           kebisingan. -->
      <span class="tayang__mark" aria-hidden="true">R</span>

      <div class="tayang__isi">
        <!-- Baris pertama: label kecil di kiri, hitung mundurnya di
             kanan.

             Dua-duanya keterangan tentang episode yang sama — yang satu
             bilang "ini yang berikutnya", yang satu bilang "berapa lama
             lagi" — jadi keduanya duduk di baris yang sama, dan ruang
             kosong di kanan label terpakai.

             Baris ini yang dipilih karena cuma baris ini yang muat
             berdua di layar 390px: labelnya 155px dan hitung mundurnya
             sekitar 150px, sedangkan baris tanggal dan baris jam sudah
             memakai 190–200px sendirian. Kalau dipaksa sebaris dengan
             salah satunya, teksnya berhenti terbaca sebagai satu baris.

             `flex-wrap` yang menangani sisanya: di layar yang lebih
             sempit dari 390px, hitung mundurnya turun ke barisnya
             sendiri — bukan meluber keluar kartu. -->
        <div class="tayang__kepala">
          <!-- Label dari `.label` di main.css, sama persis dengan yang
               dipakai di halaman detail dan halaman episode. Bentuk
               hurufnya sama dengan `.bagian__judul` supaya seluruh
               halaman terasa satu keluarga tipografi. -->
          <p class="label tayang__label">Tayang berikutnya</p>

          <AiringCountdown
            v-if="jadwal"
            :tanggal="jadwal.tanggal"
            :jam="jamTayang.jam"
            :menit="jamTayang.menit"
          />
        </div>

        <!-- Nomor episode, bukan tanggal, yang paling besar. Ini satu-
             satunya angka besar di halaman, dan orang yang membuka
             halaman acara lebih sering mencari episode berikutnya
             daripada tanggal lengkapnya.

             `v-if` karena datanya datang dari SBS: kalau permintaannya
             gagal, angka ini hilang dan kartunya menyisakan label dan
             dua fakta di bawahnya — lebih baik daripada "Episode null"
             atau kartu kosong yang terlihat seperti halaman yang belum
             selesai dimuat. -->
        <p v-if="jadwal" class="tayang__episode">Episode {{ jadwal.nomor }}</p>
      </div>

      <!-- Dua fakta tentang tayang berikutnya: hari dan jam. Satu baris
           masing-masing, dengan ikon sebagai penandanya — tidak ada
           label "HARI" dan "JAM" di atas tiap nilai, karena ikonnya
           sudah mengatakan hal yang sama sambil memakan jauh lebih
           sedikit tinggi.

           Di layar sempit daftar ini memakai lebar kartu penuh, mulai
           dari tepi kirinya. Sebelumnya ia menjorok sejajar dengan nomor
           episode, dan itu menyisakan kolom kiri yang kosong di bawah
           mark "R" — kartunya jadi terlihat berongga.

           Di layar lebar barulah ia jadi kolom sendiri di kanan. -->
      <ul class="tayang__jadwal">
        <li v-if="hariTayang" class="tayang__jadwal-butir">
          <Icon name="lucide:calendar-days" class="tayang__ikon" aria-hidden="true" />
          {{ hariTayang }}
        </li>

        <!-- Jam tayangnya dua, dan itu disengaja: waktu Indonesia yang
             dipakai pembacanya lebih dulu, lalu waktu Korea sebagai jam
             aslinya — jam itulah yang tertulis di halaman SBS, dan jam
             itu yang dipakai orang untuk mencocokkan sendiri kalau
             jadwalnya diragukan.

             Titik di antaranya `aria-hidden` supaya pembaca layar tidak
             membacakannya sebagai "titik": dua jam itu sudah menyebut
             zonanya masing-masing, jadi tidak ada yang perlu dijembatani
             dengan suara.

             Keduanya dihitung dari satu angka: `jamTayang` menyimpan jam
             Korea apa adanya dari SBS, dan WIB-nya dikurangi
             `selisihWib`. Lihat `JAM_TAYANG` di useRunningMan.ts. -->
        <li class="tayang__jadwal-butir">
          <Icon name="lucide:clock" class="tayang__ikon" aria-hidden="true" />
          {{ jamWib }}
          <span class="tayang__pemisah" aria-hidden="true">·</span>
          <span class="tayang__jam-asli">{{ jamKst }}</span>
        </li>
      </ul>
    </div>

    <!-- Rekap seperlunya saja: satu angka yang menjawab pertanyaan
         "berapa banyak yang sudah tayang", yang tidak bisa dijawab
         kartu di atas.

         Bukan grid statistik. Angka dalam kotak-kotak besar jadi dasbor,
         dan dasbor bukan tempat orang datang untuk melihat kapan acaranya
         tayang — tapi satu baris kalimat ringan tidak berlebihan. Yang penuh
         sudah ada di halaman detail.

         `v-if` di bawah bukan sekadar hiasan: kalau SBS sedang tidak bisa
         dihubungi, nomornya tidak diketahui dan baris ini hilang
         seluruhnya. Angka cadangan akan tampil sebagai kepastian padahal
         sudah basi — persis masalah yang dibawa angka mati.

         Pill dari `.hitung` di main.css, bukan teks polos: bentuknya
         langsung bilang bahwa ini angka penghitung, bukan kalimat yang
         bisa diklik. -->
    <p v-if="episodeTercetak" class="hitung running-man__rekap">
      <Icon name="lucide:history" class="hitung__ikon" aria-hidden="true" />
      <span class="hitung__angka">{{ episodeTercetak }}</span>
      episode sudah tayang sejak {{ acara.sejak }}
    </p>

    <!-- ===== Halaman lain ======================================== -->

    <!-- Dua pintu ke halaman lain di bawah Running Man. Urutannya
         sudah benar: setelah "tayang lagi kapan", yang paling sering
         ditanyakan adalah "episode mana yang bisa ditonton".

         Keduanya `NuxtLink`, bukan tombol dengan JavaScript — pilihan
         orang ada di URL, dan halamannya bisa menampilkan isi yang
         benar sejak dimuat.

         Tidak ada kartu untuk daftar klip: halaman itu sudah punya
         tombol "Lihat lebih banyak" di bagian bawah, dengan tujuan
         yang sama persis. -->
    <section class="bagian">
      <h2 class="bagian__judul">Jelajahi</h2>

      <ul class="jalan__daftar">
        <li v-for="satu in jalan" :key="satu.judul">
          <NuxtLink :to="satu.ke" class="jalan__kartu">
            <span class="jalan__ikon" aria-hidden="true">
              <Icon :name="satu.ikon" />
            </span>

            <span class="jalan__isi">
              <span class="jalan__judul">{{ satu.judul }}</span>
              <span class="jalan__keterangan">{{ satu.keterangan }}</span>

              <!-- Badge di bawah keterangan, dan hanya kalau kartunya
                   punya. Kartu "Info acara" tidak punya label, jadi
                   badge-nya tidak dirender di sana — bukan dirender
                   kosong. -->
              <span v-if="satu.label" class="badge badge--info jalan__label">
                <Icon name="lucide:languages" class="jalan__label-ikon" aria-hidden="true" />
                {{ satu.label }}
              </span>
            </span>

            <Icon name="lucide:arrow-right" class="jalan__panah" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- ===== Klip tayang ========================================= -->

    <!-- Disembunyikan kalau daftarnya kosong. Larik kosong berarti SBS
         sedang tidak bisa dihubungi atau memang belum punya klip baru,
         dan menampilkan judul dengan isi kosong di bawahnya terlihat
         seperti ada isinya yang belum termuat. -->
    <section v-if="klipTampil.length" class="bagian">
      <h2 class="bagian__judul">{{ t('klip.judul') }}</h2>

      <!-- Tab urutannya dan tombol "lihat semua" sebaris: keduanya
           kendali untuk daftar yang sama, jadi meletakkannya jadi satu
           baris membuat hubungannya terbaca tanpa perlu dibaca. -->
      <div class="pratinjau__alat">
        <PreviewSort />

        <NuxtLink
          :to="localePath({ name: 'running-man-preview', query: { urutan } })"
          class="tombol lebih"
        >
          Lihat semua
        </NuxtLink>
      </div>

      <!-- Bentuk `gulir`: kotaknya setinggi tiga kartu, sisanya digulir
           di dalamnya. Lihat catatan `bentuk` di PreviewList.vue untuk
           kenapa tingginya dibatasi dan kenapa kartu berikutnya
           sengaja mengintip sedikit. -->
      <PreviewList :daftar="klipTampil" bentuk="gulir" />
    </section>

    <!-- ===== Live YouTube ======================================== -->

    <!-- Paling bawah, setelah klip — dan itu bukan kebetulan. Klip
         adalah tontonan yang dipilih sendiri: orang tahu persis apa
         yang dia cari. Live tidak bisa dipilih, hanya ditunggu, dan
         orang yang sedang mencarinya sudah tahu tempatnya. Menaruh
         live di atas klip berarti menaruh tontonan yang tidak bisa
         dipilih di tempat orang sedang membuat pilihan.

         Disembunyikan kalau .env belum diisi NUXT_PUBLIC_YOUTUBE_LIVE,
         sama seperti bagian klip: judul tanpa isi di bawahnya terlihat
         seperti ada sesuatu yang belum termuat. -->
    <section v-if="liveYoutube" class="bagian">
      <h2 class="bagian__judul">Live di YouTube</h2>

      <!-- Alamatnya sudah dibaca di atas; komponen yang mengubahnya
           jadi id video. Tayangan mulai sendiri begitu halaman ini
           terbuka, jadi tidak ada tombol untuk ditekan. Catatan soal
           suaranya ikut di komponen itu, karena yang bicara tentang
           player adalah player-nya sendiri.

           Batas lebarnya dipasang di komponennya, bukan di
           bagiannya. Kalau bagiannya yang dibatasi, judul "Live di
           YouTube" ikut terdorong ke tengah dan berhenti segaris
           dengan judul bagian lain di halaman ini — padahal yang
           perlu dikunci lebarnya cuma videonya. -->
      <LivePlayer
        :sumber="liveYoutube"
        judul="Live Running Man di YouTube"
        class="live-bagian"
      />
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue, (search)/search.vue, dan
   (profile)/profile.vue. */
.running-man {
  padding-bottom: 10rem;
}

/* --- Kartu tayang -------------------------------------------- */

/* Grid tiga kolom di layar lebar: mark, episode, jadwal.
 *
 * Di layar sempit jadwal turun ke baris kedua, jadi kolom kedua
 * (`grid-column` di bawah) yang menahannya. Kalau tidak ditulis
 * eksplisit, anak ketiga akan mendarat di kolom pertama baris kedua —
 * tepat di bawah mark — dan tanggalnya jadi tampak dimiliki mark.
 *
 * `flex-wrap` sengaja tidak dipakai. Kartu ini hanya satu, jadi
 * tidak ada layout sempit yang perlu dilindungi.
 *
 * Padding dan jaraknya memakai `clamp`, bukan angka tetap. Di 360px
 * kartu ini kehilangan hampir seperempat lebar layarnya: padding
 * 1.75rem di kiri dan kanan memakan 56px, dan mark 4rem beserta
 * jaraknya memakan 84px lagi, sehingga yang tersisa buat tanggal
 * dan jam cuma sekitar 172px. Yang dikecilkan di layar sempit
 * hanya ruang kosongnya — isi kartunya tetap sama, dan di layar
 * lebar angkanya tidak berubah. */
.tayang {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(0.875rem, 3.5vw, 1.25rem);

  margin-top: 2rem;
  padding: clamp(1.125rem, 4vw, 1.75rem);

  /* Garis aksen setebal 3px di tepi atas.
   *
   * Penanda ini yang membuat kartu ini terbaca sebagai "yang
   * berikutnya terjadi", bukan sekadar informasi. Tapi penanda ini bukan
   * latar penuh: latar cyan memenuhi separuh kartu dan berubah
   * jadi blok warna yang bersaing dengan angka episode. Garis tipis
   * memberi tanda yang sama dengan bobot yang lebih rendah. */
  border-top: 3px solid var(--aksen-indikator);
}

/* Kartu ini tidak bisa diklik ke mana pun, tapi `.kartu` dari
 * main.css mengubah warna garis saat hover. Hover itu sinyal "ini
 * punya tujuan", dan di sini tidak ada tujuan — kartu bukan tautan,
 * dan yang menuju halaman lain adalah bagian Jelajahi di bawahnya. */
.tayang:hover {
  border-top-color: var(--aksen-indikator);
  border-right-color: var(--garis-halus);
  border-bottom-color: var(--garis-halus);
  border-left-color: var(--garis-halus);
}

/* Mark huruf. Bentuk dan tipografinya sama persis dengan
 * `.acara__mark` di halaman detail, cuma lebih kecil supaya isinya
 * tetap yang mendominasi kartu di layar sempit.
 *
 * `line-height: 1` wajib, sama seperti di SlotMark: elemen induk
 * mewarisi line-height 1.6 dari body, dan tanpa baris ini huruf
 * duduk beberapa piksel lebih rendah dari tengah kotaknya. */
.tayang__mark {
  display: flex;
  align-items: center;
  justify-content: center;

  width: clamp(3.25rem, 14vw, 4rem);
  height: clamp(3.25rem, 14vw, 4rem);
  border-radius: var(--radius-besar);

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  font-size: clamp(1.625rem, 7vw, 2rem);
  line-height: 1;
  color: var(--teks-aksen);
}

/* `min-width: 0` penting: tanpa itu, tanggal yang panjang menahan
 * kolom grid dan mark terdorong ke luar kartu. */
.tayang__isi {
  min-width: 0;
}

.tayang__episode {
  margin-top: 0.25rem;
  font-size: clamp(1.5rem, 6vw, 1.875rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--teks-aksen);
  /* Angka ini tidak pernah berubah bentuknya, tapi tabular-nums
     tetap dipakai supaya posisinya tidak bergeser kalau nanti diganti
     tiga angka atau dihapus jadi nol. */
  font-variant-numeric: tabular-nums;
}

/* --- Hitung mundur -------------------------------------------- */

/* Baris pertama kartu: label di kiri, hitung mundurnya di kanan.
 *
 * `space-between` yang mendorong hitung mundurnya ke tepi kanan, dan
 * `flex-wrap` yang menurunkannya ke baris sendiri di layar yang lebih
 * sempit dari 390px. Saat itu terjadi, yang tersisa di barisnya cuma
 * hitung mundurnya — dan `space-between` dengan satu anak menaruhnya di
 * KIRI, bukan menggantung di kanan baris yang sendirian.
 *
 * `align-items: baseline`, bukan `center`: keduanya teks, dan dua teks
 * yang duduk sebaris harus bertumpu pada garis yang sama — dengan
 * `center` yang satu terlihat naik sedikit dari yang lain. */
.tayang__kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
}

/* --- Jadwal tayang -------------------------------------------- */

/* Tiga baris fakta: hari, jam, dan sisa waktunya.
 *
 * Di layar sempit daftar ini memakai LEBAR KARTU PENUH — `grid-column`
 * 1 sampai -1, bukan kolom kedua. Sebelumnya ia sejajar dengan nomor
 * episode, dan hasilnya kolom kiri di bawah mark "R" menganggur kosong
 * sementara sisi kanannya berisi empat baris. Lebar penuh membuat
 * kartunya terbaca sebagai dua bagian: kepala di atas, fakta di bawah.
 *
 * Jarak antar barisnya rapat, dan lebih rapat daripada jarak di
 * halaman lain: tiga baris ini dibaca sebagai satu kelompok, bukan
 * sebagai daftar yang butirnya perlu dipisah-pisah. */
.tayang__jadwal {
  grid-column: 1 / -1;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

/* Satu fakta, satu baris: ikon lalu nilainya.
 *
 * Tidak ada label huruf besar di atas nilainya, dan itu keputusan
 * sesudah melihatnya di layar sempit: "HARI" di atas tanggal dan "JAM"
 * di atas jam menambah dua baris tinggi untuk mengatakan hal yang sudah
 * dikatakan ikonnya. Yang tersisa sekarang lima baris untuk seluruh
 * kartu, dari yang tadinya tujuh.
 *
 * `line-height: 1.4`, bukan 1.6 warisan body: baris-baris ini dibaca
 * sebagai daftar yang rapat, bukan sebagai paragraf. */
.tayang__jadwal-butir {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  min-width: 0;

  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Titik pemisah antara jam WIB dan jam KST. Warnanya mengikuti teks
 * redup di sebelahnya, bukan warna utama — ia cuma pemisah, bukan
 * nilai. */
.tayang__pemisah {
  color: var(--teks-lembut);
}

/* Jam aslinya (KST), menyusul di sebelah jam WIB.
 *
 * Satu tingkat lebih kecil dan lebih redup dari nilai di sebelahnya, dan
 * itu memang yang diinginkan: waktu Indonesia yang dipakai pembacanya,
 * waktu Korea cuma keterangan tambahan — kalau keduanya sama besar, dua
 * jam berbeda di satu baris terbaca seperti dua jadwal yang berbeda. */
.tayang__jam-asli {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--teks-lembut);
}

/* Di layar lebar fakta-fakta itu jadi kolom sendiri di kanan, dan
 * dipisahkan garis rambut dari nomor episode.
 *
 * Kolom teksnya ikut melebar karena `minmax(0, 1fr)`, dan jadwal ikut
 * diamankan sampai 18rem — angka episode tetap sebesar di layar
 * sempit, dan tanggal punya tempatnya sendiri.
 *
 * `48rem` adalah breakpoint yang sudah dipakai proyek ini: di bawah
 * itu tiga kolom ini tidak muat tanpa tanggal pecah jadi dua baris,
 * dan tanggal yang pecah justru yang paling sulit dibaca. */
@media (min-width: 48rem) {
  .tayang {
    grid-template-columns: auto minmax(0, 1fr) minmax(13rem, 18rem);
    gap: 0 1.5rem;
  }

  .tayang__jadwal {
    grid-column: 3;

    gap: 0.75rem;

    padding-left: 1.5rem;
    border-left: 1px solid var(--garis-halus);
  }
}

/* --- Rekap ---------------------------------------------------- */

/* Tepat di bawah kartu tayang, jadi jaraknya cukup dekat untuk
 * terbaca sebagai keterangan dari kartu itu — bukan sebagai bagian
 * tersendiri yang kebetulan terpisah. */
.running-man__rekap {
  margin-top: 1rem;
}

/* --- Kartu halaman lain --------------------------------------- */

/* Baris penuh di layar sempit dan di tablet, dua kolom di laptop.
 *
 * `auto-fit`, bukan jumlah kolom tetap: isi daftar ini bisa dua atau
 * tiga, dan jumlah tetap menyisakan sel kosong yang menggantung di
 * ujung baris begitu isinya berkurang — tanpa error apa pun, hanya
 * kartunya yang berhenti setengah jalan.
 *
 * Satu breakpoint, bukan tiga. Di tablet (48rem–64rem) kartu sempit
 * hanya menghasilkan keterangan yang pecah tiga baris, dan satu kartu
 * yang menggantung sendirian di baris kedua — dua-duanya lebih buruk
 * daripada baris penuh yang terbaca sebagai daftar menu. */
.jalan__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 64rem) {
  .jalan__daftar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.75rem;
  }
}

/* Permukaannya ditulis sendiri, bukan memakai `.kartu`.
 *
 * `.kartu` menyertakan `:hover` yang menebalkan garis tanpa memberi
 * tahu arahnya. Di sini hover-nya sudah punya arti sendiri: kartu ini
 * menuju halaman lain, dan arahnya sudah jelas dari panah di kanan. */
.jalan__kartu {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.875rem;

  padding: 1rem 1.125rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  color: inherit;
  text-decoration: none;

  transition: background var(--transisi), border-color var(--transisi);
}

.jalan__kartu:hover {
  background: var(--latar-naik-3);
  border-color: var(--garis-sedang);
}

/* Ikon dalam kotak, supaya kartu ini punya titik berat di kiri dan
 * tidak terasa seperti baris teks biasa yang bisa diklik. */
.jalan__ikon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sedang);

  background: var(--aksen-latar);
  color: var(--teks-aksen);

  font-size: 1.125rem;
}

.jalan__isi {
  display: block;
  min-width: 0;
}

.jalan__judul {
  display: block;

  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--teks-utama);
}

.jalan__keterangan {
  display: block;

  margin-top: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}

/* Badge di bawah keterangan. Jaraknya milik badge ini, bukan milik
 * keterangan — kartu yang tidak punya label ("Info acara") tidak boleh
 * ikut berjarak seolah-olah ada badge yang disembunyikan. */
.jalan__label {
  margin-top: 0.375rem;
}

/* Ikon ikut ukuran teks badge-nya. Kelasnya diletakkan langsung di
 * `<Icon>`, bukan lewat `:deep(svg)` — lihat catatan yang sama di
 * `.meta__ikon` di main.css. */
.jalan__label-ikon {
  font-size: 0.875rem;
}

/* Panah di kanan baris. Redup sampai hover — di daftar tiga baris,
 * tiga panah aksen sekaligus lebih berisik daripada menunjuk. */
.jalan__panah {
  font-size: 1rem;
  color: var(--teks-lembut);
  transition: color var(--transisi), transform var(--transisi);
}

.jalan__kartu:hover .jalan__panah {
  color: var(--teks-aksen);
  transform: translateX(2px);
}

/* --- Pratinjau ------------------------------------------------ */

/* Baris tempat tab urutan dan tombol "lihat semua" berdiri bersama.
 *
 * `flex-wrap` bukan opsional. Di 390px keduanya memang tidak muat: tabnya
 * 258px, tombolnya 102px, dan ruang yang tersisa di dalam `.konten` cuma
 * 358px. Tanpa wrap, "sebaris" berakhir jadi tombol yang meluber keluar
 * kotak konten — bukan tombol yang pindah tempat.
 *
 * `margin-left: auto` di `.lebih` yang menempelkannya ke kanan, dan
 * tetap bekerja di dua keadaan: sebaris kalau ruang cukup, atau sendirian
 * di baris bawah kalau tidak. */
.pratinjau__alat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
}

/* Tab urutannya bawa `margin-top: 0.75rem` miliknya sendiri dari
 * `PreviewSort.vue`. Di dalam baris flex itu pilnya turun dan tombolnya
 * terlihat lebih tinggi, jadi maraknya dinetralkan di sini. */
.pratinjau__alat > .urutan {
  margin-top: 0;
}

/* Tombol "lihat semua".
 *
 * Bentuknya sengaja sama persis dengan pil tab di `.urutan__butir` —
 * latar, border, radius, padding, ukuran huruf. Alasannya ukurannya harus
 * sama: kalau lebih besar, barisnya jadi tidak rata, dan kalau hanya
 * warnanya yang beda, tombolnya terbaca sebagai tab urutan keempat.
 *
 * Karena itu nilainya DISALIN dari `.urutan__butir`, bukan diwarisi.
 * Kalau salah satu berubah, yang lain wajib ikut — dua salinan tidak
 * boleh diam-diam berbeda. */
.lebih {
  margin-left: auto;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: 999px;
  padding: 0.375rem 0.875rem;

  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);

  /* Daftar transisinya ditulis lengkap, bukan `transform` saja.
     `.tombol` di main.css sudah punya daftar sendiri, dan menimpanya
     dengan satu properti berarti daftar itu ikut hilang — tombol jadi
     kehilangan perubahan warna yang memang kerjaannya. */
  transition:
    background var(--transisi),
    border-color var(--transisi),
    color var(--transisi),
    transform var(--transisi);
}

.lebih:hover {
  background: var(--latar-sorot);
  color: var(--teks-utama);
}

/* Umpan balik saat ditekan.
 *
 * Tanpa itu, di layar sentuh tombolnya terasa tidak ditekan sama
 * sekali: tekanannya baru terlihat setelah halaman berpindah, dan di
 * koneksi lambat itu bisa beberapa detik. Satu piksel ke bawah cukup —
 * yang dicari bukan gerakan, tapi bukti tombol itu memang ditekan. */
.lebih:active {
  transform: translateY(1px);
}

/* --- Ikon ---------------------------------------------------- */

/* Ikon ikut ukuran teksnya, supaya tidak terlihat lebih besar dari
 * kata di sebelahnya.
 *
 * Kelasnya diletakkan langsung di `<Icon>`, bukan lewat
 * `:deep(svg)`. Bentuk `:deep(svg)` itu tidak pernah cocok: @nuxt/icon
 * merender ikon sebagai `<span class="iconify">` dan menggambarnya
 * lewat mask CSS, bukan elemen `<svg>`. Lihat catatan yang sama di
 * `.meta__ikon` di main.css. */
.tayang__ikon {
  font-size: 1rem;
}

/* --- Live ----------------------------------------------------- */

/* Video live dikunci lebarnya di layar lebar, sama seperti player
 * di halaman streaming dan di halaman satu klip.
 *
 * Tanpa ini ia mengikuti `--lebar-konten` (72rem = 1152px) dan
 * rasio 16:9 menjadikannya setinggi 648px — setengah tinggi monitor
 * untuk satu video live.
 *
 * Batasnya `min()` dengan dua bagian, dan TIGA player di proyek ini
 * memakai rumus yang sama: yang di sini, `.streaming__layar` di
 * `running-man/episode/streaming.vue`, dan `.clip__pemutar` di
 * `running-man/preview/[id].vue`. Kalau salah satunya diubah,
 * ketiganya harus ikut — kalau tidak, tinggi pemutar melompat saat
 * orang berpindah halaman.
 *
 * `56rem` batas atas, supaya di monitor besar video tidak ikut melar.
 * `55vh` yang menentukan di layar pendek: batas LEBAR saja tidak
 * cukup, karena di laptop 1366x768 pemutar setinggi 504px sudah
 * memenuhi layar setelah header, judul, dan jarak atas ikut dihitung.
 *
 * Rasio 16/9 dipakai untuk menerjemahkan batas TINGGI jadi batas
 * LEBAR — `aspect-ratio` menghitung tinggi dari lebar, jadi
 * membatasi tinggi langsung akan mematahkan rasionya.
 *
 * Batas dan pemusatannya di sini, bukan di `LivePlayer`: `.live__layar`
 * selalu mengikuti lebar induknya, jadi yang menentukan lebarnya
 * adalah halaman yang memakai komponen itu. Dipasang pada KOMPONENNYA
 * dan bukan pada `<section>`-nya, supaya judul bagian tetap segaris
 * dengan judul bagian lain di halaman ini. */
@media (min-width: 48rem) {
  .live-bagian {
    max-width: min(56rem, calc(55vh * 16 / 9));
    margin-inline: auto;
  }
}

/* --- Subjudul ------------------------------------------------- */

/* Baris, bukan paragraf. `.konten__sub` dari main.css mengatur jarak
 * atas dan warnanya, tapi bukan tata letaknya — jadi ikonnya butuh
 * `flex` supaya duduk sebaris dengan kalimat, bukan turun ke baris
 * sendiri. */
.running-man__sub {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.running-man__sub-ikon {
  font-size: 1rem;
}

/* --- Gerak ---------------------------------------------------- */

/* Halaman ini tidak punya gerak yang wajib diputar. Transisi di atas
 * hanya memberi tahu apa yang berubah, jadi matikan kalau pemakai
 * meminta. */
@media (prefers-reduced-motion: reduce) {
  .lebih,
  .jalan__kartu,
  .jalan__panah {
    transition: none;
  }
}
</style>