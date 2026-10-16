/** Klip tayang Running Man.
 *
 *  Diambil dari `/api/running-man/clips`, yang mengambilnya dari SBS dan
 *  menyimpannya sebentar di cache server. Halaman tidak pernah menyentuh
 *  SBS secara langsung.
 *
 *  Dipakai tiga halaman, dan masing-masing meminta banyak klip yang berbeda:
 *
 *    beranda          menampilkan 3 baris      -> 20 klip
 *    daftar klip      tiap pemuatan            -> 100 klip
 *    satu klip        mencari satu id          -> 100 klip
 *
 *  Daftar klip memakai ukuran yang sama untuk pemuatan pertama dan tiap
 *  gulir: tiap kali bertambah 100, jadi 100 lalu 200 lalu 300, sampai SBS
 *  berhenti mengirim. Seragam begini dipilih supaya tiap gulir sama
 *  beratnya — dan karena itu, pemuatan pertamanya pun ringan tanpa perlu
 *  angka khusus, padahal justru angka pertama yang ikut masuk ke HTML dan
 *  menunda apa pun terlihat.
 *
 *  Mengembalikan `Ref`, bukan larik biasa, dan itu bukan pilihan gaya.
 *  Berpindah tab hanya mengubah query pada route yang sama — komponennya
 *  dipakai ulang, `<script setup>` tidak jalan lagi, dan apa pun yang
 *  disalin keluar saat itu tetap milik urutan yang lama. Kunci `useAsyncData`
 *  karena itu ditulis sebagai fungsi, bukan teks: kunci yang reaktif
 *  diawasi, sedangkan kunci teks diam.
 *
 *  Sifatnya `async` untuk pemanggilan pertamanya, jadi pemanggilnya menulis
 *  `await`:
 *
 *    const clips = await useRunningManClips()
 *
 *  Kunci cache ikut urutan **dan** banyaknya: dua halaman yang meminta
 *  angka berbeda tidak boleh saling menimpa hasil cache.
 *
 *  Mengembalikan larik kosong kalau gagal. Pemanggil yang belum siap
 *  menampilkan larik kosong wajib menyembunyikan bagiannya — bukan
 *  menampilkan judul dengan isi kosong di bawahnya. */

import type { Ref } from 'vue'

import type { Klip } from '#shared/types/klip'

/** Urutan yang dikenal, dengan nama yang sama seperti di query URL. */
export type UrutanKlip = 'terbaru' | 'terlama' | 'terpopuler'

const URUTAN_KLIP: UrutanKlip[] = ['terbaru', 'terlama', 'terpopuler']

/** Nilai urutan dari query, atau `terbaru` kalau tidak dikenal.
 *
 *  Query bisa berupa larik kalau orang menulis `?urutan=a&urutan=b`, jadi
 *  yang diambil elemen pertamanya — bukan seluruh lariknya, yang tidak akan
 *  cocok dengan apa pun. */
export function urutanKlip(nilai: unknown): UrutanKlip {
  const teks = Array.isArray(nilai) ? nilai[0] : nilai

  return URUTAN_KLIP.includes(teks as UrutanKlip) ? (teks as UrutanKlip) : 'terbaru'
}

/** Banyak klip tiap pemuatan di halaman daftar — pertama maupun saat
 *  menggulir, keduanya sama.
 *
 *  Seratus berarti sekitar 42 KB dan tiga belas layar penuh di ponsel, jadi
 *  tidak akan ada jeda kosong saat menggulir. Angka ini juga yang menentukan
 *  berapa kali perlu menggulir untuk sampai ujung: arsip `예고보기` berisi
 *  sekitar 8.820 klip, jadi sekitar 88 kali.
 *
 *  Ukuran ini juga patokan "sudah sampai ujung": balasan yang lebih pendek
 *  dari yang diminta berarti tidak ada lagi. */
export const HALAMAN_DAFTAR = 100

/** Banyak klip yang diminta beranda.
 *
 *  Beranda menampilkan tiga sekaligus, dan limabelas tersedia di dalam
 *  kotak yang bisa digulir. Dua puluh memberi cadangan untuk keduanya
 *  tanpa membuat beranda mengangkut ratusan klip yang tidak akan
 *  dilihat siapa pun. */
export const HALAMAN_BERANDA = 20

/** Banyak klip yang diminta halaman satu klip, untuk bagian "Klip lain".
 *
 *  Lima belas, sekali, tanpa pemuatan berikutnya. Ini halaman klip, jadi
 *  isinya memang menonton dan berpindah klip — jumlahnya tidak dibatasi
 *  seperti bagian di beranda. Tapi juga tidak dimuat semuanya: pemutarnya
 *  harus tetap dekat dengan puncak halaman, dan daftar di bawahnya bukan
 *  halaman arsip. */
export const HALAMAN_LAIN = 15

/** Alamat halaman klip di SBS.
 *
 *  Dibentuk dari id, bukan diambil dari daftar. Ini yang membuat halaman
 *  satu klip bisa dibuka untuk klip mana pun, termasuk yang belum pernah
 *  dimuat daftarnya — sebelumnya halaman itu mencari klipnya di daftar
 *  lebih dulu, dan klip ke-151 ke atas berakhir 404 tanpa alasan.
 *
 *  `64958` adalah id bagian `예고보기`. Angka itu tidak menentukan klip mana
 *  yang ditampilkan — diuji, `clip/64958/<id>` dan `clip/64959/<id>`
 *  menghasilkan halaman yang sama untuk id yang sama; yang menentukan
 *  hanyalah id di ujung alamat. */
export function tautanKlip(id: string): string {
  return `https://programs.sbs.co.kr/enter/runningman/clip/64958/${id}`
}

/** Klip yang barusan diketuk di daftar.
 *
 *  Yang dipakai dari titipan ini dua hal: **judulnya** — judul hanya ada di
 *  data daftar, sedangkan halaman klip bisa dibuka untuk klip yang jauh di
 *  belakang arsip — dan **tanggalnya**, yang dipakai untuk mencari tetangga
 *  di arsip lewat `useKlipSekitar`.
 *
 *  Tetangganya dulu ikut dititipkan dari sini, dan itu salah. Titipan datang
 *  dari daftar yang barusan diketuk, sedangkan daftar itu adalah daftar
 *  **acak** begitu orang berpindah klip lewat "Klip lain" — jadi yang disebut
 *  tetangga ikut acak, dan yang terlihat: klip 2020 dan 2015 muncul
 *  berdampingan dengan klip 2026. Sekarang tetangganya dicari, bukan
 *  dititipkan.
 *
 *  Alternatifnya menaruh judulnya di URL, dan itu salah: judulnya Bahasa
 *  Korea sepanjang satu kalimat, dan URL yang panjang serta berisi teks itu
 *  jelek untuk dibagikan. */
export const klipDiketuk = ref<Klip | null>(null)

/** Klip yang sedang ditonton beserta tetangganya di arsip.
 *
 *  Tetangganya tidak bisa diketahui halaman ini sendiri: SBS tidak punya
 *  cara menjawab "klip ini nomor berapa di urutannya" — yang ada hanya
 *  "berikan klip ke sekian". Jadi server yang mencarinya, dengan pencarian
 *  biner atas tanggal, dan hasilnya dicache.
 *
 *  `tanggal` datang dari titipan daftar, dan tanpa itu pencariannya tidak
 *  bisa dijalankan: halaman yang dibuka lewat tautan langsung tidak punya
 *  tanggal, jadi tetangganya kosong dan bagian "Klip lain" mengisinya
 *  dengan klip acak supaya jumlah barisnya tetap sama.
 *
 *  Kuncinya memuat id, dan itu berbeda dari kunci `useKlipAcak`: berpindah
 *  klip **harus** mengambil tetangga yang baru, karena tetangganya memang
 *  berpindah. Yang dijaga supaya tidak berubah saat berpindah itu daftar
 *  acaknya, bukan tetangganya. */
export interface Sekitar {
  klip: Klip | null
  sebelum: Klip | null
  sesudah: Klip | null
}

export async function useKlipSekitar(
  id: () => string,
  tanggal: () => string
): Promise<Ref<Sekitar | null>> {
  const { data } = await useAsyncData<Sekitar>(
    () => `running-man-sekitar-${id()}`,
    () =>
      $fetch<Sekitar>('/api/running-man/sekitar', {
        query: { id: id(), tanggal: tanggal() }
      })
  )

  return computed(() => data.value ?? null)
}

/** Klip berurutan untuk daftar dan beranda.
 *
 *  `limit` berbeda menurut pemakainya: beranda 20 (isinya tiga baris), daftar
 *  klip `HALAMAN_DAFTAR`, bagian "Klip lain" tidak memakai ini karena ia
 *  mengambil dari endpoint acak.
 *
 *  Kuncinya ditulis sebagai FUNGSI, bukan teks, dan itu bukan pilihan gaya:
 *  `useAsyncData` mengawasi kunci yang reaktif dan mengabaikan kunci teks.
 *  Dengan kunci teks, berpindah tab urutan tidak memuat apa pun lagi —
 *  `?urutan=terlama` tetap menampilkan daftar terbaru. */
export async function useRunningManClips(
  limit: number = HALAMAN_DAFTAR
): Promise<Ref<Klip[]>> {
  const route = useRoute()

  const { data } = await useAsyncData<Klip[]>(
    () => `running-man-clips-${urutanKlip(route.query.urutan)}-${limit}`,
    () =>
      $fetch<Klip[]>('/api/running-man/clips', {
        query: { urutan: urutanKlip(route.query.urutan), limit }
      })
  )

  return computed(() => data.value || [])
}

/** Klip acak untuk bagian "Klip lain" di halaman satu klip.
 *
 *  Dimuat halaman itu sendiri, tidak dititipkan halaman sebelumnya: klip bisa
 *  dibuka dari beranda yang daftarnya cuma dua puluh, dan kalau titipan yang
 *  dipakai, isinya berbeda-beda menurut dari mana klipnya dibuka.
 *
 *  `kecuali` adalah daftar id yang tidak boleh ikut undian — klip yang sedang
 *  ditonton dan dua tetangganya yang sudah tampil di slot 2 dan 3. Dikirim ke
 *  server supaya jumlah yang diminta tetap terpenuhi: yang disingkirkan di
 *  sana digantikan undian lain, bukan dibiarkan kosong.
 *
 *  Kuncinya tetap, tanpa id: berpindah dari klip ke klip tidak mengocok ulang
 *  daftarnya. Daftar yang berubah persis saat orang sedang menekannya terasa
 *  seperti halaman yang rusak. */
export async function useKlipAcak(kecuali: () => string[]): Promise<Ref<Klip[]>> {
  const { data } = await useAsyncData<Klip[]>(
    'running-man-klip-acak',
    () =>
      $fetch<Klip[]>('/api/running-man/acak', {
        query: { n: HALAMAN_LAIN, pertama: 1, kecuali: kecuali().join(',') }
      })
  )

  return computed(() => data.value || [])
}

/* Pemuatan berikutnya saat menggulir.
 *
 * Dipakai halaman daftar klip saja. Beranda tidak memakainya — isinya tiga
 * baris dan tidak pernah menggulir — dan bagian "Klip lain" juga tidak:
 * isinya lima belas sekali, tanpa pemuatan berikutnya.
 *
 * Pengintainya ada DI SINI, bukan di halaman, supaya halaman tidak
 * menulisnya sendiri. Yang perlu dilakukan halaman cuma mengikat `penanda`
 * yang dikembalikan ke elemen di ujung daftarnya.
 *
 * Tidak ada batas berapa banyak klip yang boleh terkumpul. Yang praktis
 * membatasinya peramban, bukan SBS. */
export function useMuatKlipLagi(daftar: Ref<Klip[]>) {
  const ukuran = HALAMAN_DAFTAR

  const route = useRoute()

  const sedang = ref(false)
  const habis = ref(false)

  /* Elemen setinggi nol yang diletakkan halaman di ujung daftarnya. */
  const penanda = ref<HTMLElement | null>(null)

  let pengintai: IntersectionObserver | null = null

  /* Berpindah urutan berarti daftar baru, jadi penanda "sudah sampai
   * ujungnya" juga harus kembali ke awal. Tanpa ini, urutan yang sudah habis
   * lalu diganti ke yang lain akan langsung berhenti memuat. */
  watch(
    () => urutanKlip(route.query.urutan),
    () => {
      habis.value = false
    }
  )

  async function muatLagi() {
    if (sedang.value || habis.value) return

    sedang.value = true

    try {
      const tambahan = await $fetch<Klip[]>('/api/running-man/clips', {
        query: {
          urutan: urutanKlip(route.query.urutan),
          offset: daftar.value.length,
          limit: ukuran
        }
      })

      /* Disaring dari yang sudah tampil. Jaring pengaman kalau offset dan
       * ukurannya suatu saat salah hitung — lebih baik satu baris hilang
       * daripada klip yang sama muncul dua kali di satu daftar. */
      const baru = tambahan.filter(
        satu => !daftar.value.some(sudah => sudah.id === satu.id)
      )

      daftar.value.push(...baru)

      /* Balasan yang lebih pendek dari yang diminta berarti arsipnya sudah
       * habis. */
      if (tambahan.length < ukuran) habis.value = true
    } catch {
      /* Gagal di sini sengaja tidak menyalakan `habis`. Kalau berhenti
         selamanya, satu gangguan sesaat membuat daftar tidak pernah bisa
         ditambah lagi. Pengintainya hanya memicu lagi saat penandanya masuk
         layar lagi, jadi tidak ada permintaan bertubi. */
    } finally {
      sedang.value = false
    }
  }

  onMounted(() => {
    /* Pengintai tidak ada di peramban lama. Daftar halaman pertama tetap
     * tampil — yang hilang cuma pemuatan berikutnya, bukan isinya. */
    if (!('IntersectionObserver' in window)) return

    pengintai = new IntersectionObserver(
      masuk => {
        if (masuk[0]?.isIntersecting) muatLagi()
      },
      /* Dimulai 400px sebelum ujungnya terlihat, jadi orang tidak pernah
       * menunggu daftarnya penuh untuk bisa menggulir lagi. */
      { rootMargin: '400px' }
    )

    if (penanda.value) pengintai.observe(penanda.value)
  })

  onBeforeUnmount(() => {
    pengintai?.disconnect()
    pengintai = null
  })

  return { sedang, habis, muatLagi, penanda }
}
