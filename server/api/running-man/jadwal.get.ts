/** GET /api/running-man/jadwal — episode Running Man berikutnya, beserta
 *  tanggal tayangnya.
 *
 *  Sumbernya menu 다시보기 SBS (episode penuh, bukan klip):
 *
 *    https://static.apis.sbs.co.kr/program-api/3.0/main/contents/runningman/vod/55286
 *
 *  Alamat, pemetaan, dan aturan tanggalnya tinggal di
 *  `server/utils/running-man/jadwal.ts`. Lihat berkas itu untuk kenapa
 *  yang dibaca menu `vod` dan bukan `clip`, dan untuk aturan penggeseran
 *  seminggu saat episodenya memang tidak tayang.
 *
 *  Jawabannya `{ nomor, tanggal }` dengan tanggal ISO. Nama hari dan nama
 *  bulannya dibentuk di halaman, karena bahasa yang membacanya bisa tiga
 *  macam — lihat `shared/types/jadwal.ts`.
 *
 *  **Tanggalnya dihitung di sini, bukan di halaman.** Aturannya satu
 *  tempat, dan pembandingnya "hari ini" yang dihitung dalam zona Korea —
 *  bukan jam perangkat pembaca. Dua orang di zona berbeda harus melihat
 *  tanggal yang sama untuk episode yang sama.
 *
 *  Dibungkus cache karena yang dihitung berubah seminggu sekali,
 *  sedangkan halamannya bisa dibuka sesering itu juga. 10 menit dipilih
 *  pendek, bukan karena bebannya berat: tanggalnya bisa bergeser sehari
 *  tepat setelah tanggal tayang lewat, dan menunggu satu jam hanya membuat
 *  kartunya ketinggalan. `swr: true` membuat SBS yang lambat tidak ikut
 *  memperlambat halaman. */

/** Berapa lama hasil boleh dipakai sebelum diambil ulang, dalam detik. */
const TTL_SEKON = 600

export default defineCachedEventHandler(
  async () => {
    const hariIni = hariIniKST()

    try {
      return berikutnyaDari(await ambilTerakhir(), hariIni)
    } catch (error) {
      /* Kegagalan di sini bukan berarti halaman harus ikut gagal.
       *
       * Yang dikirim bukan larik kosong seperti di endpoint klip — di sini
       * ada jawaban cadangan yang tetap berguna, yaitu episode terakhir
       * yang kita ketahui tayang, digeser dengan aturan yang sama. Jadi
       * kartunya tetap menampilkan tanggal yang masuk akal, dan begitu SBS
       * kembali bisa dihubungi, angkanya ikut terkoreksi sendiri.
       *
       * Yang perlu diketahui orang adalah akarnya, jadi dicatat di server. */
      console.warn('[jadwal] gagal mengambil dari SBS:', error)

      return berikutnyaDari(TERAKHIR_DIKETAHUI, hariIni)
    }
  },
  { name: 'running-man-jadwal', maxAge: TTL_SEKON, swr: true }
)
