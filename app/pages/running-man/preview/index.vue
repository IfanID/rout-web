<script setup lang="ts">
/* Daftar klip Running Man.
 *
 *   /running-man              beranda — tiga klip terbaru
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
 * sesuai aturan teks dummy di AGENTS.md. Judul "예고보기" tetap dalam
 * Bahasa Korea karena itu istilah yang dipakai acaranya sendiri, sama
 * seperti "Running Man" — bukan kata yang kita terjemahkan. */

import type { Klip } from '#shared/types/klip'

const localePath = useLocalePath()

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
    <NuxtLink :to="localePath({ name: 'running-man', query: { urutan } })" class="preview__kembali">
      <Icon name="lucide:arrow-left" class="preview__kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">예고보기</h1>

    <p class="konten__sub">
      Semua klip yang tercatat, terbaru di atas.
    </p>

    <p v-if="klip.length" class="label preview__rekap">
      {{ klip.length }} klip
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
      <template v-if="sedang">Memuat klip berikutnya…</template>
      <template v-else-if="habis">Akhir daftar.</template>
    </p>
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

.preview__kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.preview__kembali-ikon {
  font-size: 1rem;
}

/* Jarak ke daftar dibuat lebih rapat dari jarak bagian biasa, supaya
   kalimat penghitungnya terbaca sebagai keterangan dari bagian ini,
   bukan sebagai bagian tersendiri. */
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
  min-height: 1.25rem;
  margin-top: 1.25rem;
  text-align: center;
}
</style>