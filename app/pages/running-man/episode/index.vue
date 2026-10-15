<script setup lang="ts">
/* Daftar episode Running Man, diambil dari abyss.to.
 *
 *   /running-man                       beranda — kapan tayang
 *   /running-man/episode               halaman ini
 *   /running-man/episode/streaming     menonton
 *
 * Folder `episode/` di atasnya TIDAK berkurung, jadi ia masuk ke URL.
 * Karena itu halaman ini beralamat `/running-man/episode`, bukan
 * `/running-man`.
 *
 * Berkasnya `index.vue`, bukan `episode.vue`. Nama route halaman ini
 * `running-man-episode` — `index` di ujung nama route dibuang, jadi
 * hanya nama folder yang ikut. Kalau berkasnya diganti `episode.vue`,
 * URL-nya tetap `/running-man/episode` tapi nama route-nya menjadi
 * `running-man-episode-episode`, dan route halaman menonton di bawahnya
 * ikut berubah — jadi semua pemanggilan `localePath` yang menyebutnya
 * harus ditulis ulang.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Episode". Nama itu
 * bukan brand Rout dan bukan kata yang perlu diterjemahkan — di tiga
 * locale tetap "Episode", seperti "Stats" atau "Live". */

import type { Episode } from '#shared/types/episode'

const episode = await useDaftarEpisode()

const localePath = useLocalePath()

const { locale } = useI18n()

/* Pembuat format dibuat sekali per bahasa, bukan sekali per baris.
   `Intl.NumberFormat` turun ke data lokalitas setiap kali dibuat, dan
   daftar ini bisa 69 baris. Polanya sama dengan `formatTanggal` di
   PreviewList.vue. */
const formatUkuran = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
)

/** Nomor episode untuk tautan pemutar.
 *
 *  Dipakai sebagai objek `query`, bukan argumen kedua `localePath` —
 *  argumen kedua itu bahasa, bukan params. Satu episode punya halamannya
 *  sendiri lewat `?ep=`, dan param-nya wajib lewat `params`. */
function keTonton(satu: Episode) {
  return localePath({
    name: 'running-man-episode-streaming',
    query: { ep: satu.nomor }
  })
}

/** Ukuran berkas, dari byte jadi "0,87 GB" — "0.87 GB" di `/en`.
 *
 * Dibentuk di komponen, bukan di server: bentuk yang dilihat orang
 * bergantung pada bahasa yang sedang dibaca, dan kalau dipatok di
 * server, satu bahasa akan ikut terbaca di bahasa lain.
 *
 * Pembatasnya 1 GB, bukan 1 MB — video episodenya 0,8 sampai 1,7 GB.
 * Dengan 1 MB angkanya jadi "1.717,96 MB" dan tidak ada yang membacanya
 * lebih cepat. */
function keUkuran(byte: number): string {
  return `${formatUkuran.value.format(byte / 1e9)} GB`
}
</script>

<template>
  <main class="konten episode">
    <NuxtLink :to="localePath('running-man')" class="episode__kembali">
      <Icon name="lucide:arrow-left" class="episode__kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">Episode</h1>

    <p class="konten__sub">
      Daftar episode yang tersedia untuk ditonton.
    </p>

    <!-- Berapa episode yang benar-benar ada di abyss.

         Angka ini BUKAN jumlah episode acara. Running Man sudah 822
         episode, tapi yang tersedia di sini lebih sedikit — abyss cuma
         menyimpan sebagian. Menyamakan keduanya akan membuat orang
         mengira ada 822 baris yang gagal dimuat. -->
    <p v-if="episode.length" class="label episode__rekap">
      {{ episode.length }} episode tersedia
    </p>

    <!-- `episode` dan bukan `tampil`: daftar ini tidak dipotong. Tujuh
        puluhan baris muat tanpa paginasi, dan pemuatan berikutnya hanya
         menambah satu bentuk yang harus dirancang — tombol, atau
         pengintai gulir. Yang datanya satu sumber, atau lebih baik
         kosong dulu daripada separuh jadi. -->
    <ul v-if="episode.length" class="episode__daftar">
      <li v-for="satu in episode" :key="satu.nomor" class="episode__sel">
        <NuxtLink
          :to="keTonton(satu)"
          class="episode__butir"
          :aria-label="`Episode ${satu.nomor}, ${satu.acara}`"
        >
          <!-- Kotak thumbnail, berisi nomor episode.
               Gambar sungguhan TIDAK ada dan tidak bisa ada: abyss tidak
               memberi endpoint thumbnail. Semua pola sudah dicoba —
               `GET /v1/thumbnail/<id>`, `thumbnails`, `.sprite.jpg` JW
               Player, `/thumb`, `/img`, `/poster`, `/cover` — semuanya
               404. (Yang balas 401 bukan petunjuk: SETIAP path `/v1/*`
               yang tidak dikenal begitu, termasuk path karangan.)

               Jadi nomornya yang mengisi kotak. Ini bukan hiasan supaya
               kotak kelihatan berisi — nomor itu memang satu-satunya
               hal per-baris yang tidak ada di teks, dan meletakkannya di
               sini membuatnya terbaca saat memindai ke bawah, karena
               kotak ada di kolom yang sama di seluruh baris.

               `aria-hidden`, karena nomornya sudah ada di dalam `title`
               tautan. -->
          <span class="episode__thumb" aria-hidden="true">
            {{ String(satu.nomor).padStart(3, '0') }}
          </span>

          <!-- Kolom teks. Hanya dua baris: nama acara dan keterangan
               subtitle. Ukuran dan kualitas pindah ke kolom kanan
               supaya baris ini tidak berlubang di tengahnya. -->
          <span class="episode__isi">
            <span class="episode__acara">{{ satu.acara }}</span>

            <!-- `label` boleh kosong — subtitle Running Man tertanam di
                 dalam video, bukan di abyss sebagai berkas terpisah, jadi
                 "Sub Indo" di sini satu-satunya tempat informasi itu
                 tercatat. Unggahan berikutnya yang tanpa subtitle akan
                 punya sel kosong, bukan lencana yang berbohong. -->
            <span v-if="satu.label" class="episode__label">{{ satu.label }}</span>
          </span>

          <!-- Kolom kanan: ukuran, lalu kualitas.
               Kualitas apa adanya dari abyss. Tidak disaring ke daftar
               tetap: episode 13 punya `mHD` yang tidak disebut di
               dokumentasi abyss, dan menyaringnya diam-diam membuang satu
               kualitas yang bisa diputar. -->
          <span class="episode__samping">
            <span class="episode__ukuran">{{ keUkuran(satu.ukuran) }}</span>

            <span class="episode__mutu">
              <span
                v-for="r in satu.resolusi"
                :key="r"
                class="badge mutu"
              >
                {{ r }}
              </span>
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>

    <!-- Daftar kosong punya dua sebab yang berbeda dan tidak bisa
         dibedakan dari sini: abyss tidak bisa dihubungi, atau kunci API
         belum diisi di `.env`. Keduanya ditulis apa adanya sebagai satu
         kalimat, karena yang perlu diketahui orang adalah "belum ada
         yang bisa ditonton", bukan akarnya — akarnya ada di log server. -->
    <p v-else class="episode__kosong">
      Belum ada episode yang bisa dimuat. Coba lagi nanti.
    </p>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
 * tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
 * konten terakhir tertutup navbar. */
.episode {
  padding-bottom: 10rem;
}

/* --- Kembali ------------------------------------------------- */

/* Punya kelas sendiri, bukan `.meta` dari main.css, karena ini
 * tautan dan perlu `font-weight` — dua hal yang tidak boleh ikut
 * pada daftar keterangan yang tidak bisa ditekan. */
.episode__kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.episode__kembali-ikon {
  font-size: 1rem;
}

/* --- Rekap --------------------------------------------------- */

.episode__rekap {
  margin-top: 1.5rem;
}

/* --- Daftar episode ------------------------------------------ */

/* Di layar lebar daftar jadi DUA KOLOM.
 *
 * Tanpa ini, baris satu episode melebar sampai 1104px (`--lebar-konten`
 * 72rem dikurangi padding halaman) berisi thumbnail 76px — judul dan
 * badge kualitas terpisah hampir satu meter, dan mata harus berjalan
 * sepanjang itu setiap baris. 69 baris jadi 35, dan tiap baris punya
 * lebar yang masuk akal.
 *
 * `48rem` bukan angka yang dipilih di sini: itu breakpoint yang sudah
 * dipakai `BottomNav.vue` dan `search.vue`.
 *
 * Jarak antar kolom lebih kecil daripada jarak antar baris, supaya yang
 * terbaca sebagai satu daftar dan bukan dua daftar yang berdampingan. */

/* Jarak antar baris 0.5rem, bukan 0.75rem seperti jarak bagian di
 * halaman lain. Daftar ini dibaca cepat dan beruntun, bukan satu per
 * satu seperti bagian Pengaturan — jarak yang terlalu renggang membuat
 * daftar terasa terpisah, padahal isinya satu daftar. */
.episode__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

@media (min-width: 48rem) {
  .episode__daftar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem 0.75rem;
  }
}

/* Tiga kolom di laptop.
 *
 * Di antara 48rem dan 64rem ruangnya sudah cukup untuk tiga, tapi masih
 * dua — dan dua kolom yang masing-masing 480px hanya berisi thumbnail
 * 76px plus tiga kata, jadi sisanya ruang kosong.
 *
 * Batasnya tiga, bukan empat. Pada lebar konten maksimum (72rem = 1152px)
 * empat kolom memberi 264px — persis kebutuhan minimum satu baris, tanpa
 * sisa untuk napas. Kalau nanti kolom terasa sempit, angka
 * `--lebar-konten` yang harus dinaikkan lebih dulu, bukan jumlah
 * kolomnya. */
@media (min-width: 64rem) {
  .episode__daftar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Satu episode.
 *
 * TIGA kolom: thumbnail, isi, kanan. Ketiganya mengalir.
 *
 * Hitungannya harus tepat dengan jumlah anak yang mengalir. Kalau kolomnya
 * kurang, anak terakhir turun ke baris kedua tanpa error apa pun — itulah
 * yang terjadi pada chevron sebelum dihapus, dan gejalanya hanya ikon yang
 * melayang di bawah thumbnail.
 *
 * Permukaannya ditulis sendiri, bukan memakai `.kartu`, karena
 * `.kartu` menyertakan `:hover` yang menebalkan garis tanpa memberi
 * tahu arahnya. Di sini hover-nya sudah punya arti sendiri: baris ini
 * memang menuju halaman pemutar, dan warnanya dinaikkan supaya tidak
 * menabrakkan hover kartu yang tidak punya tujuan.
 *
 * `color: inherit` menimpa aturan `a` global yang memberi warna
 * aksen ke semua tautan; warna teks di dalam baris sudah ditentukan
 * oleh kelasnya masing-masing. */
.episode__butir {
  position: relative;

  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.875rem;
  align-items: center;

  padding: 0.875rem 1rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  color: inherit;
  text-decoration: none;

  transition: border-color var(--transisi), background var(--transisi);
}

.episode__butir:hover {
  border-color: var(--garis-sedang);
  background: var(--latar-naik-3);
}

/* Thumbnail.
 *
 * Rasio 16:9 supaya bentuknya sama dengan blok video di
 * halaman streaming. Kalau keduanya berbeda rasio, daftar di sini
 * terlihat seperti jenis konten yang berbeda dari yang diputar —
 * padahal itu yang sama.
 *
 * Lebarnya tetap, bukan ikut teks. Kalau ikut, baris dengan
 * keterangan panjang akan punya kotak lebih besar dari baris di
 * atasnya, dan daftar jadi tidak rata.
 *
 * Isinya NOMOR EPISODE, bukan gambar. Lihat catatan di template: abyss
 * tidak punya endpoint thumbnail sama sekali, jadi kotak yang tadinya
 * kosong diisi nomor — satu-satunya hal per-baris yang tidak ada di teks.
 *
 * `tabular-nums` wajib. Kotak ini ada di kolom yang sama pada 69 baris,
 * dan angka yang bergeser-geser karena digitnya beda lebar akan terlihat
 * paling jelas justru di deretan ini. Monospace-nya bukan pilihan gaya:
 * bentuknya kembali ke `.lencana` dari main.css, yang memang pakai font
 * itu, jadi kolom nomornya lurus.
 *
 * `line-height: 1` supaya tinggi kotak ditentukan `aspect-ratio` dan
 * padding baris, bukan oleh ascent dan descent angka. */
.episode__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 5rem;
  aspect-ratio: 16 / 9;

  border-radius: var(--radius-sedang);
  background: var(--latar-naik-1);
  border: 1px solid var(--garis-halus);

  font-family: ui-monospace, "SF Mono", menlo, monospace;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;

  color: var(--teks-aksen);
}

.episode__isi {
  display: block;
  min-width: 0;
}

.episode__acara {
  display: block;

  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Keterangan subtitle, satu baris di bawah judul.
 *
 * `margin-top` ikut kecil karena baris kedua ini sekarang tidak lagi
 * berbaris dengan ukuran dan kualitas — jadi jarak ke judul boleh rapat
 * tanpa terasa bertumpuk. */
.episode__label {
  display: block;

  margin-top: 0.125rem;

  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* Kolom kanan: ukuran lalu kualitas, vertikal tengah.
 *
 * Rapi karena dua halnya sejajar di kanan, bukan berbaris di tengah baris
 * yang sudah dipakai judul. `flex-wrap` dipasang supaya di layar sempit
 * kualitas turun ke barisnya sendiri alih-alih menekan kolom tengah.
 *
 * `margin-left: auto` tidak perlu di sini — kolomnya sudah kolom ketiga
 * di grid, jadi lebarnya ditentukan oleh isinya. */
.episode__samping {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;

  font-size: 0.6875rem;
  color: var(--teks-sekunder);
}

/* Ukuran berkas.
 *
 * Tidak pernah kosong: `size` selalu dikirim abyss untuk berkas yang
 * sudah selesai diproses. */
.episode__ukuran {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Badge kualitas ditumpuk ATAS BAWAH, bukan disebelkan.
 *
 * Dua episodic reasonsnya. Yang pertama soal ruang: dua badge mendatar
 * memakan sekitar 66px dan mengambil sebagian kolom tengah; ditumpuk
 * hanya perlu 32px, jadi judul dapet ruang lebih lega — dan ruang itulah
 * yang baru saja mepet setelah ukuran dipindah ke kanan.
 *
 * Yang kedua soal membaca: SD lalu HD menumpuk jadi tangga yang mata
 * telusuri ke bawah, sedangkan mendatar jadi deretan yang harus dibaca
 * mendatar.
 *
 * Tinggi stack-nya 34px (dua badge 16px + jarak 2px) dan kotak thumbnail
 * 43px — muat tanpa membuat baris lebih tinggi dari sekarang. */
.episode__mutu {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.125rem;
}

/* Badge-nya pakai `.mutu` dari main.css, bukan kelas sendiri — daftar
 * episode dan halaman streaming menampilkan hal yang persis sama, dan
 * dua salinan dengan ukuran berbeda akan kelihatan begitu keduanya tampil
 * bersebelahan di layar lebar. */


/* --- Daftar kosong -------------------------------------------- */

/* Redup dan kecil. Halaman ini tetap hidup — judul, tombol kembali,
 * dan navigasi bawah semuanya ada; hanya daftarnya yang kosong. */
.episode__kosong {
  margin-top: 2rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--teks-lembut);
}

/* --- Gerak --------------------------------------------------- */

/* Transisi di baris hanya memberi tahu apa yang berubah, jadi matikan
 * kalau pemakai meminta. */
@media (prefers-reduced-motion: reduce) {
  .episode__butir {
    transition: none;
  }
}
</style>