/** Label pribadi episode Running Man, disimpan di peramban.
 *
 *  **Lokal, bukan di server.** Label ini catatan untuk satu orang di satu
 *  perangkat, bukan isi untuk pengunjung. Jadi tidak ada yang dikirim ke
 *  server: tidak ada endpoint, tidak ada kunci, tidak ada berkas yang
 *  ditulis. abyss juga tidak tahu apa-apa soal label, seperti sebelumnya.
 *
 *  Yang dikorbankan dengan pilihan ini, dan sebaiknya diketahui:
 *
 *  - Label hanya ada di peramban ini. Dibuka dari perangkat lain, daftarnya
 *    kosong — bukan salahnya, memang begitu.
 *  - Menghapus data situs di peramban menghapus labelnya, dan tidak ada
 *    salinan di mana pun. Tidak ada tempat lain yang menyimpannya.
 *
 *  Bentuknya satu berkas JSON di satu kunci: `{ daftar, pada }` — daftar
 *  label yang sudah pernah dipakai, dan nomor episode yang memakainya.
 *  Satu kunci, bukan dua, supaya tidak mungkin daftar dan pemetaannya
 *  menyimpan versi yang berbeda.
 *
 *  Nama kuncinya pakai isi, bukan nama produk: `localStorage` bertahan
 *  jauh lebih lama dari kode, jadi nama produk yang tertanam di situ ikut
 *  bertahan. Sama seperti kunci di `useMiddleSlot.ts`.
 */

import type { ComputedRef, Ref } from 'vue'

/** Bentuk isinya, sama dengan yang dulu dipakai berkas JSON di server. */
export interface IsiLabel {
  daftar: string[]
  pada: Record<string, string>
}

/** Kunci localStorage. */
const KUNCI_SIMPAN = 'label-episode'

/** Panjang label yang masih terbaca sebagai label.
 *
 *  Label tampil sebagai pill di kolom teks card episode, dan ruang teks itu
 *  di layar 390px hanya sekitar 143px. Yang jauh lebih panjang bukan lagi
 *  label. */
const PANJANG_MAKS = 40

/** Isi pertama, dipakai hanya saat peramban ini belum punya apa-apa.
 *
 *  Sesudahnya isinya milik orang yang mengetuk labelnya, di peramban ini.
 *  Ini bukan daftar label yang harus dijaga sinkron — kalau labelnya sudah
 *  ada di daftar orang itu, daftar di sini tidak pernah dipakai lagi dan
 *  boleh dibiarkan basi. */
const AWAL: IsiLabel = {
  daftar: [
    'Pertama saya tonton',
    'Belum saya tonton',
    'Pernah nonton ulang',
    'Sudah lupa jalannya',
    'Paling saya suka',
    'Paling saya tertawa',
    'Bikin nagih',
    'Nonton bareng',
    'Wajib tonton',
    'Yang saya benci'
  ],
  pada: {
    1: 'Pertama saya tonton'
  }
}

/* Dipakai bersama seluruh pemanggil, bukan per pemanggil: halaman daftar
 * episode dan halaman pemutar boleh menampilkan label yang sama, dan kalau
 * keduanya punya salinan sendiri, perubahan di satu tidak langsung terlihat
 * di yang lain.
 *
 * Di server nilainya selalu kosong — isinya hanya diisi di `onMounted` — jadi
 * tidak ada data satu orang yang bocor ke permintaan orang lain. */
const isi = ref<IsiLabel>({ daftar: [], pada: {} })

/* Sudah dibaca dari peramban atau belum. Penting untuk render: label tidak
 * ada di HTML yang dikirim server, jadi merendarnya sebelum isinya ada
 * berarti Vue menemukan hasil render yang berbeda antara server dan browser.
 * Bukan sembaran: Vue akan menuduh komponen itu berubah sendiri antara server
 *  dan browser. */
const siap = ref(false)

let sudahDipasang = false

function rapikan(teks: string): string {
  return teks.replace(/\s+/g, ' ').trim().slice(0, PANJANG_MAKS)
}

/* Buang yang tidak bisa dipakai, dari hasil `JSON.parse` yang bisa saja
 * basi: kunci localStorage bisa diubah dari console peramban, dan isinya
 * bukan hal yang perlu dipercaya begitu masuk. */
function rapikanIsi(mentah: unknown): IsiLabel {
  const hasil: IsiLabel = { daftar: [], pada: {} }

  if (!mentah || typeof mentah !== 'object') return hasil

  const { daftar, pada } = mentah as Partial<IsiLabel>

  const unik = new Set<string>()

  if (Array.isArray(daftar)) {
    for (const satu of daftar) {
      if (typeof satu !== 'string') continue

      const rapi = rapikan(satu)

      if (rapi) unik.add(rapi)
    }
  }

  if (pada && typeof pada === 'object') {
    for (const [kunci, teks] of Object.entries(pada)) {
      const nomor = Number(kunci)

      if (!Number.isInteger(nomor) || nomor < 1) continue
      if (typeof teks !== 'string') continue

      const rapi = rapikan(teks)

      if (!rapi) continue

      hasil.pada[String(nomor)] = rapi

      /* Label yang dipakai tapi belum terdaftar ikut masuk daftar, supaya
       * tidak ada episode yang menunjuk teks yang tidak bisa dipilih lagi. */
      unik.add(rapi)
    }
  }

  hasil.daftar = [...unik]

  return hasil
}

function tulis() {
  if (typeof window === 'undefined') return

  localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(isi.value))
}

export function useLabelEpisode(): {
  /** Label yang sedang dipakai episode ini, atau string kosong. */
  labelUntuk: (nomor: number) => string
  daftar: ComputedRef<string[]>
  siap: Ref<boolean>
  pakai: (nomor: number, label: string) => void
  tambah: (teks: string) => void
  hapus: (nomor: number) => void
} {
  if (import.meta.client && !sudahDipasang) {
    sudahDipasang = true

    /* `localStorage` hanya ada di browser, jadi dibaca di `onMounted` —
     * membacanya di setup akan membuat halaman gagal dirender di server. */
    onMounted(() => {
      const mentah = localStorage.getItem(KUNCI_SIMPAN)

      /* Isi yang tersimpan bisa saja bukan JSON — `localStorage` bisa
       * diubah dari console peramban, dan isinya bukan hal yang perlu
       * dipercaya begitu masuk. Melempar error di sini akan membuat
       * seluruh halaman gagal terpasang, dan semua yang hilang cuma
       * catatan label. Jadi isinya dibuang, bukan halaman. */
      let tersimpan: unknown = null

      try {
        tersimpan = mentah ? JSON.parse(mentah) : null
      } catch {
        tersimpan = null
      }

      isi.value = tersimpan ? rapikanIsi(tersimpan) : rapikanIsi(AWAL)

      siap.value = true

      /* Isi awal baru ditulis kalau memang baru — kalau peramban sudah
       * punya isinya, membacanya tidak boleh mengubah apa pun. */
      if (!mentah) tulis()
    })
  }

  function labelUntuk(nomor: number): string {
    return isi.value.pada[String(nomor)] || ''
  }

  function pakai(nomor: number, label: string) {
    const rapi = rapikan(label)

    if (!rapi) return

    isi.value.pada[String(nomor)] = rapi

    /* Label baru ikut masuk daftar, supaya bisa langsung dipakai lagi di
     * episode lain tanpa diketik ulang. */
    if (!isi.value.daftar.includes(rapi)) isi.value.daftar.push(rapi)

    tulis()
  }

  /* Label baru saja: masuk daftar, tapi belum dipakai episode mana pun.
   * Dipakai dari sheet ketika orang ingin menambah satu label dan belum
   * tahu mau dipasang ke episode yang mana. */
  function tambah(teks: string) {
    const rapi = rapikan(teks)

    if (!rapi) return

    if (!isi.value.daftar.includes(rapi)) isi.value.daftar.push(rapi)

    tulis()
  }

  function hapus(nomor: number) {
    delete isi.value.pada[String(nomor)]

    tulis()
  }

  return {
    labelUntuk,
    daftar: computed(() => isi.value.daftar),
    siap: computed(() => siap.value),
    pakai,
    tambah,
    hapus
  }
}
