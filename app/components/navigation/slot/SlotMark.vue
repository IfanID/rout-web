<script setup lang="ts">
/** Mark satu item slot tengah: ikon lucide atau satu huruf.
 *
 *  Diekstrak karena mark ini muncul di tiga tempat — navbar
 *  bawah, pemicu di halaman Pengaturan, dan isi menunya. Semula
 *  setiap tempat menulis ulang sendiri, dan itu sumber bug
 *  presisi yang sudah pernah terjadi sekali: kotak ikut lebarnya
 *  huruf, space-evenly menghitung ulang ruangnya, lalu tetesan
 *  meleset beberapa piksel. Dengan satu komponen, kotak dan
 *  tipografinya hanya ada di satu tempat.
 *
 *  `ikon` dan `huruf` selalu dua-duanya lolos ke sini, salah
 *  satunya kosong. Lihat catatan di useMiddleSlot. */
defineProps<{
  ikon: string
  huruf: string
}>()
</script>

<template>
  <span class="mark">
    <Icon v-if="ikon" :name="ikon" />
    <span v-else class="mark__huruf">{{ huruf }}</span>
  </span>
</template>

<style scoped>
/* Kotak tetap, apa pun isinya.
   Lebarnya yang menentukan hitungan tetesan di navbar, jadi
   nilainya diambil dari --lebar-item yang sama dengan rumus
   --ruang dan --langkah. Nilai cadangan 1.5rem dipakai di luar
   navbar, yang tidak punya variabel itu. */
.mark {
  display: flex;
  align-items: center;
  justify-content: center;

  width: var(--lebar-item, 1.5rem);
  height: var(--lebar-item, 1.5rem);

  font-size: 1.5rem;
  font-style: normal;
  flex-shrink: 0;
}

/* `line-height: 1` wajib. Elemen induk mewarisi line-height 1.6
   dari body, sedangkan <svg> milik lucide tidak terpengaruh
   line-height sama sekali. Tanpa baris ini huruf duduk
   beberapa piksel lebih rendah dari ikon. */
.mark__huruf {
  font-weight: 700;
  line-height: 1;
}
</style>