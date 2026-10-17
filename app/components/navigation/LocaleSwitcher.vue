<script setup lang="ts">
/** Pemilih bahasa: satu tombol di pojok kanan halaman Pengaturan.
 *
 *  Ditempatkan di halaman itu, bukan di header. Header sudah punya
 *  satu tombol di pojok kanannya — lonceng aktivitas — dan
 *  menambah tombol kedua di sana membuat dua kontrol berdampingan
 *  yang tugasnya berbeda jauh. Bahasa juga jarang diganti: orang
 *  memilihnya sekali, bukan tiap halaman, jadi tempatnya di
 *  halaman yang memang dibuka untuk mengubah pengaturan.
 *
 *  Yang ditampilkan di pemicu hanya kode bahasanya (ID, EN, KO),
 *  bukan `name` dari nuxt.config. Nama itu ditulis dalam Bahasa
 *  Inggris, sedangkan halaman ini bisa sedang dibaca dalam Bahasa
 *  Korea — dan kode bahasa adalah singkatan yang sama di ketiga
 *  versi, jadi tidak ada yang perlu diterjemahkan.
 *
 *  Pemicunya memakai `.tombol tombol--sekunder` dari main.css,
 *  bukan gaya sendiri. Bentuknya jadi sama dengan tombol lain di
 *  proyek ini, dan yang ditulis di sini hanya ukurannya.
 *
 *  `switchLocalePath` menghasilkan alamat halaman yang SAMA dalam
 *  bahasa tujuan, jadi orang yang sedang di /id/settings berpindah
 *  ke /en/settings — bukan dilempar ke beranda.
 *
 *  Daftarnya tautan, bukan tombol yang memanggil `setLocale`.
 *  Dengan tautan, alamatnya benar-benar berpindah seperti navigasi
 *  biasa: bisa dibuka di tab baru dan tidak bergantung pada urutan
 *  JavaScript yang memuat.
 *
 *  Menunya dropdown biasa, bukan <dialog>: diposisikan absolut di
 *  bawah tombol, rata kanan. Dialog tidak bisa diposisikan —
 *  showModal() menengahkannya — dan untuk memilih di antara tiga
 *  bahasa, menu yang muncul di tempat tombol ditekan terasa jauh
 *  lebih langsung.
 *
 *  Penutupannya dua kejadian dokumen, bukan lapisan tirai. Klik di
 *  luar menu dan keduanya dilepas begitu menu tutup. Tanpa lapisan,
 *  header dan lonceng tetap bisa diklik selama menu terbuka.
 *
 *  Yang dibayar: <dialog> menangkap fokus ke dalamnya sendiri,
 *  dan ini tidak. Tab bisa keluar dari menu ke halaman. Untuk tiga
 *  tautan yang selalu terlihat, itu tidak jadi masalah. */

const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

/** Wadah untuk menentukan apakah sebuah klik mendarat di dalam
 *  tombol atau di menu. */
const wadah = ref<HTMLElement | null>(null)

const terbuka = ref(false)

function buka() {
  terbuka.value = true
  document.addEventListener('click', saatKlik)
  document.addEventListener('keydown', saatKey)
}

function tutup() {
  terbuka.value = false
  document.removeEventListener('click', saatKlik)
  document.removeEventListener('keydown', saatKey)
}

/* Sengaja `if`, bukan toggle mentah: klik pada tombol itu sendiri
 * diabaikan oleh saatKlik, jadi kalau ini menutup, menu tidak
 * langsung terbuka lagi oleh klik yang sama. */
function saklar() {
  if (terbuka.value) tutup()
  else buka()
}

/* Klik di luar menu. Yang mendarat di dalam wadah — tombol atau
 * daftar — bukan klik luar. */
function saatKlik(e: MouseEvent) {
  const target = e.target
  if (target instanceof Node && wadah.value?.contains(target)) return
  tutup()
}

function saatKey(e: KeyboardEvent) {
  if (e.key === 'Escape') tutup()
}

/* Komponen bisa hilang saat menu masih terbuka — misalnya orang
 * menutup halaman. Kalau listenernya tidak dilepas, ia menumpuk di
 * dokumen dan menutup menu yang sudah tidak ada. */
onUnmounted(tutup)

/** Kode bahasa yang sedang aktif, untuk pemicu. */
const kode = computed(() => locale.value.toUpperCase())
</script>

<template>
  <div ref="wadah" class="bahasa">
    <button
      type="button"
      class="tombol tombol--sekunder bahasa__pemicu"
      :aria-label="t('pengaturan.pilih_bahasa')"
      aria-haspopup="menu"
      :aria-expanded="terbuka"
      @click="saklar"
    >
      <Icon name="lucide:languages" class="bahasa__ikon" />
      <span class="bahasa__kode">{{ kode }}</span>
      <Icon name="lucide:chevron-down" class="bahasa__panah" />
    </button>

    <!-- Dirender hanya saat terbuka. Klik pada tautannya menutup menu
         lebih dulu: perpindahan ke halaman yang sama dalam bahasa
         yang sama tidak memindahkan apa pun, jadi tanpa baris itu
         menekan bahasa yang sedang aktif meninggalkan menu terbuka. -->
    <ul v-if="terbuka" class="bahasa__menu" role="menu">
      <li v-for="l in locales" :key="l.code">
        <NuxtLink
          class="bahasa__opsi"
          :class="{ 'bahasa__opsi--aktif': l.code === locale }"
          :aria-current="l.code === locale ? 'true' : undefined"
          :to="switchLocalePath(l.code)"
          @click="tutup"
        >
          <span class="bahasa__nama">{{ l.name }}</span>
          <span class="bahasa__kode-kecil">{{ l.code.toUpperCase() }}</span>
          <Icon
            v-if="l.code === locale"
            name="lucide:check"
            class="bahasa__centang"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Wadah sekaligus jangkar posisi untuk menu.
 *
 * `width: max-content` membuat wadah ini pas mengikuti lebar tombol,
 * tidak lebih lebar. Tanpa itu, wadah — sebagai flex item — punya
 * lebar yang ditentukan oleh flex, dan `right: 0` pada menu akan
 * mengukur dari tepi wadah, bukan tepi tombol. Keduanya sama selama
 * tombol itu satu-satunya isi, tapi membuatnya eksplisit menjaga
 * tepi kanan menu selalu tepat di tepi kanan tombol, di ukuran
 * layar mana pun.
 *
 * Tepi kanan tombol sendiri ada di tepi kanan kolom konten (ia
 * anak terakhir dengan `justify-content: space-between`), jadi
 * jarak tepi kanan menu ke tepi kanan layar sama dengan jarak judul
 * ke tepi kiri layar. Itu yang membuatnya simetris. */
.bahasa {
  position: relative;
  width: max-content;
}

/* Pemicu ---------------------------------------------------------- */

/* Hanya ukurannya yang ditulis di sini, sisanya dari .tombol dan
 * .tombol--sekunder. Tombol ini berdiri sebaris dengan judul
 * halaman, jadi tingginya dibuat lebih rendah daripada tombol
 * sekunder biasa supaya tidak menarik perhatian lebih dari
 * judulnya. */
.bahasa__pemicu {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
}

.bahasa__ikon {
  font-size: 1rem;
  color: var(--teks-sekunder);
}

.bahasa__kode {
  font-weight: 600;
}

.bahasa__panah {
  font-size: 0.875rem;
  color: var(--teks-lembut);
  transition: transform var(--transisi);
}

.bahasa__pemicu[aria-expanded='true'] .bahasa__panah {
  transform: rotate(180deg);
}

/* Menu -------------------------------------------------------------- */

/* Menempel di bawah tombol, tepi kanannya sejajar dengan tepi kanan
 * tombol. `right: 0` diukur terhadap .bahasa — yang lebarnya sama
 * dengan lebar tombol — jadi menu tidak pernah keluar layar di sisi
 * kanan, dan muncul persis di tempat tombol ditekan. */
.bahasa__menu {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  /* Di atas isi halaman. Tidak perlu di atas header: menu terbuka
   * ke bawah dari tombol yang sudah berada di bawah header. */
  z-index: 50;

  width: max-content;
  max-width: calc(100vw - 2rem);
  margin: 0;
  padding: 0.375rem;
  list-style: none;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);
  box-shadow: var(--bayang-panel);
}

/* Opsi --------------------------------------------------------------- */

/* Warnanya ditulis ulang karena `a` di main.css memberinya warna
 * aksen — di sini barisnya permukaan yang bisa diklik, bukan
 * tautan yang perlu menonjol. Selector kelas menang atas selector
 * elemen, jadi warna itu yang dipakai. */
.bahasa__opsi {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sedang);

  color: var(--teks-utama);
  transition: background var(--transisi), color var(--transisi);
}

.bahasa__opsi:hover {
  background: var(--latar-sorot);
  color: var(--teks-utama);
}

.bahasa__opsi--aktif {
  background: var(--aksen-latar);
}

.bahasa__nama {
  font-size: 0.9375rem;
}

/* Kode bahasa didorong ke kanan. `margin-left: auto` juga yang
 * menjaga centang tetap di ujung baris, tidak menempel di sebelah
 * kodenya. */
.bahasa__kode-kecil {
  margin-left: auto;

  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--teks-lembut);
}

.bahasa__centang {
  font-size: 0.875rem;
  color: var(--teks-aksen);
}
</style>
