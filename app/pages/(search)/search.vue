<template>
  <main class="konten cari">
    <h1 class="konten__judul">Cari</h1>

    <!-- `type="search"` supaya keyboardHp menampilkan tombol
         enter "cari", bukan "selesai". Tombol hapus bawaan browser
         juga ikut muncul begitu ada teks, dan itu perilaku yang
         diharapkan di halaman pencarian.

         `.input` dipakai apa adanya dari main.css, termasuk state
         fokusnya — tidak ada aturan warna di sini. -->
    <input
      type="search"
      class="input cari__input"
      aria-label="Kata kunci pencarian"
      placeholder="Ketik kata kunci"
    />

    <p class="cari__catatan">
      Pencarian belum berfungsi. Halaman ini baru kerangka.
    </p>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue dan (running-man)/running-man.vue. */
.cari {
  padding-bottom: 10rem;
}

/* .konten dibatasi 72rem, dan input sepanjang itu akan jauh lebih
   lebar dari yang dibutuhkan untuk mengetik kata kunci. */
.cari__input {
  max-width: 34rem;
  margin-top: 1.5rem;
}

.cari__catatan {
  margin-top: 0.875rem;
  font-size: 0.9375rem;
  color: var(--teks-sekunder);
}
</style>