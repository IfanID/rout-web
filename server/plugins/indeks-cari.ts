/** Menyiapkan indeks pencarian klip saat server produksi hidup.
 *
 *  Tujuannya bukan membangun seluruh arsip sebelum ada yang datang —
 *  itu justru memindahkan biaya ke setiap restart. Yang dijalankan hanya
 *  satu rangkaian build yang sama seperti permintaan pertama, dimulai
 *  dari batch terbaru. Bedanya, orang pertama yang membuka pencarian
 *  tidak perlu memicunya sendiri.
 *
 *  Di dev tidak dijalankan: restart dev jauh lebih sering daripada
 *  restart produksi, dan setiap kali akan menarik data yang sama dari
 *  SBS. Di dev indeks dibangun saat pencarian pertama, lalu disimpan ke
 *  `.data/` seperti biasa. */

export default defineNitroPlugin(() => {
  if (import.meta.dev) return

  /* Diberi jeda supaya boot server tidak berebut jaringan dengan
   * permintaan pertama yang mungkin datang saat itu juga. */
  setTimeout(() => {
    void siapkanIndeks()
  }, 3000)
})
