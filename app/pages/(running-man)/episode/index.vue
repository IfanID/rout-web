<script setup lang="ts">
/* Daftar episode Running Man.
 *
 *   /running-man          beranda — kapan tayang
 *   /episode              halaman ini
 *   /episode/streaming    menonton
 *
 * Folder `episode/` bukan route group — ia tidak ditulis berkurung,
 * jadi ia masuk ke URL. Karena itu halaman ini beralamat `/episode`,
 * bukan `/episode/index`.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Episode". Nama itu
 * bukan brand Rout dan bukan kata yang perlu diterjemahkan — di tiga
 * locale tetap "Episode", seperti "Stats" atau "Live". */

const { episode, statistik } = useRunningMan()

const localePath = useLocalePath()

/* Berapa episode yang ditampilkan sekaligus.
 *
 * Dinyatakan di sini, bukan ditulis langsung di template, supaya
 * batasnya hanya ada di satu tempat. Nanti saat ada tombol "Muat
 * lagi", yang berubah hanya baris ini — templatenya tetap membaca
 * daftar yang sama. */
const JUMLAH_TAMPIL = 5

const tampil = computed(() => episode.slice(0, JUMLAH_TAMPIL))
</script>

<template>
  <main class="konten episode">
    <NuxtLink :to="localePath('running-man')" class="episode__kembali">
      <Icon name="lucide:arrow-left" class="episode__kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">Episode</h1>

    <p class="konten__sub">
      Daftar episode yang sudah pernah tayang, terbaru di atas.
    </p>

    <!-- Berapa episode yang tercatat.

         Angka ini bukan penjelasan tambahan, tapi alasan kenapa
         daftar ini belum selesai: 822 episode memang banyak, dan yang
         tampil di bawah masih lima. Menyebut jumlahnya sejak awal
         membuat orang tahu apa yang belum mereka lihat, daripada
         mengira daftar ini sudah utuh. -->
    <p class="label episode__rekap">
      {{ statistik.episode.nilai }} episode tercatat
    </p>

    <!-- <ul>, bukan <ol>. Urutannya memang berurutan, tapi nomor
         episode sudah ditulis sendiri sebagai isi, jadi <ol> akan
         membacakan nomor yang sama dua kali: sekali dari posisi dalam
         daftar, sekali dari lencana di dalamnya.

         Setiap baris menuju /episode/streaming — daftar ini dibuat
         untuk itu. Semuanya masih menuju halaman yang sama karena
         belum ada halaman per episode; begitu tiap episode punya
         halamannya sendiri, `localePath('episode-streaming')` di sini
         cukup diganti dengan route yang membawa nomornya. -->
    <ul class="episode__daftar">
      <li v-for="satu in tampil" :key="satu.nomor" class="episode__sel">
        <NuxtLink :to="localePath('episode-streaming')" class="episode__butir">
          <!-- Thumbnail belum ada. Kotak 16:9 dengan nomor di
               dalamnya adalah pengganti sementara yang jujur — ia
               menunjukkan di mana gambar akan berada, dan nomor yang
               tertulis bukan tambahan karena sudah tampil di baris
               yang sama.

               `aria-hidden`, karena isinya bukan informasi baru —
               nomor di dalamnya sudah terbaca dari teks baris. -->
          <span class="episode__thumb" aria-hidden="true">
            <Icon name="lucide:play" class="episode__thumb-ikon" />
          </span>

          <span class="episode__isi">
            <span class="episode__baris">
              <span class="episode__nomor lencana">{{ satu.nomor }}</span>
              <span class="episode__tanggal">{{ satu.tanggal }}</span>
            </span>

            <span class="episode__tamu">Tamu: {{ satu.tamu }}</span>
          </span>

          <!-- Panah di kanan, ditebalkan saat hover.
               Penanda "baris ini bisa dibuka" yang tidak hanya
               bergantung pada warna garis — di layar dengan kontras
               warna rendah, perubahan garis hampir tidak terlihat. -->
          <span class="episode__panah" aria-hidden="true">
            <Icon name="lucide:chevron-right" />
          </span>
        </NuxtLink>
      </li>
    </ul>

    <!-- Dataranya belum lengkap.

         Bukan karena belum ada tempat menyimpan: memang belum ada
         bentuk untuk "muat lagi" di halaman ini. Bentuknya bisa tombol
         yang menambah beberapa baris ke bawah, atau daftar bersambung
         yang terus memuat sendiri — dan dua-duanya berbeda jauh dari
         sini. Memilih sekarang hanya menambah kode yang nanti harus
         dibongkar, jadi teksnya menjelaskan batasnya saja.

         Dinyatakan dengan angka, bukan "beberapa episode": menyebut
         jumlahnya membuat orang tahu persis berapa yang belum
         terlihat.

         Yang dibandingkan adalah `jumlah` dari statistik, bukan
         `episode.length`. Panjang larik hanya lima — itu data contoh
         yang ada sekarang, bukan jumlah episode yang sebenarnya, dan
         menyamakan keduanya membuat catatan ini hilang tepat saat yang
         paling dibutuhkan orang. -->
    <p v-if="tampil.length < statistik.episode.jumlah" class="episode__batas">
      Menampilkan {{ tampil.length }} dari {{ statistik.episode.jumlah }}
      episode yang tercatat.
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

/* Berubah dari baris berisi angka besar menjadi label biasa. Angkanya
 * sudah ada di halaman detail, dan menaikkan ukurannya di sini akan menarik
 * perhatian ke informasi yang bukan alasan orang datang ke halaman ini
 * — orang datang untuk melihat daftar, bukan untuk menghitungnya. */
.episode__rekap {
  margin-top: 1.5rem;
}

/* --- Daftar episode ------------------------------------------ */

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

/* Satu episode.

   Permukaannya ditulis sendiri, bukan memakai `.kartu`, karena
   `.kartu` menyertakan `:hover` yang menebalkan garis tanpa memberi
   tahu arahnya. Di sini hover-nya sudah punya arti sendiri: baris ini
   memang menuju /episode/streaming, dan warnanya dinaikkan supaya
   tidak menabrakkan hover kartu yang tidak punya tujuan.

   `color: inherit` menimpa aturan `a` global yang memberi warna
   aksen ke semua tautan; warna teks di dalam baris sudah ditentukan
   oleh kelasnya masing-masing. */
.episode__butir {
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

   Rasio 16:9 dipakai supaya bentuknya sama dengan blok video di
   halaman streaming. Kalau keduanya berbeda rasio, daftar di sini
   terlihat seperti jenis konten yang berbeda dari yang diputar —
   padahal itu yang sama.

   Lebarnya tetap, bukan ikut teks. Kalau ikut, baris dengan tamu
   banyak akan punya kotak yang lebih besar dari baris di atasnya, dan
   daftar jadi tidak rata. */
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

  font-size: 1.125rem;
  color: var(--teks-lembut);
}

.episode__isi {
  display: block;
  min-width: 0;
}

/* Nomor dan tanggal sebaris. Keduanya hal yang dibaca berurutan —
 * nomor untuk mencari episode, tanggal untuk memastikan yang
 * benar — jadi menumpuknya hanya menambah satu baris tanpa menambah
 * informasi. */
.episode__baris {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.375rem 0.75rem;
}

.episode__nomor {
  text-align: left;
  color: var(--teks-aksen);
}

.episode__tanggal {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--teks-utama);
}

.episode__tamu {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* Panah di kanan.

   `flex-shrink: 0`, karena tanpa itu ikon ini ikut gepeng di baris
   yang teksnya panjang — dan tepat saat baris jadi sempit, penanda
   "bisa dibuka" justru hilang lebih dulu. */
.episode__panah {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  font-size: 1.125rem;
  color: var(--teks-lembut);

  transition: color var(--transisi), transform var(--transisi);
}

.episode__butir:hover .episode__panah {
  color: var(--teks-aksen);
  /* Maju sedikit ke kanan saat hover. Gerak kecil yang menyatakan
     "kamu sudah sampai ke ujung baris ini". */
  transform: translateX(2px);
}

/* --- Batas daftar -------------------------------------------- */

/* Redup dan kecil. Fungsinya memperingatkan bahwa daftar di atas
 * belum utuh — bukan menjelaskan halaman, jadi tidak layak sebesar
 * paragraf biasa. */
.episode__batas {
  margin-top: 1.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--teks-lembut);
}

/* --- Gerak --------------------------------------------------- */

/* Transisi di baris dan panah hanya memberi tahu apa yang berubah,
 * jadi matikan kalau pemakai meminta. */
@media (prefers-reduced-motion: reduce) {
  .episode__butir,
  .episode__panah {
    transition: none;
  }
}
</style>