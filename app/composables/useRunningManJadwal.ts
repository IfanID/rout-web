/** Jadwal tayang episode Running Man berikutnya, dari
 *  `/api/running-man/jadwal`.
 *
 *  Aturan tanggalnya — kapan digeser seminggu, kenapa dibandingkan dengan
 *  tanggal Korea — ada di `server/utils/running-man/jadwal.ts`. Composable
 *  ini cuma mengambil jawabannya.
 *
 *  Mengembalikan `Ref`, bukan nilai biasa, dan boleh `null`: kalau
 *  permintaannya gagal — server mati, jaringan putus — halaman tetap
 *  dirender, hanya bagian tanggal dan nomor episodenya yang tidak tampil.
 *  Yang TIDAK dilakukan di sini adalah menyusun jawaban cadangan sendiri:
 *  aturannya sudah ada di server, dan menyalinnya ke sini berarti dua
 *  salinan aturan yang bisa berbeda diam-diam.
 *
 *  Kuncinya sama dengan nama cache di `defineCachedEventHandler` — pola
 *  yang sudah dipakai `useRunningManClips` dan `useDaftarEpisode`. */

import type { Jadwal } from '#shared/types/jadwal'

/** Handler-nya di luar fungsi, bukan ditulis di dalam.
 *
 *  `useAsyncData` membandingkan opsi antar pemanggilan untuk benar-benar
 *  menggabung dua permintaan dengan kunci sama — dan perbandingan itu
 *  memakai identitas fungsi, bukan teksnya. Dua `() => $fetch(...)` yang
 *  isinya identik tetap dua fungsi berbeda, jadi hasilnya bukan penggabungan
 *  melainkan peringatan `NUXT_E3004: different handler` beserta dua
 *  permintaan untuk data yang sama.
 *
 *  Hoisting membuat semua pemanggilan memakai instance yang sama, jadi
 *  penggabungannya benar-benar terjadi. Yang memanggilnya sudah lebih dari
 *  satu: `running-man/index.vue`, `running-man/detail.vue`, dan
 *  `useEpisodeBaru.ts` yang dipasang di `app.vue`. Tiga-tiganya bisa aktif
 *  bersamaan — yang di `app.vue` aktif di semua halaman. */
const ambilJadwal = () => $fetch<Jadwal>('/api/running-man/jadwal')

export async function useRunningManJadwal(): Promise<Ref<Jadwal | null>> {
  const { data } = await useAsyncData<Jadwal>('running-man-jadwal', ambilJadwal)

  return computed(() => data.value ?? null)
}
