<script setup lang="ts">
/* Hitung mundur ke jam tayang episode berikutnya.
 *
 * Dipakai kartu "Tayang berikutnya" di beranda Running Man, duduk di
 * baris pertama kartu: label "Tayang berikutnya" di kiri, dan baris ini di
 * kanan. Baris itu yang dipilih karena cuma baris itu yang muat berdua di
 * layar 390px — lihat catatan di `index.vue`.
 *
 * Dipisah jadi komponen sendiri bukan karena panjang, tapi karena waktu:
 * satu-satunya bagian di halaman yang berubah setiap detik. Kalau state-nya
 * ditaruh di halaman, seluruh beranda — termasuk limabelas kartu klipnya —
 * ikut dirender ulang tiap detik. Di sini yang dirender ulang cuma teks
 * ini. Lihat `useHitungMundur.ts` untuk aturan fasenya.
 *
 * Sebelum dipasang di browser, yang dirender cuma unsur kosongnya:
 * hitung mundur yang dikirim server sudah basi begitu halaman sampai, dan
 * angkanya berubah tiap detik sehingga render pertama di browser tidak akan
 * sama dengan kiriman servernya. Perpindahan tingginya pun kecil —
 * label di sebelahnya sudah setinggi baris ini, jadi yang bertambah cuma
 * beberapa piksel dari perataan garis dasarnya.
 *
 * Teksnya ditulis apa adanya di sini, dalam Bahasa Indonesia, seperti teks
 * lain di kartu ini — aturan teks dummy di AGENTS.md. Tanggalnya sendiri
 * tetap mengikuti bahasa yang dibaca; lihat catatan di `index.vue`. */

const props = defineProps<{
  /** Tanggal tayang, `YYYY-MM-DD`, menurut waktu Korea. */
  tanggal: string
  /** Jam tayangnya menurut waktu Korea, 0–23. */
  jam: number
  /** Menitnya, 0–59. */
  menit: number
}>()

/* Getter, bukan nilai: `props` bisa berganti setelah komponennya dipasang.
 * Dengan nilai biasa, hitung mundurnya tetap memakai tanggal lama sampai
 * halamannya dimuat ulang. */
const hitung = useHitungMundur(
  () => props.tanggal,
  () => props.jam,
  () => props.menit
)
</script>

<template>
  <!-- `role="timer"`: unsur yang isinya berubah sendiri, dan itu artinya
       pembaca layar TIDAK membacakan setiap detiknya. Tanpa peran ini,
       angka yang berubah enam puluh kali semenit terbaca enam puluh kali
       juga. -->
  <p class="hitung" role="timer">
    <template v-if="hitung?.fase === 'hitung'">{{ hitung.teks }} lagi</template>
    <template v-else-if="hitung?.fase === 'tayang'">Sedang tayang</template>
    <template v-else-if="hitung?.fase === 'hari-ini'">Tayang hari ini</template>
  </p>
</template>

<style scoped>
.hitung {
  /* `margin: 0` wajib, dan bukan sekadar kerapian: `<p>` bawaan peramban
   * membawa margin atas-bawah satu baris penuh. Kalau dibiarkan, jarak di
   * sekeliling baris ini dua kali lipat jarak baris lain di kartunya —
   * dan itu terlihat seperti baris yang mengambang, bukan seperti bagian
   * dari kartu. */
  margin: 0;

  /* Seukuran label di sebelahnya, karena keduanya duduk di baris yang
   * sama dan baris itu dibaca sebagai satu keterangan. */
  font-size: 0.8125rem;
  line-height: 1.4;

  /* Warna aksen: satu-satunya bagian kartu yang bergerak sendiri, dan
   * satu-satunya yang menjawab "berapa lama lagi". */
  color: var(--teks-aksen);
}
</style>
