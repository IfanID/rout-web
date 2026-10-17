<script setup lang="ts">
/* Tombol kembali ke atas untuk daftar panjang.
 *
 *   tanpa prop   yang digulir adalah halaman — dipakai di daftar klip dan
 *                daftar episode
 *   dengan prop  yang digulir adalah elemen itu sendiri — dipakai di popup
 *                kelompok hasil pencarian, yang isinya bergulir di dalam
 *                panelnya
 *
 * Propnya menentukan DUA hal sekaligus, bukan hanya target gulirannya:
 * tempat tombolnya juga berbeda. Tanpa itu, `position: fixed` di dalam
 * popup akan menaruh tombolnya melayang di luar panel, di tengah layar.
 *
 * Daftar klip satu halaman (`preview/:id`) tidak memakai ini. Panjangnya
 * bergantung pada apakah SBS bisa dihubungi — kalau "Klip lain" kosong,
 * bagian itu disembunyikan dan halaman cuma setinggi pemutar, jadi
 * ambangnya memang tidak akan pernah tercapai. Itu perilaku yang benar,
 * bukan kasus yang perlu ditangani. */

const props = defineProps<{
  /** Elemen yang bergulir. Kosong berarti halaman. */
  wadah?: HTMLElement | null
}>()

/* Muncul setelah lewat satu layar.
 *
 * Satu layar, bukan angka tetap: di halaman pendek ambangnya tidak akan
 * tercapai sama sekali, dan di halaman panjang angkanya ikut ukuran layar
 * orang itu sendiri.
 *
 * Di dalam wadahnya yang dibandingkan dengan `clientHeight` — tinggi
 * wadahnya sendiri, bukan tinggi jendela. Popup kelompok bisa jauh lebih
 * pendek daripada layar, jadi ambang satu-layar akan selalu terlalu tinggi
 * dan tombolnya tidak akan pernah muncul. */
const muncul = ref(false)

function ukurPosisi() {
  muncul.value = props.wadah
    ? props.wadah.scrollTop > props.wadah.clientHeight
    : window.scrollY > window.innerHeight
}

/* Targetnya disimpan, karena wadahnya bisa berganti: popup ditutup lalu
 * dibuka lagi, dan elemen yang didengar yang sebelumnya harus dilepas
 * dulu — kalau tidak, listener-nya menumpuk satu per pembukaan.
 *
 * Menpasang listener yang sama dua kali pada target yang sama tidak
 * menggandakan pemanggilan, jadi `dengar()` boleh dipanggil ulang tanpa
 * alasan. Yang berbahaya hanya listener yang menumpuk di target yang
 * berbeda. */
let didengar: EventTarget | null = null

function dengar(target: EventTarget) {
  if (didengar === target) return

  didengar?.removeEventListener('scroll', ukurPosisi)
  didengar = target
  target.addEventListener('scroll', ukurPosisi, { passive: true })

  ukurPosisi()
}

/* Elemen di dalam `dialog` baru ada setelah dialog dirender, jadi
 * `wadah`-nya datang setelah mount. Karena itu dipasang di `onMounted`
 * lalu diawasi, bukan hanya sekali di mount. */
onMounted(() => dengar(props.wadah ?? window))

watch(
  () => props.wadah,
  nilai => dengar(nilai ?? window)
)

onBeforeUnmount(() => {
  didengar?.removeEventListener('scroll', ukurPosisi)
  didengar = null
})

/* `matchMedia` belum dipakai di proyek ini. Yang ditanyakan di sini bukan
 * "bolehkah gerak", melainkan "bolehkah yang meluncur" — dua hal berbeda,
 * dan orang bisa menyetel keduanya secara terpisah. */
function kurangiGerak() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function keAtas() {
  const perilaku = kurangiGerak() ? 'auto' : 'smooth'

  if (props.wadah) {
    props.wadah.scrollTo({ top: 0, behavior: perilaku })
  } else {
    window.scrollTo({ top: 0, behavior: perilaku })
  }
}

/* Penempatan di dalam wadahnya bukan `fixed`. `sticky` satu-satunya
 * positioning yang ikut bergulir bersama wadahnya dan tetap menempel di
 * tepi bawah area yang sedang terlihat. */
const dalam = computed(() => Boolean(props.wadah))
</script>

<template>
  <!-- `v-if`, bukan disembunyikan dengan CSS: elemen yang ada tapi tak
       terlihat masih bisa difokuskan, jadi orang yang memakai Tab akan
       menemukan tombol yang tidak bisa dilihatnya. -->
  <button
    v-if="muncul"
    type="button"
    class="atas"
    :class="{ 'atas--dalam': dalam }"
    aria-label="Kembali ke atas"
    @click="keAtas"
  >
    <Icon name="lucide:arrow-up" class="atas-ikon" aria-hidden="true" />
  </button>
</template>

<style scoped>
/* ==========================================================================
   Mengambang di pojok kanan bawah halaman.

   Angkanya diambil dari komponen yang sudah mengambang di atas navbar:
   `bottom: calc(72px + 0.25rem)` di `.cari__petunjuk` pada `search.vue`.
   72px itu tinggi navbar bawah, dan tinggi itu sama di semua lebar — jadi
   tidak ada breakpoint yang perlu ditambah di sini.
   ========================================================================== */

.atas {
  position: fixed;
  right: 1rem;
  bottom: calc(72px + 0.25rem);
  z-index: 35;

  display: flex;
  align-items: center;
  justify-content: center;

  /* 2.75rem = 44px, ambang area sentuh yang lazim untuk layar sentuh —
     angka yang sama dengan tombol hapus di panel cari. */
  width: 2.75rem;
  height: 2.75rem;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: 50%;
  box-shadow: var(--bayang-panel);

  color: var(--teks-sekunder);
  cursor: pointer;
  transition: color var(--transisi), border-color var(--transisi);
}

.atas:hover {
  color: var(--teks-utama);
  border-color: var(--garis-aktif);
}

/* Cincin fokus wajib, bukan opsional: tombol ini muncul dan hilang
 * sendiri, jadi tanpa cincinnya orang yang memakai Tab tidak pernah tahu
 * fokusnya sudah sampai ke sini. Bentuknya sama dengan `.cari__hapus`. */
.atas:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--aksen-glow);
}

/* Ikon lewat `font-size` pada elemennya sendiri, bukan `:deep(svg)`:
   @nuxt/icon merender ikon sebagai `<span class="iconify">` dan
   menggambarnya lewat mask CSS — lihat catatan ikon di AGENTS.md. */
.atas-ikon {
  font-size: 1.25rem;
}

/* --- Di dalam wadahnya ---
   `sticky` dengan `bottom` menempelkan elemen ke tepi bawah area yang
   sedang terlihat selama wadahnya masih digulir — persis yang dibutuhkan,
   dan tetap berada di dalam panel.

   `margin-left: auto` karena `.grup__isi` bukan flex container; tanpa itu
   tombolnya duduk di tepi kirinya.

   `bottom: 0.75rem`, bukan `0`: tanpa jarak apa pun tombolnya menempel di
   garis bawah daftar, dan garis itu bergerak terus saat digulir. */
.atas--dalam {
  position: sticky;
  right: auto;
  bottom: 0.75rem;
  margin-left: auto;
}
</style>
