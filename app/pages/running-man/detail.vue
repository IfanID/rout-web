<script setup lang="ts">
/* Informasi acara Running Man: apa acaranya, kapan tayang, dan
 * angkanya.
 *
 *   /running-man              beranda — kapan tayang
 *   /running-man/detail       halaman ini
 *
 * Yang tidak ada di sini: daftar episode. Itu menjawab pertanyaan
 * lain — "episode mana yang sudah tayang" — dan punya halamannya
 * sendiri di ./episode/index.vue. Dicampur, halaman yang isinya
 * menjelaskan acara terasa seperti halaman arsip.
 *
 * Yang ADA di sini justru data anggota cast — nama Korea, foto,
 * riwayat karier, dan penanda aktif — karena halaman ini satu-satunya
 * yang memakainya. Teksnya bukan di sini, tapi di blok `anggota` pada
 * berkas locale. Alasan lengkapnya ada di blok `--- Data anggota cast`
 * di bawah.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Running Man". Nama
 * acara dari Korea Selatan itu bukan brand Rout dan bukan teks yang
 * perlu diterjemahkan, sama seperti di useMiddleSlot.ts.
 *
 * Beralamat `/running-man/detail` dan bernama route
 * `running-man-detail`. Keduanya berbeda: URL membaca nama folder apa
 * adanya, sedangkan nama route menyambung tiap segmen dengan tanda
 * hubung. Folder `running-man/` di atasnya TIDAK berkurung — itulah
 * yang membuat `/running-man/detail` terbentuk.
 *
 * Tetesan navbar di halaman ini diwarisi lewat path, karena semuanya
 * berada di bawah `/running-man/`. Karena itu Running Man tidak
 * memakai kolom `dalam` di useMiddleSlot.ts — lihat catatan fungsi
 * `milik` di BottomNav.vue. */

const { t } = useI18n()

const { acara, tentang, statistik } = useRunningMan()

/* --- Data anggota cast -----------------------------------------
 *
 * Data ini ditulis DI SINI, bukan di berkas terpisah, karena halaman
 * ini satu-satunya yang memakainya. Berkas terpisah baru berguna
 * begitu ada pemakai kedua; selama belum ada, ia cuma menambah satu
 * berkas yang harus dibuka untuk memahami halaman ini.
 *
 * Yang TIDAK ikut ke sini adalah teksnya. Sapaan, deskripsi, dan
 * riwayat karier terjemahan tetap ada di
 * app/i18n/locales/<kode>.json pada anggota.orang.<kunci>, dibaca
 * lewat t() di bawah. Itu aturan AGENTS.md: teks yang ikut bahasa
 * pemakai tinggal di berkas locale.
 *
 * Sumber: https://m.programs.sbs.co.kr/enter/runningman/cast/67779
 * Dibaca per 14 Oktober 2026 lewat
 * apis.sbs.co.kr/program-api/1.0/cast/runningman/67779.
 *
 * Yang ada di sini hanya data yang tidak diterjemahkan: nama Korea,
 * foto, riwayat karier, dan penanda aktif. */

interface Anggota {
  /** Kunci untuk `anggota.orang.<kunci>` di file locale. */
  kunci: string
  /** Nama Korea, apa adanya dari SBS. */
  nama: string
  /**
   * Nama latin, untuk pembaca yang tidak bisa baca Korea.
   *
   * BUKAN data SBS. Diambil dari judul artikel Wikipedia Inggris,
   * yang memakai romanisasi baku. Dua yang mudah keliru:
   *
   * - 지석진 ditulis "Jee Seok-jin", bukan "Ji Seok-jin".
   * - 하하 nama aslinya Ha Dong-hoon; "Haha" nama panggungnya.
   *
   * Jangan diterjemahkan nama dari Korea. Terjemahan itu bukan
   * nama orangnya, cuma arti kata yang kebetulan sepadan.
   */
  latin: string
  /**
   * Riwayat karier, satu elemen per baris. Tetap bahasa Korea.
   *
   * Judul acara dibungkus tanda kutip “ ”. SBS menuliskannya dengan
   * kurung siku — `2010년~ SBS <런닝맨>` — dan kurung itu bukan teks,
   * cuma penanda. Kalau dibiarkan apa adanya, Vue akan memperlakukannya
   * sebagai tag HTML dan halaman gagal render; kalau hanya di-escape,
   * yang tampil justru kurung siku literalnya. Tanda kutip dipakai
   * karena itu yang lazim untuk judul acara, dan bentuk aslinya sudah
   * hilang saat teksnya diambil dari `castdsc` yang berupa HTML.
   */
  karier: string[]
  /** URL foto dari CDN SBS. */
  foto: string
  /**
   * Masih jadi anggota Running Man per Oktober 2026.
   *
   * BUKAN data SBS. Halaman cast SBS tidak menandai status siapa pun,
   * jadi nilainya diambil dari laporan media Korea (Naver Entertainment,
   * 14 Oktober 2026) yang menyebut susunan tujuh orang: 유재석, 지석진,
   * 김종국, 하하, 송지효, 양세찬, 지예은.
   *
   * Kenapa perlu ada: SBS tidak pernah memperbarui halamannya. 이광수
   * dan 전소민 masih tercantum di sana padahal sudah keluar, sementara
   * 지예은 yang bergabung sejak 2024 tidak tercantum sama sekali.
   * Tanpa penanda ini, 김종국 dan 송지효 akan terbaca sebagai anggota
   * yang sudah tidak aktif — padahal keduanya masih tayang.
   */
  aktif: boolean
}

const ANGGOTA: Anggota[] = [
  {
    kunci: "yuseok",
    nama: "유재석",
    latin: "Yoo Jae-suk",
    karier: [
      "2019년~ MBC “놀면 뭐하니?”",
      "2018년~ tvN “유 퀴즈 온 더 블럭”",
      "2010년~ SBS “런닝맨”",
      "2018년 SBS “미추리 8-1000”",
      "2015년 JTBC “투유 프로젝트 - 슈가맨”",
      "2015년 SBS “동상이몽, 괜찮아 괜찮아”",
      "2008년 SBS “일요일이 좋다 - 패밀리가 떴다”",
      "2006년 MBC “무한도전”",
      "2006년 SBS “X맨 일요일이 좋다”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/BfC1610675893269-300-300.jpg",
    aktif: true
  },
  {
    kunci: "jiseokjin",
    nama: "지석진",
    latin: "Jee Seok-jin",
    karier: [
      "2010년~ SBS “런닝맨”",
      "2018년 채널A “팔아야 귀국”",
      "2016년 라디오 MBC FM4U “2시의 데이트 지석진입니다”",
      "2005년 KBS2 “해피선데이 - 여걸식스”",
      "2004년 KBS2 “스타골든벨”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/KNY1610675946066-300-300.jpg",
    aktif: true
  },
  {
    kunci: "gimjongguk",
    nama: "김종국",
    latin: "Kim Jong-kook",
    karier: [
      "2016년~ SBS “미운 우리 새끼”",
      "2010년~ SBS “런닝맨”",
      "2020년 KBS2 “날아라 슛돌이 - 뉴 비기닝”",
      "2017년 tvN, Mnet “너의 목소리가 보여”",
      "2012년 KBS2 “위기탈출 넘버원”",
      "2008년 SBS “일요일이 좋다 - 패밀리가 떴다”",
      "2006년 SBS “X맨 일요일이 좋다”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/Amn1610675998137-300-300.jpg",
    aktif: true
  },
  {
    kunci: "haha",
    nama: "하하",
    latin: "Haha (Ha Dong-hoon)",
    karier: [
      "2019년~ 채널A “아이콘택트”",
      "2010년~ SBS “런닝맨”",
      "2020년 E채널 “찐한친구”",
      "2019년 SKY, 라이프타임채널 “위플레이”",
      "2017년 Mnet “고등래퍼”",
      "2006년 MBC “무한도전”",
      "2006년 SBS “X맨 일요일이 좋다”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/biu1610676047908-300-300.jpg",
    aktif: true
  },
  {
    kunci: "songjihyo",
    nama: "송지효",
    latin: "Song Ji-hyo",
    karier: [
      "2010년~ SBS “런닝맨”",
      "2020년 드라마 JTBC “우리, 사랑했을까”",
      "2020년 영화 “침입자”",
      "2018년 드라마 KBS2 “러블리 호러블리”",
      "2016년 드라마 JTBC “이번 주 아내가 바람을 핍니다”",
      "2014년 드라마 tvN “응급남녀”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/NXL1610676103329-300-300.jpg",
    aktif: true
  },
  {
    kunci: "igwangsu",
    nama: "이광수",
    latin: "Lee Kwang-soo",
    karier: [
      "2010년~ SBS “런닝맨”",
      "2019년 영화 “나의 특별한 형제”",
      "2018년 영화 “탐정: 리턴즈”",
      "2018년 드라마 tvN “라이브”",
      "2016년 드라마 tvN “디어 마이 프렌즈”",
      "2016년 시트콤 KBS2 “마음의 소리”",
      "2014년 드라마 SBS “괜찮아 사랑이야”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/Emx1610676161738-300-300.jpg",
    aktif: false
  },
  {
    kunci: "yangsechan",
    nama: "양세찬",
    latin: "Yang Se-chan",
    karier: [
      "2017년~ SBS “런닝맨”",
      "2011년~ tvN “코미디빅리그”",
      "2020년 KBS2 “날아라 슛돌이 - 뉴 비기닝”",
      "2019년 tvN “풀 뜯어먹는 소리 3 - 대농원정대”",
      "2019년 MBC “호구의 연애”",
      "2018년 채널A “팔아야 귀국”",
      "2003년 SBS “웃찾사”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/e381610676386804-300-300.jpg",
    aktif: true
  },
  {
    kunci: "jeonsomin",
    nama: "전소민",
    latin: "Jeon So-min",
    karier: [
      "2017년~ SBS “런닝맨”",
      "2018년 드라마 tvN “톱스타 유백이”",
      "2016년 드라마 드라맥스 “1%의 어떤 것”",
      "2014년 드라마 SBS “끝없는 사랑”",
      "2013년 드라마 MBC “오로라 공주”",
    ],
    foto: "https://img2.sbs.co.kr/img/sbs_cms/WE/2021/01/15/86o1610676342528-300-300.jpg",
    aktif: false
  },
  {
    kunci: "jiyeoun",
    nama: "지예은",
    latin: "Ji Ye-eun",
    /* Datanya diambil dari Wikipedia Korea, bukan dari SBS.
     *
     * Delapan anggota di atas semuanya dari halaman cast SBS.
     * 지예은 tidak ada di sana sama sekali — dia baru bergabung pada
     * Desember 2024, sementara halaman itu sudah lama tidak disentuh.
     *
     * Bedanya nyata. SBS menulis sapaan dan deskripsi dengan nada
     * sindiran khas acara, dan itu ikut dialirkan ke terjemahan. Dari
     * Wikipedia tidak ada kalimat seperti itu — hanya daftar acara.
     * Meniru nada SBS berarti mengarang isi candaannya sendiri.
     *
     * Jadi entri ini memakai sapaan dan deskripsi yang biasa saja, bukan
     * candaan. Semuanya diambil dari paragraf pertama dan bagian
     * pendidikan di Wikipedia, bukan dari ingatan. Kalau nanti ditambah
     * yang tidak ada di sana, biarkan kosong. */
    karier: [
      "2024년~ SBS “런닝맨”",
      "2022년~ SNL 코리아 “SNL 코리아 리부트 시즌 3”",
      "2024년 쿠팡플레이 “직장인들”",
      "2025년 쿠팡플레이 “직장인들 시즌 3”",
      "2024년~ 넷플릭스 “대환장 기안장”",
      "2025년 KBS2 “크레이지 리치 코리안”",
      "2026년~ TV CHOSUN “왕은 무얼 자셨는가”",
      "2019년 MBC “최신유행 프로그램 2”",
      "2023년 MBC “라디오스타”"
    ],
    /* Foto dari Wikimedia Commons, bukan dari CDN SBS. Bedanya bukan
     * soal teknis: gambar Commons berlisensi bebas, sedangkan foto di
     * CDN SBS tidak punya lisensi yang jelas untuk dipakai ulang.
     * Foto di Commons juga satu-satunya yang tersedia di sini. */
    foto: "https://upload.wikimedia.org/wikipedia/commons/3/34/Ji_Ye-eun.jpg",
    aktif: true
  }
]

/* Daftar anggota cast beserta teksnya dalam bahasa yang sedang dibaca.
 *
 * Sapaan, deskripsi, dan karier semuanya dibaca dari locale, jadi ikut
 * bahasa pemakai. Yang tetap dari blok data di atas hanya nama Korea,
 * foto, dan flag `aktif`.
 *
 * Kenapa daftar disimpan sebagai OBJEK bernomor dan bukan larik:
 * `t()` mengembalikan string, sedangkan larik akan ikut diserialisasi
 * dan tampil sebagai teks. `tm()` memang bisa mengembalikan larik,
 * tapi hanya kalau pesan tidak lewat message compiler — dan di proyek
 * ini i18n memakai message compiler, sehingga `tm()` mengembalikan
 * linked list internal `{ type, start, end, body }`. Kalau objek itu
 * langsung dirender, yang tampil bukan teksnya melainkan JSON-nya.
 *
 * Objek bernomor menutup kedua masalah sekaligus: `t()` tetap
 * dipakai, jadi hasilnya string apa adanya di mode apa pun.
 *
 * Untuk apa `jumlah`: barisnya harus dihitung sebelum dirender, dan
 * jumlahnya bisa berbeda antar bahasa kalau ada terjemahan yang belum
 * lengkap. Yang dirender adalah `n` dari 1 sampai `jumlah`. */
/* Riwayat karier diurutkan dari yang terbaru.
 *
 * Urutan dari SBS tidak perlu menurun. 유재석 dimulai dari 2019, lalu
 * 2018, lalu 2010, lalu kembali lagi ke 2018 — itu urutan yang mereka
 * pakai di halaman mereka, bukan urutan waktu. Ditampilkan 그대로
 * berarti karier terbaca acak.
 *
 * Tahun dibaca dari empat digit pertama baris. Kalau sebuah baris
 * ternyata tidak punya tahun, ia dianggap paling lama dan tidak
 * menggeser yang lain — lebih baik begitu daripada hilang.
 *
 * `Array.prototype.sort` sudah stabil di JS modern, jadi beberapa baris
 * dengan tahun yang sama — `2006 SBS` dan `2006 MBC` pada 유재석 —
 * tetap urutnya seperti aslinya. */
function urutTahun(baris: string[]) {
  const tahun = (s: string) => Number(s.match(/(\d{4})/)?.[1] ?? 0)
  return [...baris].sort((a, b) => tahun(b) - tahun(a))
}

const anggota = ANGGOTA.map(satu => {
  const dasar = `anggota.orang.${satu.kunci}`

  /* Kunci yang hilang menghasilkan string berisi kunci itu sendiri,
   * jadi dibandingkan dengan bentuknya — bukan dengan string kosong,
   * karena string kosong yang sah bisa berarti "sengaja tidak ada". */
  const baca = (bidang: string, nomor: number) => {
    const kunci = `${dasar}.${bidang}.${nomor}`
    const nilai = t(kunci)
    return nilai === kunci ? '' : nilai
  }

  /* Lampiran dipisah karena bentuknya berbeda: deskripsi dan karier
   * ada di locale, sedangkan `karier` di blok data dipakai kalau
   * locale-nya belum diisi — supaya halaman tidak pernah kosong
   * meskipun ada satu bahasa yang belum dikerjakan. */
  const lampiran = (bidang: string, bawaan: string[]) => {
    const hasil: string[] = []
    for (let n = 1; ; n++) {
      const baris = baca(bidang, n)
      if (!baris) break
      hasil.push(baris)
    }
    return hasil.length ? hasil : bawaan
  }

  const sapaanKunci = `${dasar}.sapaan`
  const sapaan = t(sapaanKunci)

  return {
    ...satu,
    sapaan: sapaan === sapaanKunci ? '' : sapaan,
    deskripsi: lampiran('deskripsi', []),
    karier: urutTahun(lampiran('karier', satu.karier))
  }
})
const localePath = useLocalePath()

/** Batas baris karier yang tampil terbuka tanpa diklik.
 *
 *  Sembilan anggota di halaman ini punya tujuh sampai sembilan baris
 *  masing-masing. Semuanya dibuka sekaligus menambah 62 baris daftar
 *  ke halaman yang isinya sebenarnya cuma pengenalan orang. Riwayat
 *  karier memang ada untuk dibaca kalau memang dicari, bukan untuk
 *  dilewati lebih dulu.
 *
 *  Yang sudah pendek tetap terbuka — memaksa orang klik untuk melihat
 *  tiga baris terasa lebihIAF membosankan daripada menampilkannya. */
const BATAS_KARIER = 4
</script>

<template>
  <main class="konten detail">
    <!-- Kembali ke beranda. Satu-satunya tautan di halaman ini.

         Berdiri di atas judul, bukan di bawahnya: tuannya kembali ke
         beranda, jadi posisinya paling dekat dengan tempat orang
         pertama kali melihat halaman ini. -->
    <NuxtLink :to="localePath('running-man')" class="detail__kembali">
      <Icon name="lucide:arrow-left" class="detail__kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <!-- ===== Kartu acara ======================================= -->

    <!-- Kartu ini sekaligus jadi heading halaman. Dulu ada `h1`
         "Running Man" di atasnya, tapi isinya mengulang kartu — dan
         subjudulnya menyebut "Jadwal tayang" yang sudah dihapus.
         Satu nama, satu tempat. -->
    <section class="kartu acara">
      <!-- Mark huruf, belum ada poster resmi. `aria-hidden` karena
           nama acara sudah jadi heading beberapa baris di bawah —
           membacakannya sekali lagi hanya menambah kebisingan. -->
      <span class="acara__mark" aria-hidden="true">{{ acara.huruf }}</span>

      <div class="acara__data">
        <!-- Heading halaman. Nama yang dikenal orang dipakai lebih
             dulu, karena itu yang dicari pembaca; nama Korea disimpan
             sebagai baris kecil di bawahnya. -->
        <h1 class="acara__nama">Running Man</h1>
        <p class="acara__nama-asli">{{ acara.namaAsli }}</p>
        <p class="acara__jenis">{{ acara.jenis }}</p>

        <!-- Status "Tayang" memakai warna status, bukan aksen. "Tayang"
             itu kondisi acara, bukan hiasan, dan warna status sudah
             ada persis untuk ini.

             Badge kedua sengaja tidak ada. Kalau suatu saat butuh dua
             tanda sekaligus, warna kedua bisa dipakai tanpa membuat
             kelas baru. -->
        <div class="acara__tanda">
          <span class="badge badge--sukses">{{ acara.status }}</span>
        </div>
      </div>

      <ul class="meta">
        <li v-for="(satu, id) in acara.meta" :key="id" class="meta__butir">
          <Icon :name="satu.ikon" class="meta__ikon" aria-hidden="true" />
          {{ satu.nilai }}
        </li>
      </ul>
    </section>

    <!-- ===== Tentang acara ====================================== -->

    <section id="tentang" class="bagian">
      <h2 class="bagian__judul">Tentang acara</h2>

      <!-- Deskripsi resmi SBS, ditulis sebagai paragraf terpisah. Sumbernya
           meta tag halaman program SBS, bukan ringkasan yang ditulis
           sendiri. -->

      <div class="kartu ringkas">
        <p v-for="(paragraf, n) in tentang.ringkas" :key="n" class="ringkas__teks">
          {{ paragraf }}
        </p>
      </div>
    </section>

    <!-- ===== Anggota =========================================== -->

    <section id="anggota" class="bagian">
      <h2 class="bagian__judul">{{ t('anggota.judul') }}</h2>

      <!-- Baris, bukan kartu. Sama seperti daftar di episode/index.vue dan
           streaming.vue: yang di sini satu kelompok orang, dan memberi
           tiap orang permukaan sendiri membuatnya terbaca sebagai
           hal-hal terpisah. Garis rambut memisahkannya tanpa membuat
           tiap baris jadi kotak.

           Baris pertama juga memakai `border-top`, bukan hanya baris
           kedua dan seterusnya. Alasannya sama seperti di streaming:
           di sini baris pertama berada di bawah `<h2>` yang sudah punya
           jarak sendiri, jadi tanpa garis ia menggantung. -->
      <ul class="anggota">
        <li v-for="(satu, id) in anggota" :key="id" class="anggota__baris">
          <!-- Foto bukan dekorasi: orang mengenali cast lewat wajahnya, dan
               nama Korea saja sulit dibaca orang Indonesia. Alt-nya
               nama orang itu karena gambar ini memang memportretkan
               orang tersebut.

               Ukurannya dikunci lewat `width` dan `height` supaya baris
               tidak bergeser selagi fotonya belum selesai dimuat — foto
               dari CDN pihak ketiga tidak selalu tiba secepat teksnya. -->
          <img
            class="anggota__foto"
            :src="satu.foto"
            :alt="satu.latin"
            width="56"
            height="56"
            loading="lazy"
          >

          <div class="anggota__isi">
            <div class="anggota__kepala">
              <h3 class="anggota__nama">{{ satu.latin }}</h3>

              <!-- Nama Korea di bawah nama latin. Bukan terjemahan:
                   ini bentuk Hangul dari nama orangnya sendiri. Diletakkan
                   di bawah karena pembaca yang tidak bisa baca Korea tetap
                   harus bisa tahu siapa yang sedang dibahas, dan urutan
                   membaca dimulai dari atas. -->
              <p class="anggota__hangul">{{ satu.nama }}</p>

              <!-- Penanda status. Ini bukan data SBS — SBS tidak pernah
                   menandai siapa yang masih aktif. Nilainya diambil dari
                   laporan media Korea, karena halaman cast SBS sudah lama
                   tidak diperbarui: 이광수 dan 전소민 masih tercantum
                   padahal sudah keluar, dan 지예은 yang bergabung sejak
                   2024 justru tidak ada.

                   Badge netral untuk yang sudah keluar, bukan badge
                   bahaya: keluar dari acara bukan kesalahan. -->
              <span class="badge anggota__status" :class="satu.aktif ? 'badge--sukses' : ''">
                {{ satu.aktif ? t('anggota.aktif') : t('anggota.keluar') }}
              </span>
            </div>

            <!-- Ketiganya sudah jadi string biasa oleh pemetaan di script, jadi
                 templatenya tidak perlu `rt()` maupun pembungkus lain.
                 Penulisan `satu.` wajib di sini: nama variabel lariknya
                 `baris`, bukan `deskripsi` atau `karier`. -->
            <p v-if="satu.sapaan" class="anggota__sapaan">
              <Icon name="lucide:quote" class="anggota__ikon" aria-hidden="true" />
              {{ satu.sapaan }}
            </p>

            <div v-if="satu.deskripsi.length" class="anggota__deskripsi">
              <p v-for="(baris, barisId) in satu.deskripsi" :key="barisId">
                {{ baris }}
              </p>
            </div>

            <!-- Riwayat karier dilipat per anggota. Sembilan anggota dengan
                 tujuh sampai sembilan baris masing-masing menambah 62 baris
                 ke halaman ini, dan hampir tidak ada yang menelusuri
                 seluruh kar seseorang.

                 `<details>` dipakai, bukan tombol + state Vue: daftar ini
                 cuma dibaca, tidak perlu state, dan `<details>` tetap
                 berfungsi tanpa JavaScript. Yang sudah aktif tidak
                 perlu diklik — daftar pendek tetap terbuka. -->
            <details
              v-if="satu.karier.length"
              class="anggota__karier"
              :open="satu.karier.length <= BATAS_KARIER"
            >
              <summary class="label anggota__karier-judul">
                {{ t('anggota.karier') }}
                <!-- Jumlahnya selalu ditulis. Kalau daftarnya terlipat
                     tanpa petunjuk, orang mengira karriere orang ini
                     memang sedikit — padahal yang tersembunyi justru
                     yang paling panjang. -->
                <span class="anggota__karier-jumlah">{{ satu.karier.length }}</span>
                <Icon
                  name="lucide:chevron-down"
                  class="anggota__karier-panah"
                  aria-hidden="true"
                />
              </summary>
              <ul class="anggota__karier-daftar">
                <li v-for="(baris, barisId) in satu.karier" :key="barisId">
                  {{ baris }}
                </li>
              </ul>
            </details>
          </div>
        </li>
      </ul>

      <!-- SBS belum memperbarui halamannya: 이광수 dan 전소민 masih
           tercantum padahal sudah keluar, dan Ji Ye-eun yang bergabung
           sejak 2024 justru tidak ada di sana. Penanda status di bawah
           mengikuti laporan media Korea, bukan data SBS. Tanpa catatan
           ini orang akan menghitung sendiri lalu menyimpulkan angkanya
           salah. -->
      <p class="anggota__bawah">
        {{ t('anggota.bawah') }}
      </p>
    </section>

    <!-- ===== Statistik ========================================= -->

    <section id="statistik" class="bagian">
      <h2 class="bagian__judul">Statistik</h2>

      <ul class="statistik">
        <li v-for="(satu, id) in statistik" :key="id" class="kartu statistik__butir">
          <Icon :name="satu.ikon" class="statistik__ikon" aria-hidden="true" />
          <span class="statistik__nilai">{{ satu.nilai }}</span>
          <span class="statistik__label">{{ satu.label }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. */
.detail {
  padding-bottom: 10rem;
}

/* Beranda melompat ke section lewat anchor, jadi section yang punya
 * `id` perlu ruang ekstra di atasnya. Tanpa ini, begitu lompat ke
 * `#statistik`, judul bagian itu berhenti tepat di belakang header.
 *
 * Header memakai `position: sticky`, bukan `fixed`. Bedanya di sini:
 * `sticky` masih menyisakan ruang di tempatnya di dalam aliran, jadi
 * konten di bawahnya tergeser ke bawah header — sementara lompatan
 * anchor justru membuat elemen tujuan berhenti tepat di tepi atas
 * viewport, yaitu persis di tempat header itu berada. */
[id] {
  scroll-margin-top: 3.5rem;
}

/* --- Kembali ------------------------------------------------- */

/* Punya kelas sendiri, bukan `.meta` dari main.css, karena ini
 * tautan dan perlu `font-weight` serta warna tautan — dua hal yang
 * tidak boleh ikut pada daftar keterangan yang tidak bisa ditekan. */
.detail__kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.detail__kembali-ikon {
  font-size: 1rem;
}

/* --- Kartu di halaman ini ------------------------------------ */

/* Kartu di halaman ini tidak bisa diklik ke mana pun, tapi `.kartu`
 * dari main.css mengubah warna garis saat hover. Hover itu sinyal
 * "ini punya tujuan", dan di sini tidak ada tujuan.
 *
 * Ditulis sebagai satu selector berumpun, bukan aturan terpisah per
 * kartu. Empat aturan yang isinya sama persis adalah tempat di mana
 * ketiganya akan mulai berbeda sendiri nanti. */
.acara:hover,
.ringkas:hover,
.statistik__butir:hover {
  border-color: var(--garis-halus);
}

/* --- Kartu acara --------------------------------------------- */

/* `flex-wrap` dipakai supaya daftar keterangan turun ke baris sendiri
 * di layar sempit. Kolom data di samping mark tetap di baris pertama,
 * jadi saat baris ketiga turun, kolom yang isinya cuma dua kalimat
 * tidak ikut meninggi.
 *
 * `min-width: 0` pada kolom data itu penting: tanpa itu, teks panjang
 * menahan baris flex dan mark terdorong ke baris bawah maupun di
 * layar yang sebenarnya cukup lebar. */
.acara {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;

  margin-top: 2rem;
  padding: 1.75rem;
}

/* Mark huruf. Bentuk dan tipografinya sama persis dengan
 * `.tayang__mark` di beranda — keduanya adalah huruf yang sama,
 * sehingga satu ukuran untuk keduanya lebih jujur daripada
 * sengaja dibuat berbeda. */
.acara__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-besar);

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  /* `line-height: 1` wajib, sama seperti di SlotMark: elemen induk
     mewarisi line-height 1.6 dari body, dan tanpa baris ini huruf
     duduk beberapa piksel lebih rendah dari tengah kotaknya. */
  font-size: 2rem;
  line-height: 1;
  color: var(--teks-aksen);
}

.acara__data {
  min-width: 0;
  flex: 1 1 12rem;
}

.acara__nama {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--teks-utama);
}

/* Nama Korea di bawah nama yang dikenal orang. Keterangan, bukan
 * judul, jadi ukurannya satu tingkat di bawah `acara__nama` dan
 * warnanya lebih redup. */
.acara__nama-asli {
  margin-top: 0.125rem;
  font-size: 0.9375rem;
  color: var(--teks-lembut);
}

.acara__jenis {
  margin-top: 0.125rem;
  font-size: 0.875rem;
  color: var(--teks-lembut);
}

.acara__tanda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

/* --- Jadwal tayang -------------------------------------------- */

/* Padding kartu dikosongkan, karena dua bagian di dalamnya masing-
 * masing menentukan paddingnya sendiri. Kalau padding kartu
 * dibiarkan, dua bagian itu tidak akan bisa menempel pada garis
 * pemisah — pemisah selalu penuh selebar kartu, sementara isi di
 * dalamnya menyempit selebar kartu juga, dan jaraknya jadi tidak
 * seragam. */
/* --- Tentang acara -------------------------------------------- */

.ringkas {
  padding: 1.75rem;
}

/* Di layar sempit, kartu ini paling rakus dari kartu yang ada di
 * halaman: 1.75rem per sisi, di luar padding kartu yang sudah ada. Setelah
 * padding konten dikecilkan di layar sempit, ruang yang tersisa
 * masih perlu dikembalikan di sini — kartu inilah yang paling
 * banyak kehilangan lebar. */
@media (max-width: 30rem) {
  .ringkas {
    padding: 1.25rem;
  }
}

/* Batas lebar baris. Tanpa itu, paragrafnya memenuhi 72rem dan
 * setiap barisnya jadi terlalu panjang untuk dibaca tanpa
 * memutar kepala — di layar lebar, memutar kepala ke kiri dan ke kanan
 * lebih banyak dari yang perlu.

 * Dipakai `max-width` pada teks, bukan pada kartunya: kartunya tetap
 * lebar penuh supaya permukaannya seragam dengan kartu lain, dan
 * yang berhenti melebar hanya baris kata-kata. */
.ringkas__teks {
  max-width: 42rem;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--teks-sekunder);
}

/* Jarak antar paragraf ditulis di margin paragraf kedua, bukan di
 * container, supaya jarak terakhir tetap benar saat deskripsi ini
 * berubah jumlah paragrafnya. */
.ringkas__teks + .ringkas__teks {
  margin-top: 0.75rem;
}

/* --- Anggota -------------------------------------------------- */

/* Baris, bukan kartu — sama seperti daftar di episode/index.vue dan
 * streaming.vue.
 *
 * `flex-wrap` supaya di layar sempit foto tetap di kiri dan teks turun
 * ke bawahnya, dan `min-width: 0` pada kolom teks supaya nama Korea
 * yang panjang tidak menahan baris flex dan mendorong foto ke luar.
 *
 * Baris pertama juga memakai `border-top`, tapi garis antar baris baru
 * mulai dari baris kedua. Baris pertama menempel pada permukaan kartu,
 * jadi garis di atasnya akan terbaca sebagai tepi kartu yang gagal. */
.anggota__baris {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem 1rem;

  padding: 1.125rem 0;
  border-top: 1px solid var(--garis-halus);
}

.anggota {
  margin: 0;
  padding: 0;
  list-style: none;
}

.anggota__foto {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  object-fit: cover;

  /* Latar di belakang gambar. Selagi foto dari CDN belum selesai dimuat,
   * yang tampil adalah kotak seukuran aslinya dan warnanya tidak
   * mencolok seperti kotak yang rusak. */
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
}

.anggota__isi {
  flex: 1 1 16rem;
  min-width: 0;
}

/* Nama dan penanda status sebaris. `flex-wrap` dipakai supaya di layar
 * sempit badge turun ke baris sendiri, bukan memaksa nama Korea jadi
 * dua baris yang sempit. */
.anggota__kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.anggota__nama {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--teks-utama);
}

/* Badge netral kalau statusnya "sudah keluar", mengikuti `.badge`
 * bawaan. Yang aktif memakai warna `--sukses` dari main.css.
 *
 * Ditulis ulang di sini hanya karena warna netral bawaan `.badge` sudah
 * pas untuk keadaan ini — keluar dari acara bukan tanda bahaya. */
.anggota__status {
  background: var(--latar-sorot);
  color: var(--teks-sekunder);
}

/* Font Korea. Teks di sini seluruhnya bahasa Korea, dan proyek ini belum
 * punya font Korea di tumpukan sistem — tanpa baris ini teksnya bisa
 * tampil sebagai kotak pada perangkat yang tidak punya glyph-nya.
 * Ditambahkan hanya di scope section ini supaya tidak mengubah tipografi
 * seluruh situs. */
.acara__nama-asli,
.ringkas__teks,
.anggota__nama,
.anggota__sapaan,
.anggota__hangul,
.anggota__deskripsi,
.anggota__karier {
  font-family: system-ui, -apple-system, "Apple SD Gothic Neo",
    "Malgun Gothic", "Noto Sans KR", sans-serif;
}

/* Nama Korea. Sengaja kecil dan redup di bawah nama latin: bentuk
 * Hangul adalah keterangan pendukung, bukan nama utamanya. Nama latin
 * yang dibaca lebih dulu. */
.anggota__hangul {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}
/* Sapaan. Tanda kutip di depan ditulis lewat ikon, bukan karakter
 * `"` atau `&ldquo;` — karakter itu ikut ikut diterjemahkan kalau locale
 * menyiapkannya, sementara ikon selalu sama di semua bahasa. */
.anggota__sapaan {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  font-style: italic;
  color: var(--teks-aksen);
}

.anggota__ikon {
  flex-shrink: 0;
  font-size: 0.875rem;
}

/* Jarak antar paragraf deskripsi ditulis di margin paragraf, bukan di
 * container, supaya baris ikut menyusut kalau deskripsinya kosong. */
.anggota__deskripsi {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--teks-sekunder);
}

.anggota__deskripsi p + p {
  margin-top: 0.375rem;
}

/* Karier dipisah dari deskripsi satu garis rambut, supaya jelas dua
 * kelompok informasi yang berbeda dan bukan satu paragraf panjang. */
.anggota__karier {
  margin-top: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--garis-halus);
}

/* Pemicu lipatan. `<summary>` bawaan browser punya segitiga dan
 * penanda daftar sendiri; keduanya dihapus supaya yang tampil cuma
 * ikon panah, dan supaya browser tidak menambahkan gaya bawaan
 * yang berbeda antar mesin. */
.anggota__karier-judul {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  list-style: none;
}

.anggota__karier-judul::-webkit-details-marker {
  display: none;
}

.anggota__karier-judul:hover {
  color: var(--teks-utama);
}

/* Panah berputar ninety derajat saat terbuka. Transisi pendek supaya
 * terasa terkait dengan perubahan, tapi tidak menahan klik
 * berikutnya — gerakan lambat di sini akan terasa seperti lag. */
/* Jumlah baris di sebelah label. Ditelusuri dari warna teks
 * lembut ke warna utama supaya tetap terbaca sebagai angka, bukan
 * sebagai bagian dari tulisan "Riwayat karier". */
.anggota__karier-jumlah {
  color: var(--teks-lembut);
}

.anggota__karier-judul:hover .anggota__karier-jumlah {
  color: var(--teks-sekunder);
}

.anggota__karier-panah {
  font-size: 0.875rem;
  transition: transform 160ms ease;
}

.anggota__karier[open] .anggota__karier-panah {
  transform: rotate(180deg);
}

/* Jarak ke daftar ada di daftar, bukan di pemicunya. Kalau ditulis
 * di `margin-bottom` pemicu, jarak itu tetap ada saat tertutup —
 * lihat `padding-top` di `.anggota__karier` yang sengaja tetap
 * supaya garis pemisah tidak ikut hilang. */
.anggota__karier-daftar {
  margin: 0.375rem 0 0;
  padding: 0;
  list-style: none;

  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--teks-lembut);
}

/* Catatan di bawah daftar. Redup dan rapat supaya terbaca sebagai
 * keterangan, bukan sebagai bagian dari daftar. */
.anggota__bawah {
  font-size: 0.8125rem;
  color: var(--teks-lembut);
}

.anggota__bawah {
  margin-top: 0.75rem;
}

/* --- Statistik ------------------------------------------------ */

/* auto-fit, bukan empat kolom tetap. Di layar sempit kolom ketiga
 * menyempit sampai angkanya mulai turun baris, sementara dua kolom
 * masih muat dengan lebar yang sama. Pola ini sama persis dengan
 * yang dipakai di (profile)/profile.vue. */
.statistik {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: 0.75rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

.statistik__butir {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1rem;
}

.statistik__ikon {
  font-size: 1.125rem;
  color: var(--teks-lembut);
}

.statistik__nilai {
  margin-top: 0.625rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--teks-aksen);
  /* Angka yang berubah-ubah tidak boleh geser lebarnya sendiri,
     sehingga rata kiri kolom yang sebelahnya ikut bergerak. */
  font-variant-numeric: tabular-nums;
}

.statistik__label {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}
</style>