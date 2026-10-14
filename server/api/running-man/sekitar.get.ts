/** GET /api/running-man/sekitar — satu klip beserta tetangganya di arsip.
 *
 *  Dipakai bagian "Klip lain" di halaman satu klip untuk slot 2 dan 3: klip
 *  yang berada tepat di atas dan tepat di bawah klip yang sedang ditonton,
 *  di urutan arsip SBS.
 *
 *  Kenapa dicari, bukan dititipkan halaman sebelumnya: tetangga yang benar
 *  hanya bisa diketahui kalau posisi klip itu di arsip diketahui, dan SBS
 *  tidak menyediakan cara menanyakannya. Yang ada hanya "berikan klip ke
 *  sekian", jadi posisinya harus dicari — dan cara mencarinya adalah
 *  pencarian biner atas tanggal, karena arsipnya urut menurun menurut
 *  tanggal. Lihat `cariPosisiTanggal` di
 *  `server/utils/running-man/klip.ts`.
 *
 *  Dulu tetangganya dititipkan oleh daftar yang barusan diketuk. Itu benar
 *  selama daftarnya urut — tapi begitu orang berpindah klip lewat "Klip
 *  lain", daftar itu daftar acak, dan yang disebut tetangga jadi acak juga.
 *  Yang terlihat: klip dari 2020 dan 2015 berdampingan dengan klip 2026.
 *
 *  Ongkosnya sekitar 15 permintaan ke SBS untuk klip yang belum pernah
 *  dicari: 14 pencarian biner (masing-masing satu klip, ±2 KB) dan satu blok
 *  100 klip di sekitar posisinya. Hasilnya dicache 10 menit, dan titik-titik
 *  yang sudah diprobe diingat proses server — jadi klip kedua dari episode
 *  yang sama jauh lebih cepat.
 *
 *  Parameter:
 *  - `id`       id klip yang sedang ditonton.
 *  - `tanggal`  tanggal tayangnya, `YYYY-MM-DD` — dipakai untuk mencari
 *               posisinya. Tanggal ini datang dari titipan daftar; tanpa
 *               itu pencariannya tidak bisa dijalankan, dan endpoint ini
 *               mengembalikan kosong. */

/** Berapa klip yang diperiksa di sekitar posisi yang ditemukan.
 *
 *  Satu tanggal bisa berisi puluhan klip (satu episode menghasilkan banyak
 *  klip), jadi posisi yang ditemukan pencarian biner belum tentu klipnya
 *  sendiri. Seratus cukup untuk memuat seluruh blok satu tanggal, dan kalau
 *  ternyata tidak memuat klipnya, diperiksa sekali lagi dengan jendela yang
 *  lebih lebar — bukan langsung menyerah. */
const JENDELA = 100

/** Berapa lama hasilnya boleh dipakai. 10 menit: tetangga sebuah klip tidak
 *  berubah selama itu, dan SBS menambah klip baru paling cepat seminggu
 *  sekali. */
const TTL_SEKON = 600

interface Sekitar {
  klip: Klip | null
  sebelum: Klip | null
  sesudah: Klip | null
}

const KOSONG: Sekitar = { klip: null, sebelum: null, sesudah: null }

/** Mencari satu klip lewat idnya di sekitar satu offset. */
async function cariDiSekitar(
  offset: number,
  limit: number,
  id: string
): Promise<{ klip: Klip; sebelum: Klip | null; sesudah: Klip | null } | null> {
  const mulai = Math.max(0, offset - Math.floor(limit / 2))

  const blok = await ambilKlip(mulai, limit, SORT_TERBARU)

  const posisi = blok.findIndex(satu => satu.id === id)

  if (posisi < 0) return null

  return {
    klip: blok[posisi]!,
    /* Tetangga diambil dari blok yang sama, dan urutannya sudah urutan
     * arsip — jadi yang di indeks sebelumnya memang yang lebih baru. */
    sebelum: blok[posisi - 1] ?? null,
    sesudah: blok[posisi + 1] ?? null
  }
}

export default defineCachedEventHandler(
  async (event): Promise<Sekitar> => {
    const query = getQuery(event)

    const id = String(query.id || '')
    const tanggal = String(query.tanggal || '')

    /* Bentuk yang salah ditolak lebih awal, bukan diteruskan ke pencarian
     * yang akan membuang 14 permintaan untuk hasil yang pasti kosong. */
    if (!/^[A-Za-z0-9]{4,}$/.test(id)) return KOSONG
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return KOSONG

    try {
      const posisi = await cariPosisiTanggal(tanggal)

      /* Dua percobaan: jendela biasa, lalu jendela yang lebih lebar kalau
       * klipnya belum ketemu. Yang kedua hanya jalan kalau yang pertama
       * gagal, jadi ongkosnya tidak dibayar tiap kali. */
      for (const lebar of [JENDELA, JENDELA * 2]) {
        const hasil = await cariDiSekitar(posisi, lebar, id)

        if (hasil) return hasil
      }
    } catch (error) {
      /* Sama seperti endpoint klip yang lain: gagal mengambil dari SBS
       * tidak boleh menjatuhkan halaman. Bagian tetangganya cukup kosong,
       * dan halaman mengisinya dengan klip acak. */
      console.warn('[sekitar] gagal mencari tetangga:', error)
    }

    return KOSONG
  },
  { name: 'running-man-sekitar', maxAge: TTL_SEKON }
)
