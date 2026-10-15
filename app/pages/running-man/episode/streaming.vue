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

const diputar = useEpisode(daftar, () => nomorDiminta.value)

const localePath = useLocalePath()

/** Berapa baris "Stream lain", dan berapa yang diacak.
 *
 *  Sepuluh, tujuh di antaranya acak. Daftar penuhnya 69 baris, dan itu bukan
 *  daftar yang dibaca orang untuk mencari episode tertentu — untuk itu ada
 *  halaman `/running-man/episode`. Yang di sini adalah "loncat dari satu
 *  episode ke episode lain tanpa perlu balik ke halaman daftar".
 *
 *  Tiga baris pertama punya peran yang jelas: selanjutnya, sebelumnya, paling
 *  baru. Kalau seluruhnya diisi dari yang terbaru, isinya jadi sepuluh episode
 *  terakhir — dan daftar yang isinya cuma yang terakhir itu tidak butuh sepuluh
 *  baris, cukup tiga. Sisanya diacak supaya halaman ini juga jadi jalan
 *  menemukan episode lama yang tidak akan pernah muncul di urutan mana pun. */
const JUMLAH_LAIN = 10

/** Berapa dari sisanya yang diacak — tujuh, sisanya tiga peran khusus. */
const JUMLAH_ACAK = JUMLAH_LAIN - 3

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
 *  Tiga baris pertama punya peran: episode selanjutnya, episode sebelumnya,
 *  dan episode paling baru. Setelah itu diisi dari daftar terbaru.
 *
 *  **Nomor yang sudah terpakai tidak diulang, dan itu bukan Detail kecil.**
 *  Kalau yang ditonton episode 69, episode selanjutnya adalah 70 dan episode
 *  paling baru juga 70 — tanpa penanganan ini, dua baris identik berdampingan
 *  dan daftar sepanjang sepuluh baris terlihat seperti ada yang salah.
 *
 *  Karena itu baris yang perannya sudah terisi episode lain DILEWATI, bukan
 *  ditulis ulang: episode 69 akan menampilkan "Selanjutnya" dan
 *  "Sebelumnya", lalu "Paling baru" hilang karena memang episode yang sama
 *  dengan "Selanjutnya" — lebih jujur daripada menampilkan 70 dua kali.
 *
 *  Panjangnya tetap sepuluh. Di ujung daftar, episode 70 tidak punya
 *  episode selanjutnya dan episode 1 tidak punya episode sebelumnya; slot
 *  yang kosong diisi dari undian, dan karena itu ia tidak berlabel.
 *
 *  Tujuh baris sisanya diacak dari sisa arsip. Ini bukan sekadar pemanis:
 *  dengan semuanya berurut, isi daftar selalu "yang terakhir" — jadi
 *  halaman ini tidak pernah menjadi jalan menemukan episode lama yang
 *  tidak sedang ditonton orang. Undian juga berubah setiap kali halaman
 *  ini dibuka ulang, jadi orang yang sedang mencari sesuatu punya alasan
 *  untuk kembali. */
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

  /* Tiga peran khusus, berurutan. */
  ambil(sekarang.nomor + 1, 'Selanjutnya')
  ambil(sekarang.nomor - 1, 'Sebelumnya')
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
    <NuxtLink :to="localePath('running-man-episode')" class="streaming__kembali">
      <Icon name="lucide:arrow-left" class="streaming__kembali-ikon" aria-hidden="true" />
      Semua episode
    </NuxtLink>

    <h1 class="konten__judul">Streaming</h1>

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
      <div class="streaming__info-kepala">
        <div>
          <p class="label streaming__info-label">Sedang diputar</p>
          <p class="streaming__info-judul">
            {{ diputar.acara }} episode {{ diputar.nomor }}
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

      <p v-if="diputar.label" class="streaming__info-keterangan">
        {{ diputar.label }}
      </p>
    </div>

    <!-- === Stream lain ==========================================

         Barisnya `NuxtLink` ke `?ep=<nomor>` yang sama. Dulu baris ini
         bukan tautan karena belum ada cara membawa episode mana yang
         sedang diputar; sekarang ada, jadi tautan.

         Sepuluh baris, bukan seluruh arsip. Daftar lengkap ada di
         `/running-man/episode` — yang di sini cuma untuk loncat ke episode
         tetangga tanpa perlu balik ke halaman daftar.

         `peran` ("Selanjutnya", "Sebelumnya", "Paling baru") hanya ada di
         tiga baris pertama, dan HANYA kalau baris itu benar-benar mengisi
         perannya. Kalau episode yang ditonton sudah yang terbaru, tidak ada
         "Selanjutnya" — dan memaksakan label itu berarti menulis "0" atau
         mengulang baris yang sama. -->
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

/* Punya kelas sendiri, bukan `.meta` dari main.css, karena ini
 * tautan dan perlu `font-weight` — dua hal yang tidak boleh ikut
 * pada daftar keterangan yang tidak bisa ditekan. */
.streaming__kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.streaming__kembali-ikon {
  font-size: 1rem;
}

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

/* Berjarak 0.75rem dari player, bukan menyentuhnya. Dua permukaan
 * yang menempel terlihat seperti satu blok besar, dan pemisahnya
 * hilang — padahal yang satu video dan yang satu teks. */
.streaming__info {
  margin-top: 0.75rem;
  padding: 1.25rem 1.5rem;
}

/* Judul kiri, kualitas kanan. Di layar sempit `flex-wrap` membuat
 * kualitas turun ke baris sendiri, dan karena `margin-left: auto` yang
 * mendorongnya, baris yang turun itu tetap mulai dari kiri. */
.streaming__info-kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.streaming__info-label {
  margin-bottom: 0.25rem;
}

.streaming__info-judul {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--teks-utama);
}

.streaming__info-kualitas {
  display: flex;
  gap: 0.25rem;

  margin-left: auto;
}

.streaming__info-keterangan {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
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
 * yang mati. */
.streaming__baris-tautan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 1rem;

  padding: 0.75rem 0;

  font-size: 0.875rem;
  color: var(--teks-utama);
  text-decoration: none;

  transition: color var(--transisi);
}

.streaming__baris-tautan:hover {
  color: var(--teks-aksen);
}

/* Peran baris: "Selanjutnya", "Sebelumnya", "Paling baru".
 *
 * Badge netral, bukan aksen — peran bukan state dan bukan pilihan, hanya
 * keterangan posisi. Warna aksen akan membuatnya terbaca sebagai tanda
 * yang perlu perhatian, dan itu bukan artinya.
 *
 * Lebarnya tetap meski panjang teksnya berbeda-beda, supaya kolom
 * peran lurus di sepuluh baris. `min-width` cukup untuk "Selanjutnya",
 * yang kata terpanjang dari tiga label itu. */
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