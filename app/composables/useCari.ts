/** Pencarian yang menyatukan empat sumber.
 *
 *  Halaman, anggota cast, dan episode dicari di browser. Klip dicari di
 *  server karena arsipnya ribuan baris. Semuanya diberi skor dengan
 *  fungsi yang sama (`shared/utils/cari.ts`), lalu digabung dan dipecah
 *  per kelompok.
 *
 *  Yang diurus di sini juga keadaan: kueri yang di-debounce, status
 *  indeks klip, percobaan ulang selama indeks masih disiapkan, dan
 *  keadaan offline. Satu fungsi `tentukanKeadaan` memutuskan pesan mana
 *  yang menang; template tidak menghitung sendiri.
 */

import type { Episode } from '#shared/types/episode'
import type {
  HasilCari,
  JawabanCari,
  StatusIndeksKlip
} from '#shared/types/cari'
import {
  buatBidang,
  siapkanKueri,
  skorBidang,
  sorotan,
  bandingKandidat,
  tentukanKeadaan,
  terlaluPendek,
  type PotonganSorot
} from '#shared/utils/cari'

import type { KandidatStatis } from './useCariHalaman'

/** Jeda setelah ketikan terakhir. Cukup untuk menampung orang yang
 *  mengetik cepat, cukup pendek untuk tidak terasa lambat. */
const JEDA_KETIK = 300

/** Batas tampil per kelompok. Total kecocokan tetap dihitung penuh. */
const BATAS: Record<string, number> = {
  halaman: 5,
  anggota: 8,
  episode: 10,
  klip: 20
}

const URUTAN_JENIS = ['halaman', 'anggota', 'episode', 'klip'] as const

/** Berapa kali hasil boleh dicoba ulang selama indeks belum lengkap. */
const MAKS_POLL = 12

const JEDA_POLL_KOSONG = 2000
const JEDA_POLL_SEBAGIAN = 3000

/** Cache kueri di memori. Bukan untuk menghemat CPU — pencariannya
 *  cepat — tapi supaya kembali ke kueri sebelumnya tidak memunculkan
 *  keadaan memuat lagi. Umurnya pendek karena indeks bisa bertambah. */
const SIMPANAN = new Map<string, { pada: number; jawaban: JawabanCari }>()
const UMUR_SIMPANAN = 60_000
const BATAS_SIMPANAN = 50

const KOSONG: JawabanCari = {
  kandidat: [],
  jumlah: 0,
  status: {
    keadaan: 'kosong',
    terindeks: 0,
    diperbarui: null,
    sedang: false,
    galat: false
  }
}

/** Status awal sebelum server pernah menjawab. */
const STATUS_AWAL: StatusIndeksKlip = { ...KOSONG.status }

/** Hasil yang sudah punya potongan sorotan.
 *
 *  Sorotan dihitung sekali saat hasil dibentuk, bukan di template. Kalau
 *  dihitung saat render, regex yang sama dijalankan ulang setiap kali
 *  komponen diperbarui. */
export interface HasilTampil extends HasilCari {
  sorot: PotonganSorot[]
  /** Sorotan untuk keterangan. Kosong kalau judul sudah punya kecocokan
   *  — supaya tanggal dan durasi tidak ikut dipenuhi tanda saat yang
   *  dicari sebenarnya ada di judul. */
  sorotKeterangan: PotonganSorot[]
  /** Ekor keterangan yang sengaja tidak bisa dicari.
   *
   *  Dipakai anggota cast: nama Korea-nya tetap bisa disorot, kalimat
   *  `sapaan` di belakangnya tetap tampil tapi tidak pernah jadi alasan
   *  hasil itu muncul. Kalau tidak dipisah, `q=ma` akan menyorot
   *  "**ma**najer" di baris kedua padahal "manajer" bukan field
   *  pencarian — sorotan yang menunjuk sesuatu yang tidak berperan.
   *
   *  Bukan string yang boleh disorot, jadi sengaja tidak ikut masuk
   *  `sorotKeterangan`. */
  keteranganSisa?: string
}

interface Kelompok {
  jenis: string
  label: string
  daftar: HasilTampil[]
  semua: HasilTampil[]
  total: number
}

/** Permintaan episode yang sedang jalan, dibagi antar pemanggil. */
let episodeSedang: Promise<void> | null = null

/** Waktu kegagalan episode terakhir, untuk cooldown. */
let episodeGagalPada = 0

/** Episode hanya perlu dimuat kalau kuerinya memang bisa mencocokkan.
 *
 *  Daftar episode tidak punya judul per episode — isinya nomor, label
 *  subtitle, dan kualitas. Kueri seperti `jihyo` atau `pengaturan` tidak
 *  akan pernah menemukan apa pun di sana, jadi meminta daftarnya hanya
 *  menambah satu permintaan yang hasilnya kosong.
 *
 *  `에피소드` ikut di sini karena itu kata yang dipakai proyek sendiri
 *  sebagai judulnya: `cari.episode` di locale `ko` bernilai
 *  `에피소드 {nomor}`, dan `useCariHalaman.ts` sudah memakainya sebagai
 *  alias halaman episode. Tanpa baris ini, orang Korea yang mengetik
 *  `에피소드` hanya melihat hasil halaman — daftar episode-nya sendiri
 *  tidak pernah diambil, karena gerbang ini tidak mengenali kata itu.
 *
 *  Sudah diuji: kalau daftarnya ada, `에피소드` cocok dengan skor 998
 *  dan `에피소드 5` dengan 1200. Yang hilang cuma jalurnya — daftar
 *  episode yang tidak pernah diminta sama sekali. */
function perluEpisode(kueri: string): boolean {
  return (
    /[0-9]/.test(kueri) ||
    /\bep(?:isode)?\b/i.test(kueri) ||
    /[회화]/.test(kueri) ||
    kueri.includes('에피소드')
  )
}

export function useCari() {
  const { t, locale } = useI18n()
  const { kueriBersih } = useSearchOverlay()
  const sumber = useCariHalaman()

  /** Kueri yang sudah melewati jeda ketik. Semua permintaan dan hasil
   *  memakai nilai ini, bukan `kueri` langsung. */
  const qTunda = ref(kueriBersih.value)

  let timerKetik: ReturnType<typeof setTimeout> | null = null

  watch(kueriBersih, nilai => {
    if (timerKetik) clearTimeout(timerKetik)

    timerKetik = setTimeout(() => {
      qTunda.value = nilai
    }, JEDA_KETIK)
  })

  /** Menyelesaikan jeda sekarang juga. Dipakai saat Enter ditekan dan
   *  saat URL berubah lewat back/forward, supaya halaman tidak
   *  menampilkan hasil lama selama 300 ms. */
  function selesaikanKetik() {
    if (timerKetik) {
      clearTimeout(timerKetik)
      timerKetik = null
    }

    qTunda.value = kueriBersih.value
  }

  /* --- Episode -------------------------------------------------
   *
   * Hanya dimuat di browser. Halaman pencarian tidak boleh menunggu
   * build abyss lima detik sebelum menampilkan apa pun; hasil halaman
   * dan cast sudah cukup untuk layar pertama. */

  const episode = useState<Episode[] | null>('cari-episode', () => null)
  const episodeMemuat = useState<boolean>('cari-episode-memuat', () => false)
  const episodeGalat = useState<boolean>('cari-episode-gagal', () => false)

  async function muatEpisode(): Promise<void> {
    if (!import.meta.client) return
    if (episode.value?.length || episodeSedang) return
    if (Date.now() - episodeGagalPada < 60_000) return

    episodeMemuat.value = true

    episodeSedang = $fetch<Episode[]>('/api/running-man/episode')
      .then(daftar => {
        episode.value = daftar
        episodeGalat.value = false
      })
      .catch(() => {
        /* Kegagalan daftar episode tidak menjatuhkan pencarian. Halaman
         * dan cast tetap bisa dicari; kelompok episode saja yang
         * memberi tahu bahwa sumbernya tidak tersedia. */
        episodeGalat.value = true
        episodeGagalPada = Date.now()
      })
      .finally(() => {
        episodeMemuat.value = false
        episodeSedang = null
      })

    return episodeSedang
  }

  watch(
    qTunda,
    nilai => {
      if (nilai && !terlaluPendek(nilai) && perluEpisode(nilai)) {
        void muatEpisode()
      }
    },
    { immediate: true }
  )

  /* --- Kandidat episode ---------------------------------------- */

  const kandidatEpisode = computed<KandidatStatis[]>(() =>
    (episode.value ?? []).map(satu => {
      const judul = t('cari.episode', { nomor: satu.nomor })

      const keterangan =
        [satu.label, satu.resolusi.join(' · ')].filter(Boolean).join(' · ') ||
        t('cari.episode_tersedia')

      return {
        jenis: 'episode',
        id: `episode:${satu.nomor}`,
        judul,
        keterangan,
        rute: 'running-man-episode-streaming',
        query: { ep: String(satu.nomor) },
        lencana: String(satu.nomor),
        bidang: [
          buatBidang(judul, 1, true),
          buatBidang(
            `episode ${satu.nomor} ep ${satu.nomor} ${satu.nomor}회 ` +
              `${satu.nomor}화 ${String(satu.nomor).padStart(3, '0')} ${satu.acara}`,
            0.8
          ),
          buatBidang(keterangan, 0.4)
        ]
      }
    })
  )

  /* --- Permintaan klip ----------------------------------------- */

  async function ambilJawaban(q: string): Promise<JawabanCari> {
    const tersimpan = SIMPANAN.get(q)

    if (tersimpan && Date.now() - tersimpan.pada < UMUR_SIMPANAN) {
      return tersimpan.jawaban
    }

    const jawaban = await $fetch<JawabanCari>('/api/cari', { query: { q } })

    /* Hanya jawaban yang sudah final yang disimpan. Kalau hasil sebagian
     * ikut dicache, percobaan ulang selama indeks disiapkan akan selalu
     * mendapat salinan lama dan hasil klip tidak pernah bertambah. */
    if (jawaban.status.keadaan === 'lengkap' && !jawaban.status.galat) {
      SIMPANAN.set(q, { pada: Date.now(), jawaban })

      while (SIMPANAN.size > BATAS_SIMPANAN) {
        const kunci = SIMPANAN.keys().next().value

        if (kunci === undefined) break

        SIMPANAN.delete(kunci)
      }
    }

    return jawaban
  }

  /* `server: false` disengaja: halaman hasil tidak perlu menunggu SBS
   * saat dibuka lewat tautan. Hasil halaman dan cast dirender server,
   * hasil klip menyusul setelah halaman tampil. */
  const { data, pending, error, refresh } = useAsyncData<{
    q: string
    jawaban: JawabanCari
  }>(
    () => `cari-klip-${qTunda.value || 'kosong'}`,
    async () => {
      const q = qTunda.value

      if (!q || terlaluPendek(q)) {
        return { q, jawaban: KOSONG }
      }

      return { q, jawaban: await ambilJawaban(q) }
    },
    { server: false, lazy: true }
  )

  /** Jawaban hanya dipakai kalau memang milik kueri yang sedang aktif.
   *
   *  Saat kueri berganti, `data` bisa masih berisi jawaban lama selama
   *  permintaan baru berjalan. Tanpa pemeriksaan ini, klip untuk kueri
   *  lama ikut muncul di bawah kueri baru. */
  const jawaban = computed<JawabanCari | null>(() => {
    const isi = data.value

    if (!isi || isi.q !== qTunda.value) return null

    return isi.jawaban
  })

  /** Status indeks klip — SENGAJA tidak melewati gerbang kueri.
 *
 *  `jawaban` dikunci ke kueri yang sedang aktif supaya kandidat klip
 *  kueri lama tidak muncul di bawah kueri baru. Status indeks tidak
 *  perlu penguncian itu: cakupan arsip tidak bergantung pada apa yang
 *  diketik orang, dan statusnya tidak berubah antar kueri.
 *
 *  Kalau status ikut digerbang, setiap kali ada permintaan yang sedang
 *  berjalan `jawaban` jadi `null`, status jatuh ke `STATUS_AWAL` —
 *  `keadaan: 'kosong'`, `terindeks: 0` — dan halaman menulis "Belum
 *  ditemukan di 0 klip terbaru. Indeks klip masih disiapkan."
 *  Padahal yang sedang disiapkan adalah jawaban kueri itu, bukan
 *  indeksnya. Dua kalimat itu muncul lalu hilang tiap ketikan, dan itu
 *  yang bikin halamannya terlihat melompat-lompat.
 *
 *  `terindeks` juga ikut benar: angka itu menyatakan berapa banyak klip
 *  yang sudah terbaca, dan pembacaan itu milik indeks, bukan milik satu
 *  kueri. */
const status = computed<StatusIndeksKlip>(
  () => data.value?.jawaban.status ?? STATUS_AWAL
)

  /** Apakah jawaban untuk kueri yang sedang aktif sudah datang.
 *
 *  Bedanya dengan "sudah pernah ada jawaban": `data` masih bisa berisi
 *  jawaban kueri yang lalu, dan ketika `data` kosong sama sekali belum
 *  ada yang pernah ditanyakan. Dua-duanya berarti kita belum tahu apa pun
 *  tentang kueri ini — dan `sementara` yang diturunkan dari situ tidak
 *  boleh dibacakan sebagai "hasilnya sudah diketahui dan indeksnya
 *  belum lengkap".
 *
 *  Yang membuat ini terasa bukan sortedness: server tidak pernah
 *  mencari, jadi pada render pertama `data` selalu kosong. Tanpa
 *  penanda ini, setiap halaman yang dibuka lewat tautan langsung akan
 *  menulis "Belum ditemukan di 0 klip terbaru" sebelum satu pun
 *  permintaan terkirim. */
const jawabanSiap = computed(() => Boolean(data.value && data.value.q === qTunda.value))

const totalKlip = computed(() => jawaban.value?.jumlah ?? 0)

  /* --- Skor dan penggabungan ----------------------------------- */

  const formatTanggal = computed(
    () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' })
  )

  const formatAngka = computed(() => new Intl.NumberFormat(locale.value))

  function angka(nilai: number): string {
    return formatAngka.value.format(nilai)
  }

  function durasi(detik: number): string {
    if (!detik || detik < 0) return ''

    const jam = Math.floor(detik / 3600)
    const menit = Math.floor((detik % 3600) / 60)
    const sisa = Math.floor(detik % 60)

    if (jam > 0) {
      return `${jam}:${String(menit).padStart(2, '0')}:${String(sisa).padStart(2, '0')}`
    }

    return `${menit}:${String(sisa).padStart(2, '0')}`
  }

  function tanggalTampil(tanggal: string): string {
    if (!tanggal) return ''

    const waktu = Date.parse(`${tanggal}T00:00:00`)

    return Number.isFinite(waktu) ? formatTanggal.value.format(waktu) : tanggal
  }

  function sorotUntuk(judul: string, keterangan: string, kueriAktif: string) {
    const sorot = sorotan(judul, kueriAktif)

    /* Keterangan hanya disorot kalau judulnya tidak mengandung kueri.
     * Tanpa aturan ini, `q=2` menghiasi setiap tanggal dan durasi klip
     * yang judulnya sudah jelas cocok — kebisingan yang tidak membantu. */
    const sorotKeterangan = sorot.some(satu => satu.cocok)
      ? []
      : sorotan(keterangan, kueriAktif)

    return { sorot, sorotKeterangan }
  }

  function nilai(kueriAktif: string, daftar: KandidatStatis[]): HasilTampil[] {
    const siap = siapkanKueri(kueriAktif)
    const hasil: HasilTampil[] = []

    if (!siap.token.length) return hasil

    for (const satu of daftar) {
      const skor = skorBidang(siap, satu.bidang)

      if (skor === null) continue

      const { bidang, ...tampil } = satu

      hasil.push({
        ...tampil,
        skor,
        ...sorotUntuk(satu.judul, satu.keterangan, kueriAktif)
      })
    }

    return hasil
  }

  function keHasilKlip(
    satu: JawabanCari['kandidat'][number],
    kueriAktif: string
  ): HasilTampil {
    const judul = satu.judul || t('cari.klip_tanpa_judul')

    const keterangan = [
      satu.episode ? t('cari.episode', { nomor: satu.episode }) : '',
      tanggalTampil(satu.tanggal),
      durasi(satu.detik)
    ]
      .filter(Boolean)
      .join(' · ')

    return {
      jenis: 'klip',
      id: `klip:${satu.id}`,
      judul,
      keterangan,
      rute: 'running-man-preview-id',
      params: { id: satu.id },
      tanggal: satu.tanggal,
      gambar: satu.gambar,
      detik: satu.detik,
      skor: satu.skor,
      ...sorotUntuk(judul, keterangan, kueriAktif)
    }
  }

  function klipTampil(kueriAktif: string): HasilTampil[] {
    return (jawaban.value?.kandidat ?? []).map(satu => keHasilKlip(satu, kueriAktif))
  }

  /* --- Halaman kelompok klip ------------------------------------
   *
   * Halaman campuran hanya memuat 20 klip teratas. Halaman kelompok
   * meminta 50 berikutnya setiap kali tombol ditekan. Yang disimpan
   * hanya tambahannya; 20 pertama tetap milik `jawaban`. */

  const BATAS_TAMBAH = 50

  const klipTambahan = ref<HasilTampil[]>([])
  const memuatLagi = ref(false)
  const habisKlip = ref(false)

  /* Kueri berubah berarti hasil tambahan milik kueri lama tidak boleh
   * ikut tampil. */
  watch(qTunda, () => {
    klipTambahan.value = []
    habisKlip.value = false
  })

  const semuaKlip = computed<HasilTampil[]>(() => {
    const dasar = klipTampil(qTunda.value)
    const sudah = new Set(dasar.map(satu => satu.id))
    const tambahan = klipTambahan.value.filter(satu => !sudah.has(satu.id))

    return [...dasar, ...tambahan]
  })

  async function muatKlipLagi(): Promise<void> {
    if (!import.meta.client || memuatLagi.value || habisKlip.value) return

    const q = qTunda.value
    const total = totalKlip.value
    const sudah = semuaKlip.value.length

    if (!q || sudah >= total) {
      habisKlip.value = true
      return
    }

    memuatLagi.value = true

    try {
      const jawab = await $fetch<JawabanCari>('/api/cari', {
        query: { q, offset: sudah, limit: Math.min(BATAS_TAMBAH, total - sudah) }
      })

      /* Kueri bisa berganti selama permintaan berjalan. Hasil untuk
       * kueri lama tidak boleh ditempelkan ke daftar yang baru. */
      if (qTunda.value !== q) return

      const baru = jawab.kandidat.map(satu => keHasilKlip(satu, q))

      klipTambahan.value.push(...baru)

      if (
        semuaKlip.value.length >= jawab.jumlah ||
        jawab.kandidat.length < BATAS_TAMBAH
      ) {
        habisKlip.value = true
      }
    } catch {
      /* Gagal memuat tambahan bukan kegagalan seluruh pencarian. Yang
       * sudah tampil tetap ada; tombolnya bisa ditekan lagi. */
    } finally {
      memuatLagi.value = false
    }
  }

  function urutkan(a: HasilTampil, b: HasilTampil): number {
    return bandingKandidat(
      { skor: a.skor, tanggal: a.tanggal, id: a.id },
      { skor: b.skor, tanggal: b.tanggal, id: b.id }
    )
  }

  /** Semua kecocokan yang tersedia, belum dipotong per kelompok. */
  const cocok = computed<HasilTampil[]>(() => {
    const q = qTunda.value

    if (!q || terlaluPendek(q)) return []

    return [
      ...nilai(q, sumber.value),
      ...nilai(q, kandidatEpisode.value),
      ...klipTampil(q)
    ]
  })

  const kelompok = computed<Kelompok[]>(() => {
    return URUTAN_JENIS.map(jenis => {
      const dasar = cocok.value
        .filter(satu => satu.jenis === jenis)
        .sort(urutkan)

      const semua = jenis === 'klip' ? semuaKlip.value : dasar
      const total = jenis === 'klip' ? totalKlip.value : semua.length

      return {
        jenis,
        label: t(`cari.jenis.${jenis}`),
        daftar: semua.slice(0, BATAS[jenis] ?? 10),
        semua,
        total
      }
    }).filter(satu => satu.total > 0)
  })

  const jumlahHasil = computed(() => {
    const statis = cocok.value.filter(satu => satu.jenis !== 'klip').length

    return statis + totalKlip.value
  })

  /* --- Keadaan ------------------------------------------------- */

  /** Tanda komponen sudah terpasang di peramban.
   *
   *  WAJIB ada sebelum `memuat` dipakai untuk merender. Dua sumber
   *  status di sini hanya bergerak di peramban: `pending` dari
   *  `useAsyncData({ server: false })` langsung menjadi `true` saat
   *  setup berjalan, dan `episodeMemuat` menyala begitu watcher
   *  pierwsanya jalan.
   *
   *  Server merender dengan keduanya `false`. Kalau peramban merender
   *  dengan `true`, satu paragraf “Memperbarui…” ada di satu sisi
   *  saja, anak fragmen tidak bisa dicocokkan, dan hydration gagal
   *  dengan `el.hasAttribute is not a function`. */
  const terpasang = ref(false)

  onMounted(() => {
    terpasang.value = true
  })

  const online = ref(true)

  function saatOnline() {
    online.value = true
  }

  function saatOffline() {
    online.value = false
  }

  onMounted(() => {
    online.value = navigator.onLine

    window.addEventListener('online', saatOnline)
    window.addEventListener('offline', saatOffline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', saatOnline)
    window.removeEventListener('offline', saatOffline)
  })

  /* `memuat` dijaga `terpasang` supaya render pertama di peramban sama
   * persis dengan render server. Setelah halaman terpasang, status
   * memuat tampil seperti biasa. */
  const memuat = computed(() => {
    if (!terpasang.value) return false

    return pending.value || episodeMemuat.value
  })

  const galat = computed(() => Boolean(error.value) || episodeGalat.value)

  const keadaan = computed(() =>
    tentukanKeadaan({
      kueri: qTunda.value,
      jumlahHasil: jumlahHasil.value,
      memuat: memuat.value,
      galat: galat.value,
      indeks: status.value.keadaan,
      terindeks: status.value.terindeks,
      online: online.value
    })
  )

  /* --- Percobaan ulang selama indeks disiapkan -----------------
   *
   * Hanya selama ada kueri aktif dan dokumen terlihat. Batasnya dua
   * belas kali; setelah itu tombol “Coba lagi” yang dipakai, supaya
   * tidak ada permintaan tanpa akhir. */
  let timerPoll: ReturnType<typeof setTimeout> | null = null
  let qPoll = ''
  let sisaPoll = 0

  function aturPoll() {
    if (timerPoll) {
      clearTimeout(timerPoll)
      timerPoll = null
    }

    if (!import.meta.client) return
    if (!qTunda.value || terlaluPendek(qTunda.value)) return
    if (!online.value) return
    if (document.visibilityState !== 'visible') return
    if (pending.value) return
    if (status.value.galat) return
    if (status.value.keadaan === 'lengkap' || status.value.keadaan === 'gagal') return

    if (qPoll !== qTunda.value) {
      qPoll = qTunda.value
      sisaPoll = MAKS_POLL
    }

    if (sisaPoll <= 0) return

    sisaPoll--

    const jeda = status.value.keadaan === 'kosong' ? JEDA_POLL_KOSONG : JEDA_POLL_SEBAGIAN

    timerPoll = setTimeout(() => {
      if (!pending.value) void refresh()
    }, jeda)
  }

  watch([qTunda, status], aturPoll, { immediate: true })

  function saatTerlihat() {
    if (document.visibilityState === 'visible') aturPoll()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', saatTerlihat)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', saatTerlihat)
    if (timerKetik) clearTimeout(timerKetik)
    if (timerPoll) clearTimeout(timerPoll)
  })

  /** Coba lagi untuk kedua sumber yang bisa gagal.
   *
   *  Tombol “Coba lagi” muncul untuk kegagalan klip maupun episode, jadi
   *  ia harus mencoba keduanya — bukan hanya memuat ulang pencarian klip
   *  sementara daftar episode tetap kosong tanpa ada yang menyadarinya. */
  async function cobaLagi() {
    if (episodeGalat.value) {
      episodeGagalPada = 0
      episodeGalat.value = false
      await muatEpisode()
    }

    await refresh()
  }

  return {
    kueriBersih,
    qTunda,
    selesaikanKetik,
    kelompok,
    semuaKlip,
    jumlahHasil,
    keadaan,
    status,
    totalKlip,
    jawabanSiap,
    memuat,
    memuatLagi,
    habisKlip,
    muatKlipLagi,
    galat,
    episodeGalat,
    online,
    angka,
    segarkan: cobaLagi
  }
}
