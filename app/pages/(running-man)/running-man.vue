<template>
  <main class="konten running-man">
    <!-- Judul ditulis apa adanya, bukan lewat `t()`. "Running Man"
         adalah nama acara dari Korea Selatan, sama seperti di
         useMiddleSlot.ts, jadi ia tidak diterjemahkan. -->
    <h1 class="konten__judul">Running Man</h1>

    <p class="konten__sub">
      Isi halaman masih kosong. Jadwal tayang dan informasi acaranya belum ada.
    </p>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue. */
.running-man {
  padding-bottom: 10rem;
}
</style>