<script setup lang="ts">
/* Daftar klip Running Man.
 *
 *   /running-man              beranda — klip terbaru dalam kotak yang bisa digulir
 *   /running-man/preview      halaman ini
 *   /running-man/preview/:id  halaman satu klip
 *
 * Berkasnya `preview/index.vue`, bukan `preview.vue`.
 *
 * Alasannya bukan kerapian. Kalau `preview.vue` dibiarkan berdampingan
 * dengan folder `preview/` yang bernama sama, dua nama yang sama membuat
 * route di dalam folder itu menjadi CHILD dari berkasnya, bukan saudara.
 * Vue Router merender parent lebih dulu dan hanya menampilkan child lewat
 * `<router-view>` milik parent — dan halaman ini tidak punya satu pun.
 * Gejalanya bukan 404 dan bukan peringatan di console, tapi
 * `/preview/OC482018137` menampilkan daftar klip. Bug yang lolos dari
 * pemeriksaan biasa karena semuanya terlihat sehat.
 *
 * Dengan `index.vue`, keduanya cuma saudara, dan halaman daftar tidak
 * perlu berubah sedikit pun: URL tetap `/running-man/preview`, nama route
 * tetap `running-man-preview`.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * sesuai aturan teks dummy di AGENTS.md — kecuali judul bagiannya.
 *
 * "예고보기" DITERJEMAHKAN lewat `t('klip.judul')`. Dulu ia ditulis apa
 * adanya dengan alasan bahwa itu istilah acaranya sendiri, sama seperti
 * "Running Man". Alasannya itu keliru: "Running Man" memang nama acara,
 * sedangkan "예고보기" cuma kata Korea biasa yang artinya "pratinjau".
 * Aturan di AGENTS.md sudah begitu sejak awal — nilai yang bukan brand
 * diterjemahkan — jadi ia menyimpang dari aturan itu, bukan aturan
 * tersendiri.
 *
 * Bedanya dengan teks dummy lain di halaman ini: yang ini bukan teks
 * sementara. Isinya sudah final dan memang perlu diterjemahkan, jadi ia
 * tidak mengikuti aturan teks dummy. */

import type { Klip } from '#shared/types/klip'

const localePath = useLocalePath()

/* Satu-satunya teks di halaman ini yang bukan dummy — lihat catatan
 * panjangnya di header berkasnya. */
const { t } = useI18n()

/* Daftar yang tampil di halaman ini, terpisah dari yang ada di cache
 * `useAsyncData`. Hasil satu pemuatan tidak boleh diubah langsung:
 * menambah ke sana membuat baris yang sudah tampil hilang lagi begitu
 * cache-nya kedaluwarsa. Jadi hasilnya disalin ke ref sendiri, dan ref
 * itulah yang tumbuh setiap kali halaman berikutnya dimuat.
 *
 * `ref` bukan larik biasa karena menambah klip harus merender ulang
 * daftarnya, dan larik biasa tidak melakukan itu.
 *
 * Angkanya `HALAMAN_DAFTAR`: seratus tiap pemuatan, pertama maupun saat
 * menggulir. */
const sumber = await useRunningManClips(HALAMAN_DAFTAR)

const klip = ref<Klip[]>([])

/* Daftar disalin ulang setiap kali urutannya diganti — bukan klip lama
 * ditambahkan ke urutan yang baru. `immediate` mengisi daftar yang
 * pertama kali, tanpa itu halaman mulai kosong lalu terisi setelah
 * hydration. */
watch(
  sumber,
  baru => {
    klip.value = [...baru]
  },
  { immediate: true }
)

const { sedang, habis, muatLagi, penanda } = useMuatKlipLagi(klip)

/* Pemicu pemuatan berikutnya tidak ada di sini. Elemen `penanda` dari
 * `useMuatKlipLagi` itu yang diawasi, dan composable-nya yang memutuskan
 * kapan memuat lagi — lihat catatannya. Halaman ini cuma mengikatnya di
 * ujung daftar. */

/* Diteruskan ke tombol "Kembali ke beranda" supaya urutannya ikut. Tanpa
   ini, orang yang memilih Terpopuler di halaman ini lalu kembali ke
   beranda akan melihat tiga yang terbaru tanpa ia minta begitu. */
const urutan = urutanKlip(useRoute().query.urutan)
</script>

<template>
  <main class="konten preview">
    <NuxtLink :to="localePath({ name: 'running-man', query: { urutan } })" class="kembali">
      <Icon name="lucide:arrow-left" class="kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">{{ t('klip.judul') }}</h1>

    <p class="konten__sub">
      Semua klip yang tercatat, terbaru di atas.
    </p>

    <!-- Pill `.hitung` dari main.css: jumlah klip yang sudah tampil.
         Angkanya tumbuh setiap kali halaman berikutnya dimuat, jadi
         angkanya yang ditonjolkan — bukan kata "klip". -->
    <p v-if="klip.length" class="hitung preview__rekap">
      <Icon name="lucide:film" class="hitung__ikon" aria-hidden="true" />
      <span class="hitung__angka">{{ klip.length }}</span>
      klip
    </p>

    <PreviewSort />

    <PreviewList :daftar="klip" />

    <!-- Ujung daftar. Tingginya nol dan tidak terlihat, fungsinya hanya
         memberi tahu pengintai kapan daftarnya mau dilanjutkan.

         Yang di bawahnya adalah penanda yang terlihat: selama permintaan
         berjalan, orang tahu daftarnya sedang tumbuh dan tidak mengira
         halaman ini sudah tamat. Dan karena penandanya tidak pernah hilang,
         menggulir sedikit ke bawah akan memicu percobaan lagi — itu yang
         membuat halaman ini memulihkan diri sendiri dari kegagalan sesaat. -->
    <div ref="penanda" class="preview__penanda" aria-hidden="true" />

    <p class="label preview__muat" role="status">
      <span v-if="sedang" class="preview__titik" aria-hidden="true" />
      <template v-if="sedang">Memuat klip berikutnya…</template>
      <template v-else-if="habis">Akhir daftar.</template>
    </p>

    <!-- Daftar ini bisa ratusan baris dan dimuat bertahap, jadi orang yang
         sudah jauh di bawah harus punya jalan singkat kembali ke atasnya
         tanpa menggulir seluruh halaman. -->
    <BackToTop />
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah tetap
   72px ditambah env(safe-area-inset-bottom). Tanpa ini konten terakhir
 * tertutup navbar. Sama seperti di beranda Running Man dan halaman
 * episode. */
.preview {
  padding-bottom: 10rem;
}

/* Gaya tautan kembali dipakai bersama lima halaman Running Man, jadi
   aturannya ada di `.kembali` dalam main.css — bukan disalin ke sini. */

/* Jarak ke penghitung dibuat lebih rapat dari jarak bagian biasa,
   supaya pill-nya terbaca sebagai keterangan dari halaman ini, bukan
   sebagai bagian tersendiri. */
.preview__rekap {
  margin-top: 1.5rem;
}

/* Elemen yang diawasi pengintai. Tingginya nol supaya tidak menambah
   jarak kosong di ujung daftar — tugasnya cuma memberi titik yang bisa
   diawasi. */
.preview__penanda {
  height: 0;
}

/* Penanda yang terlihat. Jarak atasnya supaya tidak menempel di baris
   terakhir daftar, dan tingginya tetap supaya perubahan teksnya tidak
   menggeser isi halaman. Tidak pernah disembunyikan walaupun kosong:
   kalau ruangnya ikut hilang, daftar melompat ke atas tepat di detik
   pemuatan dimulai, dan itu terasa seperti halaman yang salah. */
.preview__muat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  min-height: 1.25rem;
  margin-top: 1.25rem;
  text-align: center;
}

/* Titik yang berdenyut selama pemuatan berikutnya berjalan.
 *
 * Gerak yang paling kecil yang bisa dipakai: teksnya sendiri sudah
 * memberi tahu apa yang sedang terjadi lewat `role="status"`, dan titik
 * ini cuma menjawab pertanyaan yang lebih cepat muncul — "masih jalan
 * atau berhenti?" — pada halaman yang daftarnya bisa ratusan baris. */
.preview__titik {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;

  background: var(--aksen-indikator);

  animation: denyut 1s ease-in-out infinite;
}

@keyframes denyut {
  0%,
  100% {
    opacity: 0.25;
  }

  50% {
    opacity: 1;
  }
}

/* Kalau pemakai meminta gerakan dimatikan, titiknya tetap berdenyut
 * dalam rentang yang lebih sempit — 0.4 sampai 1, bukan 0.25 sampai 1.
 * Lingkaran yang berdenyut pelan masih terbaca sebagai "sedang
 * berjalan"; lingkaran yang diam sama sekali cuma jadi titik yang tidak
 * menjelaskan apa pun. */
@media (prefers-reduced-motion: reduce) {
  .preview__titik {
    animation-name: denyut-diam;
  }
}

@keyframes denyut-diam {
  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}
</style>