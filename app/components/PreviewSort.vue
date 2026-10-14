<script setup lang="ts">
/* Tab pengurutan klip: terbaru, terlama, terpopuler.
 *
 * Dipakai beranda dan halaman daftar. Keduanya menampilkan urutan yang sama
 * karena keduanya membaca `urutan` dari query URL — jadi memilih Terpopuler
 * di beranda membuat halaman daftar ikut terpopuler, dan tombol kembali di
 * browser mengikutinya juga.
 *
 * Tautannya hanya berisi query, tanpa path. Vue-router memakai halaman
 * yang sedang dibuka untuk bagian yang tidak disebut di dalamnya, jadi tab
 * ini bekerja di halaman mana pun tanpa perlu tahu nama route-nya. Itu
 * alasan komponennya tidak menerima halaman sebagai properti — yang ada
 * hanya urutannya.
 *
 * Bukan tombol dengan JS, dan bukan juga input. Memakai tautan berarti
 * pilihan orang ada di URL — bisa disalin, dikirim, dan di-bookmark — dan
 * halaman bisa menampilkannya benar-benar saat dimuat, tanpa menunggu
 * JavaScript berjalan. */

/* Labelnya ditulis apa adanya di sini, dalam Bahasa Indonesia, sesuai
   aturan teks dummy di AGENTS.md. Nama kuncinya — yang muncul di URL —
   bukan teks yang dilihat orang, jadi tetap Inggris dan tanpa spasi. */
import { urutanKlip, type UrutanKlip } from '~/composables/useRunningManClips'

const OPSI: { nilai: UrutanKlip; label: string }[] = [
  { nilai: 'terbaru', label: 'Terbaru' },
  { nilai: 'terlama', label: 'Terlama' },
  { nilai: 'terpopuler', label: 'Terpopuler' }
]

const route = useRoute()

/* `computed`, bukan nilai biasa. Berpindah tab hanya mengubah query pada
 * route yang sama, jadi komponennya dipakai ulang dan setup ini tidak jalan
 * lagi — kalau `saatIni` dihitung sekali, garis bawahnya tetap di tab yang
 * lama padahal daftarnya sudah berubah. */
const saatIni = computed(() => urutanKlip(route.query.urutan))
</script>

<template>
  <nav class="urutan" aria-label="Urutkan klip">
    <NuxtLink
      v-for="satu in OPSI"
      :key="satu.nilai"
      :to="{ query: { urutan: satu.nilai } }"
      class="urutan__butir"
      :class="{ 'urutan__butir--dipakai': satu.nilai === saatIni }"
      :aria-current="satu.nilai === saatIni ? 'true' : undefined"
    >
      {{ satu.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
/* Baris horizontal, bukan tab besar. Urutannya bukan perintah utama
   halaman — itu miliknya daftar — jadi ukurannya sekecil teks
   keterangan, dan yang aktif ditandai garis bawah, bukan latar. */
.urutan {
  display: flex;
  gap: 1rem;

  margin-top: 0.75rem;
}

.urutan__butir {
  padding-bottom: 0.25rem;

  border-bottom: 2px solid transparent;

  font-size: 0.8125rem;
  color: var(--teks-lembut);

  transition: color var(--transisi), border-color var(--transisi);
}

.urutan__butir:hover {
  color: var(--teks-sekunder);
}

/* Garis bawah, bukan perubahan warna teks: warna aksen di teks kecil
   gampang jadi bersinar, sedangkan garis bawah bisa dibaca tanpa harus
   membedakan warnanya. */
.urutan__butir--dipakai {
  color: var(--teks-aksen);
  border-bottom-color: var(--aksen-indikator);
}
</style>