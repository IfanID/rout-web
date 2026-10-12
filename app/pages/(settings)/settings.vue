<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <main class="konten pengaturan">
    <h1 class="konten__judul">{{ t('pengaturan.judul') }}</h1>

    <p class="pengaturan__label">{{ t('pengaturan.slot') }}</p>

    <NavigationSlotSelect class="pengaturan__slot" />
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. index.vue sudah pakai 10rem
   untuk masalah yang sama. */
.pengaturan {
  padding-bottom: 10rem;
}

/* Ukuran dan warna mengikuti .bagian__judul di main.css, supaya
   label ini konsisten dengan label bagian di halaman lain.
   Sengaja bukan .konten__sub: baris itu menjelaskan halaman,
   sedangkan yang ini menjelaskan satu kontrol. */
.pengaturan__label {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;

  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}
</style>
