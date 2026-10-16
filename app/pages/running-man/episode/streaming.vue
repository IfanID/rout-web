<script setup lang="ts">
/* Halaman menonton satu episode.
 *
 *   /running-man                       beranda — kapan tayang
 *   /running-man/episode               daftar episode
 *   /running-man/episode/streaming     halaman ini
 *
 * Folder `episode/` di atasnya tidak ditulis berkurung, jadi ia masuk
 * ke URL. Karena itu halaman ini beralamat
 * `/running-man/episode/streaming`, bukan `/streaming`.
 *
 * Nama route-nya `running-man-episode-streaming`: tiap segmen disambung
 * dengan tanda hubung, bukan garis miring. Kolom `dalam` di
 * useMiddleSlot.ts kosong untuk Running Man, karena halaman ini sudah
 * mewarisi tetesan navbar dari awalan path-nya. Lihat catatan fungsi
 * `milik` di BottomNav.vue.
 *
 * Episode yang diputar diambil dari `?ep=<nomor>`, bukan dari route
 * terpisah. Alasannya bukan route yang lebih hemat — alasan sebenarnya
 * `streaming.vue` sudah ada dan sudah punya tempat dinavbar, jadi
 * menggantinya berarti menulis ulang semua pemanggilan yang menyebut
 * nama route-nya.
 *
 * Konsekuensinya, dan ini yang tidak boleh dilupakan: berpindah dari
 * episode 70 ke episode 69 HANYA mengubah query, komponennya dipakai
 * ulang, dan `<script setup>` tidak jalan lagi. Karena itu `useEpisode()`
 * membaca query lewat `computed`, bukan sekali di sini.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Streaming". Kata itu
 * bukan brand Rout dan bukan kata yang perlu diterjemahkan. */

import type { Episode } from '#shared/types/episode'

/* `useRoute()` dipanggil SEBELUM `await` di bawah, dan itu bukan gaya.
 *
 * Setelah top-level await di `<script setup>`, konteks instance tidak lagi
 * dijamin pulih. `useRoute()` yang dipanggil di titik itu bisa mengembalikan
 * objek yang berhenti ikut berubah saat navigasi — dan gejalanya persis
 * seperti yang pernah terjadi di halaman ini: URL berubah ke `?ep=69`, tapi
 * videonya tetap episode 70. Tanpa error, tanpa peringatan.
 *
 * Pola yang sama sudah dipakai `preview/[id].vue`, yang juga memanggil
 * `useRoute()` di baris paling atas lalu menurunkan nilainya lewat getter. */
/* Komponen dibuat ULANG dari nol setiap kali `?ep=` berubah.
 *
 * Tanpa `key` ini, perpindahan episode cuma menambal beberapa atribut di
 * halaman yang sama, dan hasilnya tidak selalu kelihatan: video berganti
 * sementara isi kartunya belum, atau sebaliknya.
 *
 * `definePageMeta({ key: … })` tercatat di AGENTS.md sebagai cara yang
 * "berlebihan kalau yang perlu diperbarui cuma satu daftar". Itu benar —
 * tapi di halaman ini yang perlu diperbarui bukan cuma satu daftar. Video
 * ikut berganti, dan orang harus langsung tahu episodenya sudah berganti.
 *
 * `route.fullPath`, bukan `route.query.ep` — kalau nanti ada query lain
 * yang memengaruhi tampilan, key-nya ikut yang itu. */
definePageMeta({ key: route => route.fullPath })

const route = useRoute()

/** Nomor episode dari `?ep=`, atau `null` kalau tidak ada / bukan angka.
 *
 *  Dibaca lewat `computed`, bukan sekali di dalam setup — kalau sekali,
 *  nilainya hanya benar untuk episode yang pertama dibuka. */
const nomorDiminta = computed(() => {
  const diminta = Array.isArray(route.query.ep) ? route.query.ep[0] : route.query.ep

  const nomor = Number(diminta)

  return Number.isInteger(nomor) && nomor > 0 ? nomor : null
})

const daftar = await useDaftarEpisode()

/* Label pribadi episode: milik peramban orang yang membukanya, bukan isi
 * server. `labelSiap` menjaga pilnya tidak dirender sebelum isinya terbaca —
 * label ini tidak ada di HTML yang dikirim server. */
const { labelUntuk, siap: labelSiap } = useLabelEpisode()

const diputar = useEpisode(daftar, () => nomorDiminta.value)

const localePath = useLocalePath()

/** Berapa baris "Stream lain", dan berapa yang diacak.
 *
 *  Sepuluh, sembilan di antaranya acak. Daftar penuhnya 70 baris, dan itu
 *  bukan daftar yang dibaca orang untuk mencari episode tertentu — untuk itu
 *  ada halaman `/running-man/episode`. Yang di sini adalah "loncat dari satu
 *  episode ke episode lain tanpa perlu balik ke halaman daftar".
 *
 *  Cuma satu baris yang punya peran: episode paling baru. Kalau seluruhnya
 *  diisi dari yang terbaru, isinya jadi sepuluh episode terakhir — dan daftar
 *  yang isinya cuma yang terakhir itu tidak butuh sepuluh baris, cukup satu.
 *  Sisanya diacak supaya halaman ini juga jadi jalan menemukan episode lama
 *  yang tidak akan pernah muncul di urutan mana pun.
 *
 *  "Selanjutnya" dan "Sebelumnya" **tidak** di sini. Keduanya sudah ada
 *  sebagai tombol lompat di bawah pemutar, jadi di daftar ini hanya
 *  mengulang pekerjaan yang sama — dan yang tampil lebih jelas di sana,
 *  karena tugasnya bukan salah satu dari sepuluh baris tapi satu tombol. */
const JUMLAH_LAIN = 10

/** Berapa dari sisanya yang diacak — sembilan, sisanya satu peran khusus. */
const JUMLAH_ACAK = JUMLAH_LAIN - 1

/** Satu baris "Stream lain": episode-nya, dan peran yang ia isi.
 *
 *  `peran` kosong untuk baris pengisi — itu bukan episode yang tidak punya
 *  peran, tapi episode yang tidak mendapat peran khusus. */
interface Baris {
  satu: Episode
  peran: string
}

/** Baris "Stream lain", sepuluh pertama.
 *
 *  Satu baris pertama punya peran: episode paling baru. Setelah itu diisi
 *  dari undian.
 *
 *  **Nomor yang sedang ditonton tidak pernah ikut.** Dua baris yang menunjuk
 *  episode yang sama terlihat seperti ada yang salah — bukan seperti daftar.
 *  Episode yang sedang diputar juga tidak masuk daftar episode sama sekali,
 *  jadi episode yang tidak sengaja terundi hanya mungkin kalau nomor itu
 *  sudah dipakai, dan itu yang dicek `terpakai`.
 *
 *  Panjangnya tetap sepuluh, dan nueve sisanya diacak dari sisa arsip. Ini
 *  bukan sekadar pemanis: dengan semuanya berurut, isi daftar selalu
 *  "yang terakhir" — jadi halaman ini tidak pernah menjadi jalan menemukan
 *  episode lama yang tidak sedang ditonton orang. Undian juga berubah setiap
 *  kali halaman ini dibuka ulang, jadi orang yang sedang mencari sesuatu
 *  punya alasan untuk kembali. */
const lain = computed<Baris[]>(() => {
  const semua = daftar.value
  const sekarang = diputar.value

  if (!sekarang || !semua.length) return []

  const hasil: Baris[] = []
  const terpakai = new Set<number>([sekarang.nomor])

  /** Menaruh satu episode kalau nomornya belum dipakai. */
  function ambil(nomor: number, peran: string) {
    if (hasil.length >= JUMLAH_LAIN || terpakai.has(nomor)) return

    const satu = semua.find(satu => satu.nomor === nomor)

    if (!satu) return

    terpakai.add(nomor)
    hasil.push({ satu, peran })
  }

  /* Satu peran khusus. Episode selanjutnya dan sebelumnya punya tempatnya
   * sendiri: tombol lompat di bawah pemutar. */
  ambil(semua[0].nomor, 'Paling baru')

  /* Tujuh sisanya diacak dari sisa arsip.
   *
   * Shuffle Fisher-Yates, bukan `sort(() => Math.random() - 0.5)` — yang
   * terakhir itu tidak menghasilkan pengacakan yang merata, dan untuk
   * daftar yang isinya berganti setiap episode, ketidaksempurnaan itu tidak
   * akan pernah terlihat.
   *
   * Yang penting di sini bukan pengacakan yang sempurna, tapi setiap episode
   * punya peluang yang sama.
   *
   * Disalin dulu sebelum diacak: `semua` adalah objek yang sama dengan
   * yang dipakai `useDaftarEpisode()`, dan mengacaknya di tempat akan
   * mengubah urutan daftar untuk semua pemanggil — termasuk nomor episode
   * di halaman `/running-man/episode`. */
  const sisa = semua.filter(satu => !terpakai.has(satu.nomor))

  for (let i = sisa.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[sisa[i], sisa[j]] = [sisa[j], sisa[i]]
  }

  for (const satu of sisa) {
    if (hasil.length >= JUMLAH_LAIN) break

    ambil(satu.nomor, '')
  }

  return hasil
})

/** Tautan ke episode lain.
 *
 *  `query` lewat objek, bukan argumen kedua `localePath` — argumen kedua
 *  itu bahasa, bukan params. */
function keTonton(satu: Episode) {
  return localePath({
    name: 'running-man-episode-streaming',
    query: { ep: satu.nomor }
  })
}

/** Episode terdekat dari yang sedang diputar, ke arah tertentu.
 *
 *  Dicari dari daftar episode, bukan dari `lain`. Semula keduanya diambil
 *  dari `lain` — sekarang tidak bisa lagi, karena baris "Selanjutnya" dan
 *  "Sebelumnya" sudah dihapus dari sana karena berduplikat dengan tombol
 *  ini. Dan memang lebih tepat dari daftar itu: yang dibutuhkan tombol
 *  lompat adalah episode yang benar-benar ada di abyss, bukan isi undian.
 *
 *  Dipilih dari daftar yang ada, bukan dari `nomor + 1`: kalau nomor 71
 *  belum ada di abyss, episode selanjutnya yang sebenarnya adalah yang
 *  nomor 72 — bukan tombol yang mengarah ke halaman kosong. */
function tetangga(nomor: number, naik: boolean) {
  const kandidat = daftar.value
    .filter(satu => (naik ? satu.nomor > nomor : satu.nomor < nomor))
    .sort((a, b) => Math.abs(a.nomor - nomor) - Math.abs(b.nomor - nomor))

  return kandidat[0] ?? null
}

/** Episode sebelum dan sesudah yang sedang diputar, untuk tombol lompat
 *  di bawah pemutar.
 *
 *  Yang paling pinggir dari keduanya hilang sendiri: episode terbaru tidak
 *  punya tombol ke kanan, episode terlama tidak punya tombol ke kiri. Tombol
 *  mati yang tidak bisa ditekan lebih membingungkan daripada tombol yang
 *  memang tidak ada. */
const sebelumnya = computed(() =>
  diputar.value ? tetangga(diputar.value.nomor, false) : null
)

const selanjutnya = computed(() =>
  diputar.value ? tetangga(diputar.value.nomor, true) : null
)

/** Alamat player, sudah jadi dari server.
 *
 *  Apa adanya, tanpa parameter tambahan. Player abyss membaca
 *  `?thumbnail=` dan `?image=` untuk poster-nya, dan tidak ada lain yang
 *  terdokumentasi — jadi parameter apa pun yang kita tambahkan hanya
 *  mengarang kemampuan yang tidak ada.
 *
 *  `?autoplay=1` juga tidak dipakai, dan itu bukan kelalaian: abyss tidak
 *  mendukung autoplay. Player di beranda berbeda — YouTube mengizinkan
 *  autoplay asalkan tanpa suara (`mute=1`), abyss tidak. */
function kePemutar(satu: Episode | null): string {
  return satu ? satu.pemutar : ''
}
</script>

<template>
  <main class="konten streaming">
    <!-- Kembali ke daftar episode, bukan ke beranda. Streaming hidup
         di dalam bagian episode, dan daftar itu tempat orang ingin
         kembali untuk memilih yang lain — bukan tempat mereka datang
         karena sedang membaca deskripsi acara. -->
    <NuxtLink :to="localePath('running-man-episode')" class="kembali">
      <Icon name="lucide:arrow-left" class="kembali-ikon" aria-hidden="true" />
      Semua episode
    </NuxtLink>

    <!-- Judulnya nomor episode yang sedang diputar, bukan kata
         "Streaming".

         Halaman ini punya satu alamat untuk 69 episode, jadi judul yang
         isinya nama halaman hanya mengulang nama route dan tidak
         memberi tahu apa pun tentang isi tab — sedangkan nomor
         episodenya yang membedakan satu kunjungan dari yang lain. Itu
         juga yang muncul di riwayat, di bookmark, dan di banyak tab
         yang terbuka bersamaan.

         Kata "Streaming" tidak hilang: ia tinggal di nama route dan di
         nama berkas. -->
    <h1 class="konten__judul">
      <template v-if="diputar">Episode {{ diputar.nomor }}</template>
      <template v-else>Streaming</template>
    </h1>

    <p v-if="diputar?.acara" class="konten__sub">
      {{ diputar.acara }}
    </p>

    <!-- === Player ================================================

         Player abyss HAFAL untuk iframe, dan itu bukan pilihan gaya.

         Dua alasannya, keduanya dari player itu sendiri. Pertama, ia
         memaksa pindah ke abyss.to kalau dibuka di tab langsung — baris
         `if (top.location == self.location …)` di halamannya mengalihkan
         ke beranda mereka kalau tidak ada iframe di atasnya. Kedua, data
         video di halaman itu terenkripsi dan hanya bisa didekode di
         browser, jadi tidak ada URL HLS atau mp4 yang bisa diambil untuk
         dipasang di `hls.js`. Iframe satu-satunya jalan, dan bukan jalan
         yang jelek: JW Player di dalamnya sudah menangani banyak kualitas.

         `referrerpolicy="no-referrer"` bukan hiasan. Abyss mengukur
         apakah player-nya benar-benar diputar lewat header `Referer`,
         jadi orang yang memblokir header itu mematikan pemutar.

         Border-nya nol supaya iframe-nya menempel pada kartu, bukan
         kelihatan seperti video yang tidak bisa keluar dari kotaknya.

         `:key="diputar.nomor"` DIWajibkan. Tanpa itu, perpindahan episode
         hanya mengubah atribut `src` pada elemen iframe yang sudah ada,
         dan hasilnya bergantung pada apakah browser memutuskan
         memuat ulang dokumen di dalamnya atau tidak. Dengan `key`, Vue
         membuat elemen baru dari nol — tidak ada yang perlu dipercaya
         soal perilaku browser.

         TIDAK ada `sandbox` di sini, dan itu bukan kelalaian — sudah
         dicoba, dan player menolak memutar.

         `sandbox` tanpa token `allow-popups` memang memblokir pop-under,
         karena membuat tab baru butuh izin itu. Tapi abyss mendeteksi
         persis di tempat yang sama:

             "functionopen(){[nativecode]}" != window.open.toString()

         Di iframe bersandbox, `window.open` bukan lagi fungsi native, dan
         itulah yang mereka periksa. Jadi satu-satunya cara memblokir
         pop-under mereka adalah memberi tahu bahwa kita memblokirnya — dan
         player membalas dengan menolak memutar:

             "Due to certain reasons (AdBlock/Sandbox), ads are not being
              displayed, which prevents the player from functioning."

         Pop-under hilang lewat paid bandwidth di dashboard abyss; FAQ mereka
         menyebut pop-under dan iklan dalam satu paket yang sama. Itu satu-
         satu-satunya cara yang benar-benar menutupnya, dan satu-satunya
         yang tidak mematikan pemutar. -->
    <div v-if="diputar" :key="diputar.nomor" class="kartu streaming__layar">
      <iframe
        :src="kePemutar(diputar)"
        :title="`Putar ${diputar.acara} episode ${diputar.nomor}`"
        class="streaming__pemutar"
        allowfullscreen
        referrerpolicy="no-referrer"
        scrolling="no"
      />
    </div>

    <!-- === Yang sedang diputar ================================

         Kartu terpisah dari player, bukan informasi yang menempel di
         bawahnya. Player butuh seluruh lebar untuk rasio 16:9-nya —
         kalau judul ikut jadi satu blok bersamanya, rasio video ikut
         rusak karena baris teks yang tidak bisa jadi 16:9.

        Jaring pengaman saja: halaman yang dibuka tanpa `?ep=` — dari navbar,
         atau dari tautan yang dibagikan tanpa query — tetap harus
         menampilkan sesuatu. `useEpisode()` sudah jatuh ke episode
         terbaru, jadi `v-if="diputar"` di atas hampir tidak pernah
         dipakai; ini hanya untuk daftar yang benar-benar kosong. -->
    <div v-if="diputar" class="kartu streaming__info">
      <!-- Nomor episode sebagai mark, dengan bentuk yang sama persis
           dengan kotak nomor di daftar episode: tiga digit, monospace.
           Dua tempat yang menampilkan hal yang sama sebaiknya
           kelihatan sebagai hal yang sama — dan di layar lebar, angka
           yang besar di kiri membuat kartu ini tidak lagi jadi satu
           baris teks yang memanjang.

           `aria-hidden` karena nomor yang sama sudah ada di h1 di atas
           halaman ini. -->
      <span class="streaming__info-nomor" aria-hidden="true">
        {{ String(diputar.nomor).padStart(3, '0') }}
      </span>

      <div class="streaming__info-teks">
        <!-- Label pribadi, kalau episodenya punya. Di atas "Sedang
             diputar", bukan di bawah: label itu yang paling spesifik —
             menandai episode ini — sementara "Sedang diputar" berlaku
             untuk kartu ini apa pun isinya. Urutannya sama dengan label
             di daftar episode, supaya dua tempat itu tidak kelihatan
             seperti dua hal yang berbeda. -->
        <span
          v-if="labelSiap && labelUntuk(diputar.nomor)"
          class="badge streaming__info-label-pribadi"
        >
          {{ labelUntuk(diputar.nomor) }}
        </span>

        <p class="label streaming__info-label">Sedang diputar</p>

        <!-- Keterangan subtitle, kalau ada. Boleh kosong: subtitle
             Running Man tertanam di dalam videonya, jadi tidak semua
             unggahan punya catatannya. -->
        <p v-if="diputar.label" class="streaming__info-keterangan">
          {{ diputar.label }}
        </p>
      </div>

      <!-- Kualitas episode yang sedang diputar. Badge netral,
           bukan aksen: kualitas bukan state, hanya angka yang
           bisa dipilih pemakai. Warna aksen akan membuatnya terbaca
           sebagai tanda yang perlu diperhatikan. -->
      <div class="streaming__info-kualitas">
        <span
          v-for="r in diputar.resolusi"
          :key="r"
          class="badge mutu"
        >
          {{ r }}
        </span>
      </div>
    </div>

    <!-- === Pindah episode =======================================

         Dua tombol lompat ke episode tetangga, tepat di bawah
         pemutar.

         Dulu satu-satunya jalan pindah episode adalah daftar "Stream
         lain" yang jauh di bawah halaman — sesudah seluruh kartu dan
         judul bagian. Orang yang selesai menonton dan ingin lanjut ke
         episode berikutnya harus menggulir dulu untuk mencarinya.

         Tombolnya hanya muncul kalau episodenya memang ada di abyss;
         lihat `sebelumnya` dan `selanjutnya` di script. Yang kanan
         didorong ke tepi, jadi arah "sebelum" dan "sesudah" sudah
         terbaca dari letaknya — bukan hanya dari panahnya. -->
    <div v-if="sebelumnya || selanjutnya" class="streaming__langkah">
      <NuxtLink
        v-if="sebelumnya"
        :to="keTonton(sebelumnya)"
        class="tombol tombol--sekunder streaming__langkah-tombol"
      >
        <Icon name="lucide:arrow-left" class="streaming__ikon" aria-hidden="true" />
        Episode {{ sebelumnya.nomor }}
      </NuxtLink>

      <NuxtLink
        v-if="selanjutnya"
        :to="keTonton(selanjutnya)"
        class="tombol tombol--sekunder streaming__langkah-tombol streaming__langkah-tombol--kanan"
      >
        Episode {{ selanjutnya.nomor }}
        <Icon name="lucide:arrow-right" class="streaming__ikon" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- === Stream lain ==========================================

         Barisnya `NuxtLink` ke `?ep=<nomor>` yang sama. Dulu baris ini
         bukan tautan karena belum ada cara membawa episode mana yang
         sedang diputar; sekarang ada, jadi tautan.

         Sepuluh baris, bukan seluruh arsip. Daftar lengkap ada di
         `/running-man/episode` — yang di sini cuma untuk loncat ke episode
         tetangga tanpa perlu balik ke halaman daftar.

         `peran` ("Paling baru") hanya ada di satu baris, dan hanya kalau
         baris itu benar-benar mengisi perannya. Kalau episode yang ditonton
         sudah yang terbaru, episode itu sendiri yang jadi "Paling baru" —
         dan karena ia tidak boleh tampil dua kali, baris ini kosong. -->
    <section v-if="lain.length" class="bagian">
      <h2 class="bagian__judul">Stream lain</h2>

      <ul class="streaming__daftar">
        <li v-for="baris in lain" :key="baris.satu.nomor" class="streaming__baris">
          <NuxtLink
            :to="keTonton(baris.satu)"
            class="streaming__baris-tautan"
            :aria-label="`Episode ${baris.satu.nomor}, ${baris.satu.acara}`"
          >
            <span class="streaming__baris-nomor lencana">
              {{ String(baris.satu.nomor).padStart(3, '0') }}
            </span>

            <span v-if="baris.peran" class="streaming__baris-peran">
              {{ baris.peran }}
            </span>

            <!-- Label pribadi, kalau episodenya punya. Sebaris dengan
                 peran dan judul, bukan di atas seperti di daftar episode:
                 "Stream lain" selalu sepuluh baris dengan tinggi yang
                 seragam, dan satu baris yang meninggi karena labelnya
                 membuat daftar ini terlihat tidak rapi. Di layar sempit
                 `flex-wrap` yang sudah ada yang menurunkan ke baris
                 sendiri, dan itu jauh lebih rapi daripada memenggal
                 Judul jadi dua baris. -->
            <span
              v-if="labelSiap && labelUntuk(baris.satu.nomor)"
              class="badge streaming__baris-label-pribadi"
            >
              {{ labelUntuk(baris.satu.nomor) }}
            </span>

            <span class="streaming__baris-judul">{{ baris.satu.acara }}</span>

            <!-- `flex-wrap` yang memutuskan: di layar sempit kualitas
                 turun ke baris sendiri, dan karena `margin-left: auto`
                 yang mendorongnya, baris yang turun itu tetap mulai
                 dari kiri — tidak menggantung di kanan baris yang
                 sendirian. -->
            <span class="streaming__baris-kualitas">
              <span
                v-for="r in baris.satu.resolusi"
                :key="r"
                class="badge mutu"
              >
                {{ r }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
 * tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
 * konten terakhir tertutup navbar. */
.streaming {
  padding-bottom: 10rem;
}

/* --- Kembali ------------------------------------------------- */

/* Gaya tautan kembali dipakai bersama lima halaman Running Man, jadi
 * aturannya ada di `.kembali` dalam main.css — bukan disalin ke sini.
 * Warna, bobot huruf, dan jaraknya milik sistem, bukan milik halaman
 * ini. */

/* --- Player -------------------------------------------------- */

/* Rasio 16:9 ditulis sebagai `aspect-ratio`, bukan padding-top dengan
 * angka persen.
 *
 * Cara padding-top pernah jadi satu-satunya pilihan karena
 * `aspect-ratio` belum ada. Sekarang keduanya didukung, dan
 * kelebihannya nyata di sini: blok videonya ikut ikut saat lebarnya
 * berubah, tanpa satu pun media query yang perlu disesuaikan.
 *
 * `padding: 0` dan `border-color` yang ditebalkan, karena isinya
 * iframe yang mengisi seluruhnya. Tanpa itu ada garis di sekeliling
 * video yang tidak menambah informasi apa pun.
 *
 * Latar paling dalam dari semua permukaan di proyek ini. Player
 * adalah tempat yang paling mendekati hitam — bukan karena isinya
 * gelap, tapi karena bloknya besar dan fokusnya video, bukan teks.
 * Latar yang terlalu terang di sini membuat area kosong terasa
 * seperti panel yang belum termuat. */
.streaming__layar {
  aspect-ratio: 16 / 9;

  margin-top: 2rem;
  padding: 0;

  overflow: hidden;

  background: var(--latar-naik-1);
  border-color: var(--garis-halus);
}

/* Player dikunci lebarnya di layar lebar.
 *
 * Tanpa ini ia mengikuti `--lebar-konten` (72rem = 1152px), dan rasio
 * 16/9 menjadikannya setinggi 648px — setengah tinggi monitor untuk satu
 * video, dengan sisa halaman kosong di bawahnya.
 *
 * 56rem (896px) memberi tinggi 504px, dan audio atau judul di bawahnya
 * masih terlihat tanpa harus menggulir. Dipusatkan, bukan disejajarkan
 * ke kiri, supaya kartu di bawahnya tetap satu blok di tengah halaman.
 *
 * `48rem` adalah breakpoint yang sudah dipakai proyek ini. */
@media (min-width: 48rem) {
  .streaming__layar,
  .streaming__info {
    max-width: 56rem;
    margin-inline: auto;
  }
}

/* Iframe mengisi seluruh kartu, tanpa jarak dan tanpa garis sendiri.
 *
 * `display: block` wajib: iframe bawaan `inline`, dan itu menambah
 * celah 4px di bawahnya — cukup untuk membuat video terlihat melayang
 * di dalam kartunya. */
.streaming__pemutar {
  display: block;

  width: 100%;
  height: 100%;

  border: 0;
}

/* --- Yang sedang diputar ------------------------------------ */

/* Tiga kolom: mark nomor, teks, kualitas. Jaraknya 0.75rem dari player,
 * bukan menyentuhnya — dua permukaan yang menempel terlihat seperti satu
 * blok besar, dan pemisahnya hilang, padahal yang satu video dan yang
 * satu teks. */
.streaming__info {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.875rem;

  margin-top: 0.75rem;
  padding: 1rem 1.25rem;
}

/* Mark nomor episode. Bentuknya sama persis dengan kotak nomor di
 * daftar episode — kotak bersudut sedang, monospace, dengan angka yang
 * tidak bergeser lebarnya. Dua layar yang menampilkan nomor yang sama
 * akan terlihat seperti dua hal yang berbeda kalau bentuknya berbeda. */
.streaming__info-nomor {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 3.25rem;
  aspect-ratio: 16 / 9;

  border-radius: var(--radius-sedang);
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  font-family: ui-monospace, "SF Mono", menlo, monospace;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--teks-aksen);
}

.streaming__info-teks {
  min-width: 0;
}

.streaming__info-label {
  margin-bottom: 0.125rem;
}

/* Label pribadi di kartu "Sedang diputar".
 *
 * Ukurannya tidak diturunkan seperti di daftar episode: kolom teks di
 * kartu ini jauh lebih lega, dan `.badge` apa adanya di sini masih
 * masih muat dengan nyaman. Yang diturunkan hanya jaraknya ke bawah — supaya
 * labelnya dan baris "Sedang diputar" di bawahnya tidak terbaca satu
 * blok tanpa jarak. */
.streaming__info-label-pribadi {
  margin-bottom: 0.25rem;
}

.streaming__info-keterangan {
  font-size: 0.875rem;
  color: var(--teks-sekunder);
}

/* Kualitas menempel di kanan baris, sejajar dengan mark nomornya. */
.streaming__info-kualitas {
  display: flex;
  gap: 0.25rem;
}

/* Di bawah 30rem, tiga kolom di kartu ini tidak lagi muat: kotak nomor
 * 52px, dua badge kualitas, dan sisanya buat satu label yang harus
 * pecah dua baris. Badge kualitasnya turun ke baris kedua, sejajar
 * dengan teksnya — dan karena itu badge-nya duduk di bawah label yang
 * menjelaskannya, bukan di sampingnya.
 *
 * `max-width` dan bukan `min-width`: ini soal ruang yang tidak ada,
 * sama seperti penyesuaian di daftar episode. */
@media (max-width: 30rem) {
  .streaming__info {
    grid-template-columns: auto minmax(0, 1fr);
    row-gap: 0.75rem;
  }

  .streaming__info-kualitas {
    grid-column: 2;
  }
}

/* --- Pindah episode ----------------------------------------- */

/* Dua tombol yang saling berhadapan: yang satu menempel kiri, yang lain
 * kanan.
 *
 * Yang mendorong tombol kedua ke kanan adalah `margin-left: auto` pada
 * tombolnya sendiri, bukan `justify-content: space-between` pada
 * barisnya. Bedanya kelihatan saat salah satunya tidak ada — episode
 * terbaru tidak punya "selanjutnya" — karena `space-between` dengan
 * satu anak menaruhnya di KIRI, dan tombol "sebelumnya" tiba-tiba
 * berpindah tempat setiap kali orang berganti episode. */
.streaming__langkah {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  margin-top: 0.75rem;
}

.streaming__langkah-tombol {
  /* Berbagi lebar supaya keduanya sama besar di layar sempit — kalau
     ikut panjang teksnya, "Episode 70" dan "Episode 100" jadi dua
     tombol yang lebarnya berbeda di halaman yang sama. */
  flex: 1 1 8rem;
  justify-content: center;
}

.streaming__langkah-tombol--kanan {
  margin-left: auto;
}

/* Di layar lebar tombolnya tidak perlu memenuhi setengah halaman:
 * yang dicari orang cuma nomor episodenya, bukan permukaan besar
 * yang bisa diketuk. */
@media (min-width: 48rem) {
  .streaming__langkah-tombol {
    flex: 0 1 auto;
    min-width: 9rem;
  }
}

.streaming__ikon {
  font-size: 1rem;
}

/* --- Stream lain --------------------------------------------- */

.streaming__daftar {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Di layar lebar "Stream lain" jadi DUA KOLOM.
 *
 * Sepuluh baris yang ditumpuk satu kolom menyisakan banyak ruang kosong
 * di kanan — dan ruang itu lebih berguna untuk baris episode kedua
 * daripada untuk ruang kosong. Dipasangkan dengan batas lebar yang sama
 * dengan player supaya keduanya rata di kiri.
 *
 * Jarak antar kolom lebih kecil daripada jarak antar baris supaya yang
 * terbaca sebagai satu daftar. */
@media (min-width: 48rem) {
  .streaming__daftar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 1.5rem;
  }

  /* Garis pemisah antar baris jadi milik tiap kolom, bukan membentang
     melintasi dua kolom — kalau tidak ia memotong daftar di tengah. */
  .streaming__baris:nth-child(-n + 2) {
    border-top: 1px solid var(--garis-halus);
  }
}

/* Baris dipisah garis rambut, bukan kartu. Yang di sini satu daftar
 * episode, dan memberi tiap baris permukaan sendiri membuatnya
 * terbaca sebagai hal-hal terpisah yang tidak berhubungan.
 *
 * Baris pertama juga memakai `border-top`, berbeda dari jadwal di
 * halaman detail. Di sini baris pertama berada di bawah `<h2>` yang
 * sudah punya jarak sendiri, jadi tanpa garis ia akan menggantung
 * sendiri; di kartu jadwal, baris pertama menempel pada permukaan
 * kartu dan garisnya akan terbaca sebagai tepi kartu yang gagal. */
.streaming__baris {
  border-top: 1px solid var(--garis-halus);
}

/* Tautan mengisi seluruh baris, termasuk area yang di sebelah
 * kualitas. Tanpa itu, hanya teksnya yang bisa diketuk, dan baris
 * selebar 360px dengan area sepi 90px terasa seperti ada bagian
 * yang mati.
 *
 * Padding sampingnya 0.5rem, sedangkan garis pemisah antar barisnya
 * tetap selebar daftar. Isi barisnya jadi menjorok sedikit dari garis
 * itu, dan hover-nya punya ruang untuk bernapas — latar sorot yang
 * menempel persis di tepi huruf pertama terbaca sebagai teks yang
 * ditebalkan. */
.streaming__baris-tautan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 1rem;

  padding: 0.75rem 0.5rem;

  border-radius: var(--radius-sedang);

  font-size: 0.875rem;
  color: var(--teks-utama);
  text-decoration: none;

  transition: color var(--transisi), background var(--transisi);
}

/* Baris yang bisa diketuk diberi latar sorot saat hover, bukan hanya
 * warna huruf: di daftar sepuluh baris, perubahan warna satu nama acara
 * tidak cukup untuk menunjukkan baris mana yang sedang di bawah
 * kursor — apalagi kalau namanya sama di semua baris. */
.streaming__baris-tautan:hover {
  background: var(--latar-sorot);
  color: var(--teks-aksen);
}

/* Fokus keyboard memakai penanda yang sama dengan hover: orang yang
 * berpindah dengan Tab tidak akan pernah melihat hover. */
.streaming__baris-tautan:focus-visible {
  background: var(--latar-sorot);
}

/* Peran baris: "Paling baru".
 *
 * Badge netral, bukan aksen — peran bukan state dan bukan pilihan, hanya
 * keterangan posisi. Warna aksen akan membuatnya terbaca sebagai tanda
 * yang perlu perhatian, dan itu bukan artinya.
 *
 * Lebarnya tetap meski panjang teksnya berbeda-beda, supaya kolom
 * peran lurus di sepuluh baris. Satu-satunya label yang pernah muncul
 * di sini sekarang, tapi minsinya dibiarkan: kalau nanti peran lain
 * ditambahkan lagi, kolomnya tidak melompat ke kanan. */
.streaming__baris-peran {
  flex-shrink: 0;
  min-width: 5.5rem;

  padding: 0.125rem 0.5rem;
  border-radius: 999px;

  background: var(--latar-sorot);
  color: var(--teks-sekunder);

  font-size: 0.6875rem;
  font-weight: 500;
  text-align: center;
}

/* Label pribadi di baris "Stream lain".
 *
 * Aksen, bukan netral seperti `streaming__baris-peran` di sebelahnya.
 * Peran itu keterangan posisi yang berlaku untuk semua orang. Label
 * pribadi justru isi milik satu orang, dan memang perlu menonjol: kalau
 * warnanya sama dengan peran, keduanya jadi dua badge abu yang tidak bisa
 * dibedakan tanpa membaca isinya.
 *
 * `flex-shrink: 0` mengikuti peran: label yang terpotong jadi
 * "Pertama saya to…" tidak menyatakan apa pun, dan lebih baik baris ini
 * turun ke baris sendiri. */
.streaming__baris-label-pribadi {
  flex-shrink: 0;
  font-size: 0.6875rem;
}

.streaming__baris-nomor {
  flex-shrink: 0;
  width: 2.75rem;
  color: var(--teks-aksen);
}

.streaming__baris-judul {
  flex: 1 1 8rem;
  min-width: 0;
}

.streaming__baris-kualitas {
  display: flex;
  gap: 0.25rem;

  margin-left: auto;
}

/* Badge-nya pakai `.mutu` dari main.css — daftar episode dan halaman ini
 * menampilkan hal yang persis sama, jadi tidak perlu dua salinan. */

/* --- Gerak --------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  .streaming__baris-tautan {
    transition: none;
  }
}
</style>