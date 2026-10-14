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
 * Semuanya masih data contoh dan sengaja dibiarkan begitu. Belum ada
 * sumber video, jadi apa pun yang muncul sebagai angka atau waktu di
 * sini belum benar, dan menambahkan angka yang lebih meyakinkan
 * (jumlah penonton, ukuran berkas, durasi per episode) hanya
 * memperbesar yang menyesatkan nanti.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Streaming". Kata itu
 * bukan brand Rout dan bukan kata yang perlu diterjemahkan. */

const { episode } = useRunningMan()

const localePath = useLocalePath()

/* Kualitas yang tersedia untuk tiap episode.
 *
 * Satu-satunya hal di halaman ini yang tidak ada di `useRunningMan`.
 * Kalau nanti semua episode bisa disiarkan di 1080p, blok ini cukup
 * dihapus — tidak perlu dipindah ke sana lebih dulu. */
const kualitas: Record<number, string[]> = {
  822: ['1080p', '720p'],
  821: ['1080p'],
  820: ['1080p', '720p', '480p'],
  819: ['720p'],
  818: ['480p']
}

/* Episode yang sedang diputar. Belum ada pilihan dari pemakai, jadi
 * selalu yang terbaru — karena itu ia tidak ikut di daftar "Stream
 * lain" di bawah: menawarkannya di sana berarti orang diberi pilihan
 * yang sedang diputar, dan daftar itu jadi berisi satu pilihan yang
 * tidak melakukan apa pun. */
const diputar = computed(() => episode[0])

/* Yang bisa dipilih setelahnya. */
const lain = computed(() => episode.slice(1))
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

         Rasio 16:9. Tombol putar di tengah masih mati karena belum
         ada sumber video — `disabled` dipakai, bukan
         `aria-disabled`, supaya tidak masuk urutan tab dan tidak bisa
         dipicu Enter. Tombol yang terlihat bisa diklik tapi tidak
         melakukan apa pun lebih buruk daripada yang terlihat mati.

         `aria-label` menyebut episodenya, jadi pembaca layar tahu apa
         yang akan diputar tanpa harus membaca isi kartu dulu. -->
    <div class="kartu streaming__layar">
      <button
        type="button"
        class="streaming__main"
        disabled
        :aria-label="`Putar Episode ${diputar.nomor}`"
      >
        <span class="streaming__main-ikon" aria-hidden="true">
          <Icon name="lucide:play" class="streaming__main-glif" />
        </span>
        <span class="streaming__main-teks">Belum ada sumber video</span>
      </button>
    </div>

    <!-- === Yang sedang diputar ================================

         Kartu terpisah dari player, bukan informasi yang menempel di
         bawahnya. Player butuh seluruh lebar untuk rasio 16:9-nya —
         kalau judul ikut jadi satu blok bersamanya, rasio video ikut
         rusak karena baris teks yang tidak bisa jadi 16:9. -->
    <div class="kartu streaming__info">
      <div class="streaming__info-kepala">
        <div>
          <p class="label streaming__info-label">Sedang diputar</p>
          <p class="streaming__info-judul">Episode {{ diputar.nomor }}</p>
        </div>

        <!-- Kualitas episode yang sedang diputar. Badge netral,
             bukan aksen: kualitas bukan state, hanya angka yang
             bisa dipilih pemakai. Warna aksen akan membuatnya terbaca
             sebagai tanda yang perlu diperhatikan. -->
        <div class="streaming__info-kualitas">
          <span v-for="q in kualitas[diputar.nomor]" :key="q" class="badge streaming__mutu">
            {{ q }}
          </span>
        </div>
      </div>

      <p class="streaming__info-tanggal">{{ diputar.tanggal }}</p>
      <p class="streaming__info-tamu">Tamu: {{ diputar.tamu }}</p>
    </div>

    <!-- === Stream lain ==========================================

         Barisnya belum tautan. Alasannya sama seperti di halaman
         detail: belum ada halaman per episode, jadi
         `/episode/streaming` yang dituju selalu sama. Begitu tiap
         episode punya halamannya sendiri, baris ini jadi `NuxtLink`.

         Yang membedakan dari daftar di halaman episode adalah kolom
         kualitas — itu yang benar-benar menentukan pilihan orang dari
         daftar ini. -->
    <section class="bagian">
      <h2 class="bagian__judul">Stream lain</h2>

      <ul class="streaming__daftar">
        <li v-for="satu in lain" :key="satu.nomor" class="streaming__baris">
          <span class="streaming__baris-nomor lencana">{{ satu.nomor }}</span>

          <span class="streaming__baris-tanggal">{{ satu.tanggal }}</span>

          <!-- `flex-wrap` yang memutuskan: di layar sempit kualitas
               turun ke baris sendiri, dan karena `margin-left: auto`
               yang mendorongnya, baris yang turun itu tetap mulai
               dari kiri — tidak menggantung di kanan baris yang
               sendirian. -->
          <span class="streaming__baris-kualitas">
            <span
              v-for="q in kualitas[satu.nomor]"
              :key="q"
              class="badge streaming__mutu"
            >
              {{ q }}
            </span>
          </span>
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
 * berubah, tanpa satu pun media query yang perlu disesuaikan. */
.streaming__layar {
  aspect-ratio: 16 / 9;

  margin-top: 2rem;
  padding: 0;

  /* Latar paling dalam dari semua permukaan di proyek ini. Player
   * adalah tempat yang paling mendekati hitam — bukan karena isinya
   * gelap, tapi karena bloknya besar dan fokusnya video, bukan teks.
   * Latar yang terlalu terang di sini membuat area kosong terasa
   * seperti panel yang belum termuat. */
  background: var(--latar-naik-1);
  border-color: var(--garis-halus);
}

/* Tombolnya mengisi seluruh layar, bukan cuma bulatan di tengah.
 *
 * Kalau tombolnya cuma sebesar ikonnya, separuh layar bukan area
 * sentuh — dan di layar sebesar itu, orang mengira tidak ada apa pun
 * di sana. Isi tombol tetap memberi tahu bahwa belum ada video, jadi
 * yang ditekan memang tidak terjadi apa pun. */
.streaming__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  width: 100%;
  height: 100%;

  border: 0;
  border-radius: inherit;
  background: none;
  cursor: not-allowed;
}

/* Lingkaran di tengah. Warnanya redup, bukan aksen: ini lambang
 * player yang belum hidup, bukan tombol yang siap dipakai.
 *
 * Garis aksen tipis di sekeliling — cukup untuk memisahkan lingkaran
 * dari latar tanpa membuatnya terbaca sebagai tombol. */
.streaming__main-ikon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 4.5rem;
  height: 4.5rem;
  border-radius: 999px;

  background: var(--latar-naik-3);
  border: 1px solid var(--aksen-glow);

  font-size: 2rem;
  color: var(--teks-sekunder);
}

/* Segitiga play terlihat berat di sisi kirinya, jadi digeser sedikit
 * ke kanan agar terlihat benar-benar di tengah lingkarannya.
 *
 * Kelasnya ada di `<Icon>` itu sendiri, bukan lewat `:deep(svg)` di
 * lingkaran. Bentuk `:deep(svg)` itu tidak pernah cocok: @nuxt/icon
 * merender ikon sebagai `<span class="iconify">` dan menggambarnya
 * lewat mask CSS, bukan elemen `<svg>`. Dan transform-nya harus
 * menempel pada glifnya — kalau dipasang di lingkaran, yang bergerak
 * adalah lingkarannya, bukan segitiganya. */
.streaming__main-glif {
  transform: translateX(2px);
}

.streaming__main-teks {
  font-size: 0.875rem;
  color: var(--teks-lembut);
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

.streaming__info-tanggal {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}

.streaming__info-tamu {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* --- Stream lain --------------------------------------------- */

.streaming__daftar {
  margin: 0;
  padding: 0;
  list-style: none;
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 1rem;

  padding: 0.75rem 0;
  border-top: 1px solid var(--garis-halus);

  font-size: 0.875rem;
  color: var(--teks-utama);
}

.streaming__baris-nomor {
  flex-shrink: 0;
  width: 2.75rem;
  text-align: left;
  color: var(--teks-aksen);
}

.streaming__baris-tanggal {
  flex: 1 1 8rem;
  min-width: 0;
}

.streaming__baris-kualitas {
  display: flex;
  gap: 0.25rem;

  margin-left: auto;
}

/* Badge netral, bukan aksen bawaan `.badge`. Kualitas bukan state —
 * bukan "sukses" atau "galat", hanya angka yang bisa dipilih pemakai.
 * Warna aksen di sini akan membuat badge terbaca sebagai tanda
 * sesuatu yang perlu diperhatikan, dan itu bukan artinya. */
.streaming__mutu {
  background: var(--latar-sorot);
  color: var(--teks-sekunder);
  font-variant-numeric: tabular-nums;
}
</style>