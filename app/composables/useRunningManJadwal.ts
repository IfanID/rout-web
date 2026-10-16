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

export async function useRunningManJadwal(): Promise<Ref<Jadwal | null>> {
  const { data } = await useAsyncData<Jadwal>(
    'running-man-jadwal',
    () => $fetch<Jadwal>('/api/running-man/jadwal')
  )

  return computed(() => data.value ?? null)
}
