/** GET /api/running-man/clips — klip tayang Running Man, berurutan.
 *
 *  Sumber: https://m.programs.sbs.co.kr/enter/runningman/main#clip-64958
 *
 *  Alamat di atas dipakai orang, bukan program ini. Halamannya dirender
 *  oleh JavaScript, dan dua endpoint berbeda dipakai di dalamnya.
 *
 *  Yang pertama untuk tahu bagian mana saja yang ada di halaman:
 *
 *    https://static.apis.sbs.co.kr/program-api/3.0/main/runningman?platform=mobile
 *
 *  Yang kedua untuk isi bagiannya, dan ini yang dipakai di sini:
 *
 *    https://static.apis.sbs.co.kr/play-api/1.0/clip/sbs_vodall/S01_V0000330171
 *      ?offset=0&limit=20&sort=new&search=&cliptype=&date_type=broaddate
 *
 *  Alamat, bentuk mentah, dan pemetaannya tinggal di
 *  `server/utils/running-man/klip.ts` karena dipakai dua handler — yang ini
 *  dan yang acak. Lihat berkas itu untuk hal-hal yang tidak terlihat dari
 *  parameter: kenapa id bagiannya 64958 bukan 64959, dan kenapa `limit`
 *  dibatasi.
 *
 *  Cache bawaan Nitro memakai `originalUrl` sebagai bagian kunci, jadi
 *  `?urutan=terlama` dan `?urutan=terpopuler` otomatis punya salinan
 *  sendiri — tidak perlu memberi kunci cache manual.
 *
 *  Dibungkus cache karena klip baru muncul sedikit kali dalam seminggu,
 *  sedangkan halaman ini bisa dibuka sesering itu juga. `swr: true`
 *  artinya begitu cache basi, yang dilayani tetap salinan lamanya sementara
 *  yang baru diambil di belakang — jadi SBS yang lambat tidak ikut
 *  memperlambat halaman. */

/** Berapa banyak klip yang dikirim kalau pemanggil tidak menentukan sendiri.
 *
 *  Halaman-halaman di sini selalu mengirim `limit`-nya sendiri, jadi angka
 *  ini hanya berlaku untuk permintaan langsung ke endpoint — dan untuk itu
 *  100 yang aman: sekitar 37 KB, cukup untuk melihat isinya.
 *
 *  TIDAK ada ikatan dengan angka di sisi app. `offset` dihitung dari
 *  panjang daftar yang sudah dimiliki halaman, bukan dari ukuran halaman,
 *  jadi mengubah angka di sini tidak membuat klip terlewat atau terulang. */
const JUMLAH = 100

/** Berapa lama hasil boleh dipakai sebelum diambil ulang. 10 menit: klip
 *  baru muncul sekali dalam seminggu, jadi lebih pendek dari ini hanya
 *  menambah beban ke SBS tanpa pernah mengubah apa yang dilihat. */
const TTL_SEKON = 600

/** Urutan yang tersedia, dengan nama yang dipakai halaman.
 *
 *  Nama kuncinya disimpan apa adanya di URL — `?urutan=terpopuler` — supaya
 *  pilihan orang bisa dibagikan dan tombol kembali di browser mengikutinya. */
const URUTAN = {
  terbaru: SORT_TERBARU,
  terlama: SORT_TERLAMA,
  terpopuler: SORT_TERPOPULER
} as const

const URUTAN_AWAL = 'terbaru'

/* Satu kunci yang dijamin ada.
 *
 * Tanpa ini, `URUTAN[urutan]` bertipe `string | undefined` karena
 * `noUncheckedIndexedAccess`, dan pemanggilnya harus berHandling dengan
 * kemungkinan `undefined` — padahal `urutan` sudah pasti kuncinya: dia
 * diambil dari `URUTAN` atau bernilai `URUTAN_AWAL`, yang keduanya ada di
 * `URUTAN`. Bentuknya ditulis supaya itu terbukti, bukan dipercaya. */
type KunciUrutan = keyof typeof URUTAN

export default defineCachedEventHandler(
  async (event) => {
    /* Nilai yang tidak dikenal jatuh ke urutan awal, bukan diteruskan ke
     * SBS. Alasannya bukan kehati-hatian berlebihan: `?urutan=ngawur` punya
     * cache sendiri, jadi kalau diteruskan apa adanya, SBS menerima sort
     * yang tidak dikenal dan jawabannya bisa apa saja. */
    const diminta = String(getQuery(event).urutan || '')
    const urutan = (diminta in URUTAN ? diminta : URUTAN_AWAL) as KunciUrutan

    /* Berapa banyak klip yang sudah dilewati. Halaman daftar mengirimnya
     * lagi setiap kali orang menggulir ke bawah. Angka yang bukan angka,
     * atau negatif, jatuh ke nol: menggeser daftar ke awal lebih baik
     * daripada mengirim nilai aneh ke SBS. */
    const offsetDiminta = Number(getQuery(event).offset)
    const offset = Number.isInteger(offsetDiminta) && offsetDiminta > 0 ? offsetDiminta : 0

    /* Ukuran satu permintaan. Tiap halaman mengirim angkanya sendiri:
     * daftar klip memakai 100 untuk pemuatan pertamanya dan 100 untuk tiap
     * gulir berikutnya, beranda 20, halaman satu klip 10 — lihat
     * `useRunningManClips.ts`.
     *
     * 1000 adalah batas atasnya, dan itu batas SBS, bukan pilihan: diuji,
     * SBS mengirim 1000 klip (2,2 MB) saat diminta. Dibiarkan sampai situ
     * supaya angkanya bisa dicoba tanpa mengubah berkas ini, tapi jangan
     * dinaikkan lagi — di atas 1000 SBS mengabaikannya, dan yang kita
     * dapat cuma permintaan besar tanpa hasil tambahan. */
    const limitDiminta = Number(getQuery(event).limit)
    const limit =
      Number.isInteger(limitDiminta) && limitDiminta > 0
        ? Math.min(limitDiminta, 1000)
        : JUMLAH

    try {
      return await ambilKlip(offset, limit, URUTAN[urutan])
    } catch (error) {
      /* Kegagalan di sini bukan berarti halaman harus ikut gagal. Bagian
       * klip boleh kosong sementara bagian lain tetap tampil, dan lebih
       * baik kosong daripada melempar error yang membuat seluruh halaman
       * rusak. Yang perlu diketahui orang adalah akarnya, jadi dicatat di
       * server. */
      console.warn('[klip] gagal mengambil dari SBS:', error)
      return []
    }
  },
  { name: 'running-man-clips', maxAge: TTL_SEKON, swr: true }
)