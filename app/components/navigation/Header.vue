<template>
  <header class="header">
    <!-- Pembatas lebar. `header` sendiri tetap full-bleed supaya
         latarnya sampai ke tepi layar. -->
    <div class="header__isi">
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

      <!-- Lonceng riwayat aktivitas.
           Di header, bukan di pojok halaman: notifikasi itu menyangkut
           seluruh situs, bukan satu halaman, dan tempat yang selalu ada di
           setiap halaman cuma header ini.

           Diletakkan SETELAH teks berjala, tanpa dorongan apa pun: ruang
           sisa diserap teks itu sendiri lewat `flex: 1`. Kalau urutannya
           dibalik, atau kalau teksnya dikembalikan ke `margin-left: auto`,
           jarak logo ke lonceng jadi sebesar sisa layar dan keduanya terlihat
           berjauhan padahal hanya satu baris. -->
      <NotificationAktivitasBell />
    </div>
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
/* Latar penuh selebar layar: header menempel di atas, jadi tepinya
 * harus sampai ke kanan dan kiri. Yang dibatasi hanya isinya —
 * `--lebar-konten` sama dengan yang dipakai `.konten`, supaya logo
 * dan judul halaman segaris dengan isi halaman di semua lebar.
 *
 * Pembatasnya di dalam `header__isi`, bukan di `.header` sendiri,
 * supaya latar dan garis bawahnya tetap memenuhi layar. */
.header {
  position: sticky;
  top: 0;
  z-index: 40;

  /* `--sisi-header`, `--pad-header`, dan `--batas-header` bukan gaya,
     melainkan KONTRAK dengan panel lonceng di AktivitasBell.vue. Alasannya
     ada di sana; intinya: panel itu absolut terhadap `.lonceng`, sehingga
     jaraknya ke tepi bawah header tidak bisa hanya `jarak-panel` — di
     antaranya masih ada sisa ruang baris, padding bawah header, dan garis
     bawahnya. `--sisi-header` juga yang memisahkan tepi layar dari tepi
     kolom konten.

     `--bawah-header` turunan dari dua angka lain, bukan angka ketiga
     berdiri sendiri: begitu padding atau garisnya berubah, turunannya ikut
     dan popup tetap menempel. */
  --sisi-header: 1.5rem;

  /* Lebar zona tepi kiri dan kanan. Dipakai DUA-duanya — kotak logo dan
     kotak lonceng — supaya keduanya sama lebar oleh konstruksi, bukan oleh
     perkiraan lebar huruf "Rout".

     Konsekuensinya seluruh header jadi simetris: dua zona tepi sama lebar
     dengan jarak yang sama, sehingga kotak teks berjalan di tengahnya
     otomatis terpusat. Tidak perlu `margin: auto` untuk itu.

     3.5rem dan bukan angka yang lebih ketat: lebar teks "Rout" bergantung
     pada font sistem perangkat, dan token yang terlalu pas akan memotong
     teks di satu perangkat tapi tidak di perangkat lain. Karena keduanya
     membaca token ini, kesamaannya tidak bergantung pada tebal-tipisnya
     huruf. */
  --lebar-zona: 3.5rem;
  --pad-header: 0.1875rem;
  --batas-header: 1px;
  --bawah-header: calc(var(--pad-header) + var(--batas-header));

  /* Padding samping sengaja sama dengan `.konten` supaya isinya segaris
     persis di semua lebar. Kalau berbeda, di layar sempit logo bergeser
     beberapa piksel dari isi halaman — kecil, tapi terlihat karena
     keduanya ada di satu layar. */
  padding: var(--pad-header) var(--sisi-header);
  background: var(--latar-naik-1);
  border-bottom: var(--batas-header) solid var(--garis-halus);
}

@media (max-width: 30rem) {
  .header {
    --sisi-header: 1rem;
    padding-inline: var(--sisi-header);
  }
}

.header__isi {
  display: flex;
  align-items: center;

  /* Jarak dalam baris, SAMA dengan jarak tepi (`--sisi-header`) supaya
   * keempat jarak di header sama: kiri ke logo, logo ke marquee, marquee
   * ke lonceng, dan lonceng ke kanan.
   *
   * Dulu jaraknya `1.25rem` — 4px lebih besar dari padding tepi, jadi
   * membandingkan jarak dalam dan jarak tepi selalu menghasilkan selisih
   * yang kecil tapi kelihatan. Sekarang keduanya membaca token yang sama,
   * jadi tidak bisa berbeda kecuali tokennya memang diubah.
   *
   * Ruang yang lebih dari empat jarak itu diserap `.header__kanan`, bukan
   * lonceng — lihat `flex: 1` di sana. */
  gap: var(--sisi-header);

  max-width: var(--lebar-konten);
  margin-inline: auto;
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

  /* Sama lebar dengan zona kanan. `nowrap` supaya teks tidak pernah
     turun baris kalau fontnya lebih lebar dari dugaan — lebih baik
     terpotong di dalam kotaknya daripada merusak tinggi header. */
  width: var(--lebar-zona);
  white-space: nowrap;
}

.header__logo:hover {
  color: var(--teks-aksen-murni);
}

.header__ikon {
  font-size: 1.125rem;
  color: var(--aksen-indikator);
}

/* Teks berjala yang mengisi ruang sisa.
 *
 * `flex: 1` membuatnya melebar sampai ke lonceng, jadi jarak antara
 * marquee dan lonceng ikut ditentukan oleh `gap` yang sama seperti jarak
 * lainnya — bukan oleh `margin-left: auto` di lonceng yang dulu mendorongnya
 * ke tepi kanan dan membuat jaraknya sebesar sisa layar.
 *
 * Dulu lonceng-lah yang menyerap sisanya, dan itulah yang membuat logo di
 * kiri dan lonceng di kanan terasa berjauhan padahal keduanya hanya
 * dibatasi satu baris.
 *
 * `min-width: 0` tetap wajib supaya boleh menyusut sampai nol, dan
 * `overflow: hidden` yang memotong teksnya kalau tidak cukup ruang. Tanpa
 * keduanya teks berjalanya akan mendorong lonceng keluar baris. */
.header__kanan {
  flex: 1;

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

/* Lonceng didorong ke tepi kanan baris, bukan ikut menempel di sebelah teks
 * berjala.
 *
 * `margin-left: auto` di flex row menghabiskan sisa ruang di sebelah
 * kirinya, jadi lonceng selalu rata kanan tanpa harus tahu lebar teksnya —
 * teks berkedip, memotong, atau berganti isi, posisi loncengnya tidak
 * bergerak. Tanpa itu, lonceng duduk di sebelah kanan teks dengan
 * jarak `gap` dan posisinya ikut berubah setiap kali teks yang lebih
 * pendek atau lebih panjang muncul.
 *
 * Rata kanan **kolom konten**, bukan tepi layar. `header__isi` dibatasi
 * `max-width: var(--lebar-konten)` supaya logo dan judul halaman segaris
 * dengan `.konten` di semua lebar — lonceng ikut aturan yang sama supaya
 * tidak jadi satu-satunya yang meleset ke luar kolom pada layar lebar.
 * Teks jalannya justru yang dipotong di layar sempit, dan itu memang
 * tugasnya: ia ornament, bukan informasi. */
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
