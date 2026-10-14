<script setup lang="ts">
/* Pemutar klip.
 *
 * Ini pengganti bingkai SBS, dan alasannya bukan selera. Player SBS di dalam
 * bingkai pihak ketiga **selalu** gagal di Chrome: kodenya memeriksa
 * `document.cookie` lalu mengirim permintaan dengan `credentials: "include"`,
 * sedangkan cookie pihak ketiga diblokir di dalam bingkai — jadi yang
 * muncul pesan mereka sendiri, `재생오류 · 서버에 접속하지 못했습니다`.
 * Membetulkannya dari sisi kita tidak mungkin; cookie itu bukan milik kita.
 *
 * Jadi videonya diputar di sini. Alamat stream-nya diambil dari endpoint
 * `preview` milik SBS, yang terbuka untuk umum dan mengizinkan CORS:
 *
 *   https://static.apis.sbs.co.kr/play-api/1.0/sbs_vodall/preview/<id>
 *     ?rscuse=05&duration=180
 *
 * Jawabannya berisi `vod.source.mediasource.mediaurl` — sebuah playlist HLS
 * yang di dalamnya sudah tertanam token berlaku sekitar dua jam. Karena
 * itu alamatnya diambil saat mau memutar, bukan disimpan lebih dulu.
 *
 * `duration=180` adalah potongan yang mereka izinkan untuk pratinjau:
 * tiga menit pertama. Klip di sini panjangnya 1 sampai 3 menit, jadi
 * seluruh isinya masuk — tapi kalau nanti ada klip yang lebih panjang,
 * yang terputar hanya tiga menit pertama, dan itu batas dari mereka.
 *
 * Pemutarannya sendiri memakai HLS. Safari bisa memutar HLS langsung,
 * Chrome dan Firefox tidak — di sana `hls.js` yang bekerja. Itu sebabnya
 * berkas ini memeriksa `canPlayType` lebih dulu. */

import type Hls from 'hls.js'

const props = defineProps<{
  /** Id klip dari SBS, dipakai untuk meminta alamat stream-nya. */
  id: string
  /** Judul klip, untuk atribut judul elemen video. */
  judul: string
  /** Thumbnail, dipakai sebagai gambar poster sebelum video diputar. */
  gambar?: string
}>()

const video = ref<HTMLVideoElement | null>(null)

const memuat = ref(true)
const pesan = ref('')

/* Menyala kalau pemutaran otomatis hanya diizinkan tanpa suara. Dipakai
 * untuk memberi tahu orangnya, karena video yang berjalan tanpa suara
 * tanpa keterangan terlihat seperti video yang rusak. */
const tanpaSuara = ref(false)

let hls: Hls | null = null

/** Memutar begitu sumbernya siap, dan menyerah tanpa suara kalau ditolak.
 *
 *  Peramban hanya mengizinkan pemutaran otomatis yang bersuara kalau
 *  pengunjung sudah pernah berinteraksi dengan situs ini — jadi
 *  permintaan pertama memang sering ditolak, dan `play()` mengembalikan
 *  promise yang gagal. Yang dilakukan di sini bukan menyerah: dicoba lagi
 *  tanpa suara, karena itu yang selalu diizinkan, lalu suaranya tinggal
 *  dinyalakan lewat kontrol bawaan.
 *
 *  Kenapa tidak langsung tanpa suara saja: kalau peramban mengizinkan
 *  bersuara — dan itu terjadi kalau orang sudah pernah menonton di sini
 *  sebelumnya — menutup suaranya sejak awal justru membuatnya terlihat
 *  rusak. */
async function mulaiOtomatis() {
  const elemen = video.value
  if (!elemen) return

  try {
    await elemen.play()
  } catch {
    elemen.muted = true

    try {
      await elemen.play()
      tanpaSuara.value = true
    } catch {
      /* Ditolak juga tanpa suara — biasanya karena peramban di dalam
       * aplikasi belum mengizinkan media diputar tanpa sentuhan sama
       * sekali. Tidak ada yang bisa dilakukan dari sini; poster dan
       * tombol play tetap ada. */
    }
  }
}

/** Memberi tahu kalau suaranya sudah dinyalakan sendiri oleh orangnya. */
function cekSuara() {
  const elemen = video.value
  if (elemen && !elemen.muted && elemen.volume > 0) tanpaSuara.value = false
}

/** Menghentikan yang sedang berjalan dan mengosongkan elemennya.
 *
 *  Dua-duanya perlu: `destroy()` melepas hls.js, sedangkan `src` harus
 *  dibuang sendiri untuk jalur Safari yang tidak memakai hls.js. Tanpa
 *  yang kedua, klip lama tetap tertinggal di elemen saat klipnya berganti. */
function bersihkan() {
  hls?.destroy()
  hls = null

  const elemen = video.value
  if (elemen) {
    elemen.pause()
    elemen.removeAttribute('src')
    elemen.load()
  }
}

/** Kualitas yang diminta dari SBS.
 *
 *  SBS menyediakan dua, dan selama ini kita selalu meminta yang paling
 *  berat:
 *
 *    `05` -> 1280x720, 6,24 Mbps
 *    `01` -> 856x480,  2,95 Mbps
 *
 *  Playlist klip itu cuma berisi **satu** kualitas, jadi `hls.js` tidak
 *  punya apa pun untuk diturunkan saat jaringan melambat — videonya
 *  tersendat sampai selesai. Satu-satunya cara memilih adalah memintanya
 *  sejak awal, dan pilihan itu harus diambil sebelum alamat sumbernya
 *  diminta.
 *
 *  `navigator.connection` memberi tahu keadaan jaringan, tapi tidak ada di
 *  semua peramban — Safari di iPhone tidak menyediakannya. Di sana
 *  jawabannya 720p, sama seperti sebelumnya. */
function pilihKualitas() {
  const koneksi = (navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; saveData?: boolean }
  }).connection

  if (!koneksi) return '05'

  /* Mode hemat data: orangnya sudah bilang mau sedikit data. */
  if (koneksi.saveData) return '01'

  const jenis = koneksi.effectiveType || ''

  if (jenis === 'slow-2g' || jenis === '2g' || jenis === '3g') return '01'

  /* `downlink` dalam Mbps dan hanya perkiraan. 480p butuh 2,95 Mbps, jadi
   * di bawah 3 sudah tidak cukup untuk 720p. */
  const perkiraan = Number(koneksi.downlink)

  if (Number.isFinite(perkiraan) && perkiraan > 0 && perkiraan < 3) return '01'

  return '05'
}

/** Alamat permintaan sumber. `rscuse` menentukan kualitasnya — lihat
 *  `pilihKualitas` — sedangkan `duration` disalin dari player mereka
 *  sendiri: tiga menit pertama, dan klip di sini panjangnya kurang dari itu. */
function alamatSumber(id: string) {
  return (
    'https://static.apis.sbs.co.kr/play-api/1.0/sbs_vodall/preview/' +
    `${encodeURIComponent(id)}?rscuse=${pilihKualitas()}&duration=180`
  )
}

async function siapkan() {
  memuat.value = true
  pesan.value = ''

  try {
    const data = await $fetch<{
      vod?: { source?: { mediasource?: { mediaurl?: string } } }
    }>(alamatSumber(props.id))

    const sumber = data?.vod?.source?.mediasource?.mediaurl

    /* Tidak ada alamat berarti SBS menolak melayani klip ini — biasanya
     * karena hak siarnya sudah turun atau dibatasi. Itu jawaban yang sah,
     * bukan kegagalan kita, jadi pesannya ditulis begitu. */
    if (!sumber) {
      pesan.value = 'Klip ini tidak bisa diputar lagi dari SBS.'
      return
    }

    const elemen = video.value
    if (!elemen) return

    /* Safari: HLS ditangani sendiri oleh peramban. Yang ditunggu
     * `loadedmetadata`, bukan `canplay` — memutar video yang metadatanya
     * belum terbaca akan gagal walau izinnya ada. */
    if (elemen.canPlayType('application/vnd.apple.mpegurl')) {
      elemen.src = sumber
      elemen.addEventListener('loadedmetadata', mulaiOtomatis, { once: true })
      return
    }

    /* hls.js diimpor DI SINI, bukan di kepala berkas, dan itu disengaja:
     * perpustakaan itu khusus peramban, dan mengimpor di kepala berarti
     * ikut dimuat di server saat halaman dirender — plus satu paket 200 KB
     * masuk ke bundel yang tidak akan pernah memutarnya. Dimuat juga baru
     * setelah jelas peramban ini memang butuh (Safari tidak). */
    const { default: Pustaka } = await import('hls.js')

    if (!Pustaka.isSupported()) {
      pesan.value = 'Peramban ini tidak bisa memutar klip ini.'
      return
    }

    hls = new Pustaka()
    hls.loadSource(sumber)
    hls.attachMedia(elemen)

    /* Diputar setelah manifestnya terbaca, bukan setelah dipasang ke
     * elemen: sebelum itu videonya belum tahu durasinya, dan `play()`
     * pada keadaan itu gagal di sebagian peramban. */
    hls.on(Pustaka.Events.MANIFEST_PARSED, mulaiOtomatis)

    hls.on(Pustaka.Events.ERROR, (_peristiwa, dataGalat) => {
      /* `fatal` saja yang dilaporkan. hls.js memulihkan sebagian besar
       * kesalahan sendiri — jaringan putus sebentar, satu segmen gagal —
       * dan melaporkannya ke orang hanya menakuti tanpa sebab. */
      if (!dataGalat.fatal) return

      pesan.value = 'Klip ini gagal diputar.'
      hls?.destroy()
      hls = null
    })
  } catch {
    pesan.value = 'Gagal mengambil klip dari SBS.'
  } finally {
    memuat.value = false
  }
}

onMounted(siapkan)

/* Klip berganti tanpa komponennya dibongkar.
 *
 * Berpindah dari satu klip ke klip lain itu route yang sama dengan
 * parameter berbeda — Vue memakai ulang komponennya, jadi `onMounted`
 * tidak jalan lagi dan yang tetap terlihat adalah klip yang lama. Yang
 * dijaga di sini: setiap id baru, pemutarnya disiapkan dari awal. */
watch(
  () => props.id,
  () => {
    bersihkan()
    tanpaSuara.value = false
    siapkan()
  }
)

onBeforeUnmount(bersihkan)
</script>

<template>
  <div class="pemutar">
    <!-- `controls` bawaan peramban, bukan tombol buatan sendiri. Kontrol
         bawaan sudah punya tombol layar penuh, pengatur suara, pengatur
         kecepatan, dan pintasan keyboard — semuanya gratis dan sudah
         dikenali orang. -->
    <video
      ref="video"
      class="pemutar__video"
      controls
      playsinline
      preload="metadata"
      :poster="gambar"
      :title="judul"
      @volumechange="cekSuara"
    />

    <!-- Kegagalan ditulis DI ATAS video, bukan menghilangkannya. Elemen
         videonya tetap tinggal supaya yang muncul poster klipnya, dan
         halamannya tidak berubah tinggi saat berhasil maupun gagal. -->
    <p v-if="pesan" class="pemutar__pesan" role="status">
      {{ pesan }}
    </p>
    <p v-else-if="memuat" class="pemutar__pesan" role="status">
      Menyiapkan klip…
    </p>
    <p v-else-if="tanpaSuara" class="pemutar__pesan" role="status">
      Diputar tanpa suara — tekan ikon suara untuk menyalakannya.
    </p>
  </div>
</template>

<style scoped>
.pemutar {
  position: relative;

  overflow: hidden;

  background: #000;
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);
}

/* `aspect-ratio` dengan `min-height` pendamping: kalau peramban tidak
   menerapkannya, tingginya tidak jatuh ke nol dan videonya tetap terlihat. */
.pemutar__video {
  display: block;

  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 12rem;
}

/* Menumpuk di tengah, tidak menghalangi tombol kontrol karena hanya ada
   saat gagal atau saat menyiapkan — dua keadaan yang tidak butuh kontrol. */
.pemutar__pesan {
  position: absolute;
  inset: auto 1rem 1rem;

  margin: 0;
  padding: 0.5rem 0.75rem;

  border-radius: var(--radius-sedang);
  background: rgb(0 0 0 / 0.72);

  font-size: 0.8125rem;
  color: #fff;
}
</style>
