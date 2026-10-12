<template>
  <main class="konten profil">
    <h1 class="konten__judul">Profil</h1>

    <p class="konten__sub">
      Belum ada profil untuk ditampilkan.
    </p>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue, (running-man)/running-man.vue, dan
   (search)/search.vue. */
.profil {
  padding-bottom: 10rem;
}
</style>