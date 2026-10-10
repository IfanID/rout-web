<template>
  <header class="header">
    <NuxtLink :to="localePath('index')" class="header__logo">
      <Icon name="lucide:crosshair" class="header__ikon" />
      Rout
    </NuxtLink>

    <span
      ref="wadah"
      class="header__kanan"
      :class="{ 'header__kanan--geser': melimpah }"
    >
      <span class="header__jejak">
        <span class="header__potongan">{{ teks }}</span>
        <span v-if="melimpah" class="header__potongan" aria-hidden="true">
          {{ teks }}
        </span>
      </span>
    </span>
  </header>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

/** Teks dummy, dipilih acak tiap muat halaman.
 *  Panjang sengaja bervariasi supaya bisa dilihat bagaimana header
 *  menangani teks pendek sampai yang terlalu panjang untuk satu baris. */
const OPSI = [
  'Aktif',
  'Rout',
  'Status: aktif',
  'Proyek sedang berjalan',
  'Nama pengguna dengan nama yang sangat panjang sekali untuk menguji pemotongan teks'
]

// Diisi di server supaya HTML pertama tidak kosong, lalu diacak ulang
// di browser. Kalau diacak langsung di server, hasil SSR dan browser
// akan berbeda dan Vue mencatat error hydration.
const teks = ref(OPSI[0])

const wadah = ref<HTMLElement | null>(null)
const melimpah = ref(false)

/** Teks bergerak hanya kalau benar-benar melebihi ruangnya.
 *  Kalau selalu bergerak, teks pendek ikut bergeser dan mengganggu. */
function ukur() {
  const el = wadah.value
  if (!el) return
  melimpah.value = el.scrollWidth > el.clientWidth
}

onMounted(() => {
  teks.value = OPSI[Math.floor(Math.random() * OPSI.length)]
  ukur()

  if (typeof ResizeObserver !== 'undefined' && wadah.value) {
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(wadah.value)
    onUnmounted(() => pengamat.disconnect())
  }
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;

  display: flex;
  align-items: center;
  gap: 1.25rem;

  padding: 0.1875rem 1.25rem;
  background: var(--latar-naik-1);
  border-bottom: 1px solid var(--garis-halus);
}

.header__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  flex-shrink: 0;

  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--teks-utama);
  transition: color var(--transisi);
}

.header__logo:hover {
  color: var(--teks-aksen-murni);
}

.header__ikon {
  font-size: 1.125rem;
  color: var(--aksen-indikator);
}

/* Wadah teks: satu baris, dipotong, tidak mendorong logo.
   Sengaja tanpa flex: 1 supaya teks menempel di sebelah logo dengan
   jarak yang sama, bukan terdorong ke tepi kanan. */
.header__kanan {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;

  font-size: 1rem;
  color: var(--teks-sekunder);
}

.header__jejak {
  display: flex;
  width: max-content;
}

/* Padding di dalam tiap potongannya, bukan di antaranya. Dengan begitu
   geser -50% tepat sama dengan lebar satu potongan, jadi tidak ada
   celah atau lompatan saat berulang. */
.header__potongan {
  padding-inline-end: 2rem;
}

/* Loop tanpa jeda: -50% geser tepat satu potongan, jadi potongan kedua
   masuk persis di tempat potongan pertama. */
.header__kanan--geser .header__jejak {
  animation: geser 9s linear infinite;
}

@keyframes geser {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.header__kanan--geser:hover .header__jejak {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .header__kanan--geser .header__jejak {
    animation: none;
  }
}
</style>