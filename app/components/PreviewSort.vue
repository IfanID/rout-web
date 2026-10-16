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
/* Segmented control: satu deret pilihan di dalam satu permukaan
 * membulat.
 *
 * Sebelumnya tiga tautan telanjang dengan garis bawah di yang aktif.
 * Masalahnya baru terlihat di layar lebar: tiga kata kecil dengan garis
 * bawah 2px mengambang di tengah halaman 1152px, dan batas antar
 * pilihannya tidak terbaca — yang aktif hanya terlihat dari warna
 * teksnya, dan itu paling kabur justru bagi orang yang sulit
 * membedakan warna.
 *
 * Sebagai satu permukaan, ketiganya jadi satu kontrol yang batasnya
 * jelas, dan yang aktif punya latar sendiri — bukan hanya warna huruf.
 *
 * `inline-flex`, bukan `flex`: deretnya tidak perlu selebar halaman.
 * Kontrol sepanjang 1100px untuk tiga kata terbaca sebagai bilah, bukan
 * sebagai pilihan. */
.urutan {
  display: inline-flex;
  gap: 0.25rem;

  max-width: 100%;

  margin-top: 0.75rem;
  padding: 0.25rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: 999px;
}

/* Labelnya tiga dan semuanya pendek — "Terbaru", "Terlama",
 * "Terpopuler" — sehingga deret ini tetap muat di layar 320px tanpa
 * perlu wadah yang bisa menggeser. Jumlah pilihan atau labelnya
 * berubah? Wadah gulir mendatar lebih tepat daripada mengecilkan huruf
 * sampai muat: yang paling perlu terbaca di sini justru nama
 * pilihannya, dan teks 11px untuk mengejar lebar bukan bacaan. */
.urutan__butir {
  flex: 0 0 auto;

  padding: 0.375rem 0.875rem;
  border-radius: 999px;

  font-size: 0.8125rem;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--teks-lembut);

  transition: background var(--transisi), color var(--transisi);
}

.urutan__butir:hover {
  background: var(--latar-sorot);
  color: var(--teks-utama);
}

/* Yang sedang dipakai: latar aksen tipis, bukan `--aksen-utama` penuh.
 * Pil aksen penuh dengan teks gelap di atasnya menarik mata ke tab yang
 * sedang aktif — padahal yang perlu diperhatikan di bagian ini adalah
 * daftar klipnya. */
.urutan__butir--dipakai {
  background: var(--aksen-latar);
  color: var(--teks-aksen);
  font-weight: 500;
}

/* Fokus keyboard mengikuti `:focus-visible` dari main.css — pil-nya
 * sudah bulat, jadi cincin fokusnya ikut bulat tanpa aturan tambahan. */

@media (prefers-reduced-motion: reduce) {
  .urutan__butir {
    transition: none;
  }
}
</style>