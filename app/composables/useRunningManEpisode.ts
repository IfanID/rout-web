/** Episode Running Man, diambil dari abyss.to.
 *
 *  Satu permintaan untuk seluruh halaman — `GET /api/running-man/episode`
 *  mengembalikan semuanya sekaligus. Halaman tidak pernah menyentuh abyss
 *  secara langsung, dan halaman pemutar tidak melakukan permintaan
 *  tambahan sama sekali: slug video sudah ada di respons daftar, jadi
 *  `useEpisode()` hanya mencari di daftar yang sudah ada.
 *
 *  Mengembalikan `Ref`, bukan larik biasa. Episode dipilih lewat query
 *  `?ep=<nomor>` di halaman pemutar, dan berpindah episode hanya mengubah
 *  query pada route yang sama — komponennya dipakai ulang, `<script setup>`
 *  tidak jalan lagi. Apa pun yang disalin keluar saat itu tetap milik
 *  episode yang lama.
 *
 *  Sifatnya `async` untuk pemanggilan pertamanya, jadi pemanggilnya menulis
 *  `await`:
 *
 *    const episode = await useDaftarEpisode()
 *
 *  Mengembalikan larik kosong kalau gagal atau kunci API kosong. Pemanggil
 *  yang belum siap menampilkan larik kosong wajib menyembunyikan
 *  bagiannya — bukan menampilkan judul dengan isi kosong di bawahnya.
 *
 *  **Label pribadi ikut dari server**, bukan dari composable ini. Yang
 *  abyss berikan hanya videonya; labelnya disimpan di
 *  `data/running-man-label.json` dan disisipkan server ke setiap episode
 *  sebelum dikirim, jadi bentuknya sudah ada di `Episode` itu sendiri.
 *  Tidak ada daftar episode yang tertulis di kode.
 */

import type { Ref } from 'vue'

import type { Episode } from '#shared/types/episode'

export async function useDaftarEpisode(): Promise<Ref<Episode[]>> {
  const { data } = await useAsyncData<Episode[]>(
    'running-man-episode',
    () => $fetch<Episode[]>('/api/running-man/episode')
  )

  return computed(() => data.value || [])
}

/** Episode yang sedang diputar, atau `null` kalau daftarnya belum ada.
 *
 *  `nomor` dibaca **lewat `computed`**, bukan sekali di dalam
 *  `<script setup>`. Kalau dibaca sekali, berpindah dari episode 70 ke 69
 *  akan menampilkan video episode 70 — tanpa error, tanpa peringatan, hanya
 *  halaman yang terlihat tidak berubah padahal tautannya berbeda.
 *
 *  Pembacaan query itu dikerjakan PEMANGGIL, dan itu bukan pilihan gaya:
 *  `useRoute()` yang dipanggil di dalam composable ini akan berjalan
 *  SESUDAH `await useDaftarEpisode()` di halaman. Setelah top-level await
 *  di `<script setup>`, konteks instance tidak lagi dijamin pulih, dan
 *  objek route yang didapat di titik itu bisa berhenti ikut berubah saat
 *  navigasi. Gejalanya persis seperti yang dilaporkan: URL berubah,
 *  halamannya tidak.
 *
 *  Query bisa berupa larik kalau orang menulis `?ep=1&ep=2`, jadi yang
 *  diambil elemen pertamanya.
 *
 *  Kalau nomornya tidak dikenal — query diketik manual, atau episode itu
 *  dihapus dari abyss — hasilnya episode terbaru. Halaman yang dibuka
 *  dari navbar dan dari tautan yang dibagikan tanpa `?ep=` sama-sama harus
 *  melihat sesuatu, bukan layar kosong. */
export function useEpisode(
  daftar: Ref<Episode[]>,
  /** Nomor dari query, atau `null` kalau tidak ada / tidak dikenal.
   *
   *  Getter, bukan nilai — supaya pemanggil yang memutuskan cara membaca
   *  query-nya, dan supaya pembacaan itu terjadi saat `computed` dievaluasi
   *  (setiap navigasi), bukan sekali di awal setup. Bentuknya sama dengan
   *  `useKlipSekitar(id: () => string, …)` di berkas yang sama.
   *
   *  Getter menutup masalahnya dari sisi pemanggil, dan bentuknya sudah
   *  dipakai `useKlipSekitar(id: () => string, …)` di berkas yang sama. */
  nomor: () => number | null
): ComputedRef<Episode | null> {
  return computed(() => {
    const semua = daftar.value

    if (!semua.length) return null

    const cari = nomor()

    return (
      (cari === null ? null : semua.find(satu => satu.nomor === cari)) ?? semua[0]
    )
  })
}