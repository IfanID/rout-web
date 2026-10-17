/** Data anggota cast Running Man, dipakai halaman detail dan pencarian.
 *
 *  Sebelumnya blok ini tinggal di `app/pages/running-man/detail.vue`,
 *  dengan alasan halaman itu satu-satunya pemakainya. Sekarang pencarian
 *  juga membutuhkannya — untuk mencocokkan nama, nama latin, dan sapaan
 *  — jadi pemakai keduanya muncul dan berkas terpisah ini mulai
 *  menghasilkan sesuatu: satu sumber, bukan dua salinan yang bisa
 *  berbeda.
 *
 *  Yang ada di sini hanya data yang TIDAK diterjemahkan: nama Korea,
 *  nama latin, riwayat karier bawaan, foto, dan penanda aktif. Sapaan,
 *  deskripsi, dan karier terjemahan tetap di
 *  `app/i18n/locales/<kode>.json` pada `anggota.orang.<kunci>`.
 *
 *  Sumbernya ada di AGENTS.md bagian "Sumber data Running Man"; yang
 *  perlu diingat di sini: `aktif` diambil dari laporan media Korea,
 *  BUKAN dari halaman cast SBS yang tidak pernah diperbarui. Foto yang
 *  bukan milik SBS wajib punya `kredit`.
 */

export interface AnggotaRunningMan {
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
  /**
   * URL foto dari CDN SBS.
   *
   * Boleh kosong untuk anggota yang tidak pernah ada di halaman cast
   * SBS — lihat `keluar` di bawah. Foto kosong tidak diisi dengan
   * gambar lain: yang tidak ada di SBS tidak bisa dikarang dari CDN
   * yang sama.
   */
  foto: string
  /**
   * Kapan ia berhenti jadi anggota, format `YYYY-MM-DD`.
   *
   * Yang ditulis adalah tanggal **pengumuman** keluar, bukan tanggal
   * tayang episode terakhir. Alasannya satu: tanggal episode terakhir
   * tidak bersumber sama-rata — untuk 이광수 dan 전소민 yang ada
   * tanggal pengumuman resmi, sementara tayang terakhirnya tidak
   * tercatat di satu tempat pun yang dipakai di sini. Kalau satu orang
   * ditulis dengan tanggal tayang dan yang lain dengan tanggal pengumuman,
   * dua angka itu jadi tidak sebanding.
   *
   * Boleh ditulis `YYYY` saja kalau tanggal persisnya tidak ada
   * sumbernya — Lizzy hanya sampai ke tahun. Tahun saja lebih baik
   * daripada tanggal yang ditebak.
   *
   * Field ini hanya diisi untuk yang sudah keluar. Anggota yang masih
   * aktif tidak punya tanggal, jadi tidak ada yang perlu ditulis.
   */
  /**
   * Masih jadi anggota Running Man per Oktober 2026.
   *
   * BUKAN data SBS. Halaman cast SBS tidak menandai status siapa pun,
   * jadi nilainya diambil dari laporan media Korea (Naver Entertainment,
   * 14 Oktober 2026) yang menyebut susunan tujuh orang: 유재석, 지석진,
   * 김종국, 하하, 송지효, 양세찬, 지예은.
   *
   * Kenapa perlu ada: SBS tidak pernah memperbarui halamannya. Terakhir
   * dicek 16 Oktober 2026, cast SBS hanya mengembalikan enam orang —
   * 지예은 yang bergabung sejak 2024 tidak ada di sana, dan 이광수
   * maupun 전소민 sudah dihapus meski profil keduanya sudah diambil.
   * Tanpa penanda ini, 김종국 dan 송지효 akan terbaca sebagai anggota
   * yang sudah tidak aktif — padahal keduanya masih tayang.
   */
  aktif: boolean
  /** Tanggal keluar, `YYYY-MM-DD` atau `YYYY`. Lihat catatan di atas. */
  keluar?: string
  /**
   * Atribusi foto: namaFotografer / asal / lisensi.
   *
   * Wajib diisi kalau fotonya bukan dari SBS. Lisensi Creative Commons
   * mengizinkan pemakaian ulang, tapi tetap menyebut siapa
   * fotografernya dan lisensinya — tanpa itu pemakaian ulang itu
   * melanggar syarat lisensi, sama sahnya dengan memakai tanpa izin.
   *
   * Isinya nama dan nama lisensi, bukan kalimat, jadi tidak perlu
   * diterjemahkan. Label "Foto"-nya yang ikut bahasa pemakai.
   */
  kredit?: string
}

const ANGGOTA: AnggotaRunningMan[] = [
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
    aktif: false,
    keluar: '2021-04-27'
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
    aktif: false,
    keluar: '2023-10-23'
  },
  /* Tiga anggota berikut berbeda dari yang di atasnya dalam satu hal
   * saja: tidak ada di halaman cast SBS sama sekali, sehingga tidak ada
   * foto, sapaan, deskripsi, maupun karier yang bisa diambil dari sana.
   *
   * Mereka tetap memakai baris yang sama supaya tidak menjadi kelompok
   * tersendiri — pemisahnya sudah jelas dari isi baris: yang punya
   * profil punya foto dan uraian, yang tidak punya tidak. Memindahkannya
   * ke daftar terpisah justru memaksa halaman memakai dua bentuk
   * untuk satu kelompok yang sama.
   *
   * Yang boleh ditulis untuk mereka hanya nama Korea, nama latin, dan
   * tahun berhenti. Sisanya berarti mengarang isinya.
   *
   * Tahun berhenti diambil dari sumber per orang:
   *
   * - 송중기 — "지난 5월초 하차" (엑스포츠뉴스, 5 Oktober 2011); en.wikipedia
   *   "Running Man (TV program)" mencatat episode 1–41
   * - 리지 (Lizzy, 박수영 dari grup After School) — en.wikipedia: episode
   *   18–25, 2010–2011, berhenti karena jadwal grup
   * - 개리 — en.wikipedia: episode 1–324, 2010–2016; Naver 30 Januari 2017
   *   menulis "'런닝맨' 개리 또 출연… '하차 한 거 맞아?'" saat ia tampil
   *   lagi sebagai tamu
   *
   * 강호동 sengaja tidak ada di sini. Semula ia sempat ditulis sebagai
   * anggota 2010–2011 karena OSEN 27 Desember 2011 menulis "강호동의 하차
   * 후", tapi kalimat itu soal 강심장 — program lain di blok SBS yang
   * sama, bukan 런NING맨. Pencarian ulang seluruh 2010–2011 tidak
   * menemukan satu pun artikel Naver yang memuat namanya bersama
   * 런NING맨, dan en.wikipedia tidak mencantumkannya di daftar cast.
   *
   * 강훈 dan 최다니엘 juga tidak: keduanya "임대 멤버", tamu
   * beranggotakan, bukan anggota tetap. */
  {
    kunci: 'songjoongki',
    nama: '송중기',
    latin: 'Song Joong-ki',
    /* Hanya sebagai bawaan kalau locale belum terisi — sama seperti
     * anggota lain. Sumbernya ko.wikipedia, bukan `castdsc` SBS. */
    karier: [
      "2016년~ KBS2 “태양의 후예”",
      "2020년~ tvN “빈센조”",
      "2022년~ JTBC “재벌집 막내아들”",
      "2019년 tvN “아스달 연대기”",
      "2020년 SBS “승리호”",
      "2021년 극장영화 “보고타”",
      "2012년 KBS2 “세상 어디에도 없는 착한남자”",
      "2012년 극장영화 “늑대소년”",
      "2010년~ 2011년 SBS “런닝맨”",
      "2010년 KBS2 “성균관 스캔들”"
    ],
    /* Foto Commons, bukan SBS — SBS tidak pernah memuatnya di halaman
     * cast.
     *
     * Dipotong beforehand di `public/anggota/` dengan alasan yang sama
     * seperti Gary: aslinya 244×393 dan wajahnya ada di bagian atas,
     * sehingga lingkaran 56px menyisakan bahu dan dada. Pemotongan
     * disebut di `kredit` — CC BY minta perubahan terhadap karya
     * dicantumkan, jadi "dipotong" bukan hiasan tapi ketentuan
     * lisensinya.
     *
     * Foto yang lebih dekat ke masanya sebagai anggota tidak ada di
     * Commons; yang ada mulai 2014, tiga tahun setelah ia keluar. */
    foto: '/anggota/song-joong-ki.jpg',
    kredit: 'LGE / Wikimedia Commons, CC BY 2.5, dipotong',
    aktif: false,
    keluar: '2011-04-27'
  },
  {
    kunci: 'lizzy',
    nama: '리지',
    latin: 'Lizzy (Park Soo-young)',
    /* Bawaan dari en.wikipedia, yang tidak punya padanan Korea untuk
     * sebagian judulnya. */
    karier: [
      "2010년~ 2011년 SBS “런닝맨”",
      "2010년~ 2017년 플래디스 “애프터스쿨”, 서브유닛 “오렌지캐러멜”",
      "2015년~ 2018년 “애프터스쿨 블루”",
      "2011년 극장영화 “백마”",
      "2014년~ 2015년 Mnet “히트메이커”",
      "2020년 tvN “오마이베이비”"
    ],
    /* Potret busta, bukan foto full body.
     *
     * Dua foto Commons lainnya untuk dia adalah foto panjang seutuhnya
     * tubuh: dalam lingkaran 56px dengan `object-fit: cover`, yang
     * tersisa cuma potongan tengahnya — perut dan tangan, bukan
     * wajah. Potret 250×320 ini muat utuh di potongan tengah, dan
     * wajahnya persis di tengah itu.
     *
     * `.png` 99 KB, bukan `jpg` 34 KB. Bedanya 65 KB untuk satu baris,
     * dan potret ini masih tajam di ukuran 56px. */
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Park_Soo-young_in_2019.png/250px-Park_Soo-young_in_2019.png',
    kredit: 'beautypl / Wikimedia Commons, CC BY 3.0',
    aktif: false,
    keluar: '2011'
  },
  {
    kunci: 'gary',
    nama: '개리',
    latin: 'Gary',
    /* Bawaan dari en.wikipedia. Nama aslinya 강희건. */
    karier: [
      "2010년~ 2016년 SBS “런닝맨”",
      "2002년~ 리쌍",
      "1997년 X-Teen, 1999년~ 2000년 Honey Family",
      "2014년 디지털 싱글 “Shower Later”",
      "2014년 디지털 싱글 “XX몰라”",
      "2014년 KBS “응급부부”"
    ],
    /* Foto Commons, sudah dipotong beforehand lalu disimpan di
     * `public/anggota/`. Yang dipotong bukan karena kesukaan: foto
     * aslinya 338×602 penuh tubuh di panggung, dan dalam lingkaran
     * 56px wajahnya cuma sekitar delapan piksel — terlalu kecil untuk
     * dikenali sebagai siapa pun.
     *
     * Dipotong dengan tangan karena halaman tidak punya proses gambar.
     * Server tidak bisa memotong sesuai permintaan, jadi satu-satunya
     * tempat potongan ini bisa lahir adalah berkas di repo.
     *
     * Potongannya dari `Kang_Gary.jpg` (Jinho Jung, CC BY-SA 2.0) —
     * satu-satunya potret Gary yang ada di Commons; yang kedua,
     * `Leessang.jpg`, memuat dua orang sekaligus. */
    foto: '/anggota/gary.jpg',
    kredit: 'Jinho Jung / Wikimedia Commons, CC BY-SA 2.0',
    aktif: false,
    keluar: '2016-10-25'
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
    /* Foto dari Wikimedia Commons, bukan SBS — dia tidak ada di sana.
     * Lisensinya CC BY-SA 4.0, jadi fotografer dan lisensinya wajib
     * disebut. */
    foto: "https://upload.wikimedia.org/wikipedia/commons/3/34/Ji_Ye-eun.jpg",
    kredit: 'Republic of Korea / Wikimedia Commons, CC BY-SA 4.0',
    aktif: true
  }
]

/** Daftar mentah, tanpa teks terjemahan.
 *
 *  Pemanggil yang menampilkan ke orang wajib memetakan teksnya dari
 *  locale — lihat `anggota` di `detail.vue`. Pencarian hanya memakai
 *  `nama`, `latin`, dan `sapaan` dari locale, jadi tidak perlu
 *  memetakan deskripsi dan karier. */
export function useRunningManAnggota() {
  return { daftar: ANGGOTA }
}
