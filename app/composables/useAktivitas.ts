/** Riwayat aktivitas: peristiwa yang diumumkan ke orang, disimpan di peramban.
 *
 *  Bedanya jelas dengan toast. Toast di `useNotifications.ts` muncul enam
 *  detik lalu hilang tanpa jejak; yang di sini bertahan berbulan-bulan,
 *  supaya orang tahu ada yang terjadi ketika dia tidak sedang membuka
 *  halaman itu — itu memang tujuannya, dan tanpa penyimpanan apa pun
 *  tanpa penyimpanan apa pun mustahil: begitu tab ditutup, isinya ikut
 *  hilang.
 *
 *  **Yang dicatat hanya peristiwa yang memang diumumkan.** Sumbernya
 *  `useEpisodeBaru.ts`, di tempat toast-nya berbunyi. Bukan catatan
 *  kunjungan halaman: riwayat orang membuka halaman mana bukan kabar yang
 *  perlu disimpan, dan mengumpulkannya berarti membangun pelacak tanpa
 *  ada yang memintanya.
 *
 *  **Isinya kunci locale, bukan teks jadi.** Itu yang membuat riwayat lama
 *  ikut diterjemahkan ulang saat orang mengganti bahasa — disimpan sebagai
 *  kalimat, entri dari bulan lalu terkunci di bahasa saat itu dibuat.
 *  `t()` dipanggil ulang di tempat yang ditampilkan, bukan di tempat
 *  dicatat.
 *
 *  Karena itu daftar ini tidak bisa menyimpan jenis pesan sebagai teks
 *  bebas. Yang disimpan `episode_baru.satu` beserta `{ nomor: 823 }`, dan
 *  pemanggilnya yang memutuskan artinya.
 *
 *  Sepadan dengan `useLabelEpisode.ts`: satu kunci `localStorage`, dibaca di
 *  `onMounted`, isinya dibuang kalau tidak bisa dipercaya. Bedanya di sini
 *  bukan berbentuk objek tunggal melainkan larik, jadi yang dibuang satu per
 *  satu dan bukan seluruh isinya — satu baris rusak tidak boleh menghapus
 *  lima puluh baris yang sehat.
 *
 *  Dibatasi 50 entri, sekitar 7,5 KB. Cukup untuk beberapa bulan, dan
 *  berbatas supaya `localStorage` tidak tumbuh diam-diam sampai menarik
 *  perhatian, tanpa membuat daftarnya terlalu panjang untuk dibaca satu
 *  layar. */

import { computed, ref } from 'vue'

/** Satu peristiwa yang pernah diumumkan. */
export interface CatatanAktivitas {
  /** Unik. Dipakai `:key` di `v-for`. */
  id: number
  /** Kunci locale, misalnya `episode_baru.satu`. */
  kunci: string
  /** Parameter untuk kunci itu, misalnya `{ nomor: 823 }`. */
  param: Record<string, string | number>
  /** Kapan dicatat, epoch milidetik. */
  pada: number
  /** Sudah dibaca atau belum. */
  dibaca: boolean
}

/** Kunci localStorage. Pakai isi, bukan nama produk — sama seperti
 *  `label-episode` di `useLabelEpisode.ts` dan `slot-tengah` di
 *  `useMiddleSlot.ts`. */
const KUNCI_SIMPAN = 'aktivitas'

/** Berapa entri yang disimpan. */
const BATAS_MAKS = 50

/* Module-level, bukan `useState`.
 *
 * Sengaja: `useState` ikut ter-serialize ke payload SSR, dan daftar ini
 * berasal dari `localStorage` — yang hanya ada di browser. Kalau ikut
 * ter-serialize, isi satu orang terkirim ke HTML yang dilihat orang lain
 * pada server yang sama.
 *
 * `siap` tetap `ref` biasa dan tidak ikut ke payload, justru supaya server
 * selalu merender daftar kosong dan browser mengisinya setelah terpasang.
 * Kalau dibalik, HTML kiriman server dan hasil render browser berbeda dan
 * Vue mencatat error hydration — hal yang sama yang dicegah di
 * `useLabelEpisode.ts:76-81`. */
const daftar = ref<CatatanAktivitas[]>([])

/** Isinya sudah dibaca dari peramban atau belum. */
const siap = ref(false)

/** Counter id. Diisi ulang dari isi yang tersimpan, supaya id baris lama
 *  tidak pernah dipakai ulang. */
let penghitung = 0

let sudahDipasang = false

/** Buang yang tidak bisa dipakai, satu per satu.
 *
 *  `localStorage` bisa diubah dari console peramban, jadi isinya bukan hal
 *  yang perlu dipercaya begitu masuk. Yang bentuknya salah dilewati, bukan
 *  membuat seluruh larik ditolak — satu baris rusak tidak boleh menghapus
 *  lima puluh baris yang sehat. */
function rapikan(nilai: unknown): CatatanAktivitas[] {
  const hasil: CatatanAktivitas[] = []

  if (!Array.isArray(nilai)) return hasil

  let tertinggi = 0

  for (const satu of nilai) {
    if (!satu || typeof satu !== 'object') continue

    const { id, kunci, param, pada, dibaca } = satu as Record<string, unknown>

    /* `typeof` yang mempersempit tipe, bukan `Number.isInteger()` —
     * `Number.isInteger` mengembalikan boolean, bukan `nilai is number`, dan
     * TypeScript hanya bisa persuaded oleh yang pertama. Sama seperti
     * catatan di `server/utils/running-man/jadwal.ts:90-94`. */
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) continue
    if (typeof kunci !== 'string' || kunci === '') continue
    if (typeof pada !== 'number' || !Number.isFinite(pada)) continue

    const bersih: Record<string, string | number> = {}

    if (param && typeof param === 'object') {
      for (const [k, v] of Object.entries(param)) {
        if (typeof v === 'string' || typeof v === 'number') bersih[k] = v
      }
    }

    if (id > tertinggi) tertinggi = id

    hasil.push({ id, kunci, param: bersih, pada, dibaca: dibaca === true })
  }

  /* Diisi SETELAH baris yang tidak terbaca ikut terlewati: kalau baris
   * termurah id-nya besar, penghitung harus melewati angka itu, bukan
   * berhenti di jumlah baris yang lolos. */
  penghitung = tertinggi

  return hasil.slice(0, BATAS_MAKS)
}

/** Membaca dari peramban. Hanya di browser — `localStorage` tidak ada di
 *  server, dan membacanya di sana akan membuat seluruh render gagal. */
function muat() {
  if (typeof window === 'undefined') return

  const mentah = localStorage.getItem(KUNCI_SIMPAN)

  /* Isinya bisa saja bukan JSON. Melempar error di sini akan membuat
   * seluruh halaman gagal terpasang, dan yang hilang cuma catatan aktivitas.
   * Jadi isinya dibuang, bukan halaman. */
  let tersimpan: unknown = null

  try {
    tersimpan = mentah ? JSON.parse(mentah) : null
  } catch {
    tersimpan = null
  }

  daftar.value = rapikan(tersimpan)

  siap.value = true
}

function tulis() {
  if (typeof window === 'undefined') return

  localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(daftar.value))
}

/** Memastikan isi sudah ada di memori sebelum apa pun mengubahnya.
 *
 *  Ada karena urutan pemanggilan di aplikasi tidak bisa diandalkan.
 *  `useEpisodeBaru` — satu-satunya pemanggil `catat()` — dipanggil dari
 *  `app.vue`, dan pemeriksaan di dalamnya berjalan di `onMounted` yang
 *  `async`. Kalau `catat()` sampai lebih dulu, ia akan menambahkan satu baris
 *  ke larik yang masih kosong lalu **menimpanya** ke `localStorage` — dan
 *  seluruh riwayat yang ada hilang, tanpa satu pun error.
 *
 *  `onMounted` di bawah sudah menutup sebagian dari masalah itu, tapi
 *  "sebagian" bukan jaminan. Yang dijamin di sini. */
function pastikanSiap() {
  if (siap.value) return

  muat()
}

export function useAktivitas() {
  if (import.meta.client && !sudahDipasang) {
    sudahDipasang = true

    onMounted(() => {
      muat()
    })
  }

  /** Mencatat satu peristiwa baru, belum terbaca.
   *
   *  Yang baru di depan, karena urutannya dibaca dari atas. */
  function catat(kunci: string, param: Record<string, string | number> = {}) {
    pastikanSiap()

    daftar.value = [
      { id: ++penghitung, kunci, param, pada: Date.now(), dibaca: false },
      ...daftar.value
    ].slice(0, BATAS_MAKS)

    tulis()
  }

  /** Menandai semua terbaca. Dipanggil halaman riwayat yang sedang dibuka —
   *  bukan saat popup-nya dibuka, karena yang terlihat di popup cuma
   *  ringkasan, dan badge yang langsung hilang begitu popornya tampak tidak
   *  memberi tahu apa pun. */
  function tandaiSemua() {
    pastikanSiap()

    if (!daftar.value.some(satu => !satu.dibaca)) return

    daftar.value = daftar.value.map(satu => ({ ...satu, dibaca: true }))

    tulis()
  }

  function kosongkan() {
    pastikanSiap()

    if (daftar.value.length === 0) return

    daftar.value = []

    tulis()
  }

  return {
    daftar,
    siap,
    /** Berapa yang belum dibaca. Angka di badge lonceng. */
    belumDibaca: computed(() => daftar.value.filter(satu => !satu.dibaca).length),
    catat,
    tandaiSemua,
    kosongkan
  }
}