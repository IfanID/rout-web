<script setup lang="ts">
import type { HasilTampil } from '~/composables/useCari'

/** Popup daftar lengkap satu kelompok hasil pencarian.
 *
 *  Bukan halaman dan bukan route baru: hasil campuran tetap di belakang,
 *  dan popup hanya menampilkan kelompok yang tombolnya ditekan. Untuk
 *  melihat kelompok lain, popup ditutup lalu tombol “Lihat semua” di
 *  kelompok itu ditekan — tidak ada tab di dalam popup.
 *
 *  Datanya datang lewat prop, bukan lewat `useCari()` di sini. Memanggil
 *  `useCari()` lagi akan membuat instance `useAsyncData` dan watcher
 *  kedua untuk kueri yang sama. */
defineProps<{
  label: string
  jenis: string | null
  total: number
  daftar: HasilTampil[]
  memuat: boolean
  memuatLagi: boolean
  habis: boolean
  format: (nilai: number) => string
}>()

const emit = defineEmits<{
  muat: []
}>()

const { t } = useI18n()
const { kelompokTerbuka, tutupKelompok } = useSearchOverlay()

const layar = ref<HTMLDialogElement | null>(null)
const terbuka = computed(() => Boolean(kelompokTerbuka.value))

/* Elemen yang isinya bergulir. Tombol kembali ke atas perlu tahu mana yang
 * bergulir — bukan halamannya. `.grup__isi` punya `overflow-y: auto`
 * sendiri, jadi yang bergerak di dalam dialog itu adalah elemen itu, dan
 * `window` sama sekali tidak bergulir. */
const isi = ref<HTMLElement | null>(null)

/* Sinkronisasi state dan elemen <dialog>, sama seperti
 * SearchOverlay.vue: `showModal()` melempar galat kalau dialognya sudah
 * terbuka, dan `close()` melempar kalau belum. */
watch(terbuka, nilai => {
  const el = layar.value

  if (!el) return

  if (nilai) {
    if (!el.open) el.showModal()
  } else if (el.open) {
    el.close()
  }
})

/* Escape menutup dialog lewat peramban; state harus ikut dibersihkan. */
function saatTutup() {
  if (kelompokTerbuka.value) tutupKelompok()
}

/* Klik yang mendarat di elemen dialog itu sendiri berarti menekan tirai
 * di luar panel. */
function saatKlik(e: MouseEvent) {
  if (e.target === layar.value) tutupKelompok()
}

function muat() {
  emit('muat')
}

onUnmounted(() => {
  if (kelompokTerbuka.value) tutupKelompok()
})
</script>

<template>
  <dialog
    ref="layar"
    class="grup__layar"
    :aria-label="label"
    @click="saatKlik"
    @close="saatTutup"
  >
    <div class="grup__panel">
      <div class="grup__kepala">
        <span class="grup__judul">
          {{ label }}
          <span class="grup__angka">{{ format(total) }}</span>
        </span>

        <button
          type="button"
          class="grup__tutup"
          :aria-label="t('cari.tutup')"
          @click="tutupKelompok"
        >
          <Icon name="lucide:x" />
        </button>
      </div>

      <div ref="isi" class="grup__isi">
        <p v-if="!daftar.length && memuat" class="grup__catatan">
          {{ t('cari.memuat') }}
        </p>

        <p v-else-if="!daftar.length" class="grup__catatan">
          {{ t('cari.kosong_kelompok') }}
        </p>

        <ul v-else class="grup__daftar">
          <SearchResultRow
            v-for="hasil in daftar"
            :key="hasil.id"
            :hasil="hasil"
          />
        </ul>

        <!-- Klip dimuat bertahap di dalam popup. Kelompok lain sudah
             seluruhnya ada di browser. -->
        <button
          v-if="jenis === 'klip' && daftar.length && !habis && daftar.length < total"
          type="button"
          class="grup__muat"
          :disabled="memuatLagi"
          @click="muat"
        >
          <Icon name="lucide:plus" aria-hidden="true" />

          <template v-if="memuatLagi">
            {{ t('cari.memuat') }}
          </template>
          <template v-else>
            {{ t('cari.muat_lagi', { sudah: format(daftar.length), total: format(total) }) }}
          </template>
        </button>

        <p
          v-else-if="jenis === 'klip' && daftar.length && habis"
          class="grup__selesai"
        >
          {{ t('cari.selesai') }}
        </p>

        <!-- Yang digulir di dalam popup adalah `.grup__isi`, bukan halaman,
             jadi wadahnya diberikan. Tanpa itu tombolnya akan mengukur
             `window` yang tidak bergerak — dan tidak akan pernah muncul. -->
        <BackToTop :wadah="isi" />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
/* ==========================================================================
   Tirai dan panel, mengikuti pola SearchOverlay.vue.

   Tirai dipasang di elemen dialog, bukan di `::backdrop`, karena
   `backdrop-filter` di pseudo-element itu belum seragam di semua
   peramban. Di sini tirai cukup warna, tanpa blur.
   ========================================================================== */

.grup__layar {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  padding: 0;
  border: 0;

  background: var(--tirai);
}

/* Dialog tertutup memakai `display: none` bawaan peramban, jadi aturan
   ini hanya berlaku saat terbuka. */
.grup__layar[open] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.grup__layar::backdrop {
  background: transparent;
}

.grup__panel {
  display: flex;
  flex-direction: column;

  width: min(34rem, 100%);
  max-height: min(85vh, 44rem);

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);
  box-shadow: var(--bayang-panel);
  overflow: hidden;

  cursor: default;
}

/* Kepala tidak ikut menggulir. Daftar klip bisa sangat panjang, dan
   tombol tutup harus tetap terjangkau. */
.grup__kepala {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  padding: 0.75rem 0.875rem;

  border-bottom: 1px solid var(--garis-halus);
}

.grup__judul {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;

  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

.grup__angka {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  text-transform: none;
  color: var(--teks-sekunder);
}

.grup__tutup {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;

  background: none;
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-sedang);
  color: var(--teks-sekunder);
  cursor: pointer;
  transition: color var(--transisi), border-color var(--transisi);
}

.grup__tutup:hover {
  color: var(--teks-utama);
  border-color: var(--garis-sedang);
}

/* Satu-satunya bagian yang menggulir. `overscroll-behavior` menjaga
   guliran tidak menyeberang ke halaman di belakang dialog. */
.grup__isi {
  padding: 0.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.grup__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

.grup__catatan {
  padding: 0.5rem;

  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--teks-sekunder);
}

.grup__muat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem 0.875rem;

  background: none;
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-sedang);

  color: var(--teks-sekunder);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: color var(--transisi), border-color var(--transisi);
}

.grup__muat:hover {
  border-color: var(--garis-aktif);
  color: var(--teks-aksen);
}

.grup__muat:disabled {
  opacity: 0.6;
  cursor: progress;
}

.grup__selesai {
  margin-top: 0.75rem;

  font-size: 0.75rem;
  color: var(--teks-lembut);
  text-align: center;
}
</style>
