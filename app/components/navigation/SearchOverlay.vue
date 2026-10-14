<script setup lang="ts">
const { t } = useI18n()

/* `buka` sengaja tidak diambil di sini. Pemicunya ada di navbar
   bawah, bukan di panel — panel ini cuma menerima perintah. */
const { terbuka, kueri, tutup } = useSearchOverlay()

const layar = ref<HTMLDialogElement | null>(null)
const masukan = ref<HTMLInputElement | null>(null)

/* State `terbuka` bisa menyala sebelum elemen <dialog> siap, jadi
   keduanya disinkronkan lewat watch, bukan lewat pemanggilan
   showModal() langsung di composable.

   `showModal()` melempar galat kalau dialog-nya sudah terbuka, dan
   `close()` melempar kalau yang belum. Karena itu keduanya dicek
   lebih dulu di baris masing-masing.

   Fokus dipindahkan manual setelah nextTick. Atribut `autofocus`
   pada <input> di dalam <dialog> tidak selalu berlaku, karena
   elemen itu baru masuk top layer saat showModal() dipanggil —
   jadi waktu atribut itu dibaca, input belum ada di sana.

   ---- soal fokus setelah panel ditutup ----

   Tidak ada pemulihan fokus manual di sini, dan itu disengaja.

   Semula di sini `el.close()` diikuti mengembalikan fokus ke
   tombol navbar dengan `focus({ preventScroll: true })`,
   dengan alasan Chrome ikut menggulir halaman saat memulihkan
   fokus. Ternyata justru pemecahannya: di jalur Enter, halaman
   melompat tepat setelah panel ditutup.

   Yang membedakan kedua jalur ada di baris `if (!el.open)`.
   Escape menutup dialog-nya sendiri, jadi watcher keluar duluan
   dan pemulihan fokus manual tidak pernah jalan — dan Escape
   justru tidak bermasalah. Enter menutup lewat kode di sini, jadi
   pemulihannya berjalan, dan ikut bermasalah.

   Jadi cukup biarkan peramban yang memulihkan fokus. Itu yang
   sudah berjalan di jalur Escape, dan perilaku itu memang benar:
   tombol navbar kembali fokus supaya pemakainya tidak kehilangan
   tempatnya setelah menutup panel. */
watch(terbuka, async nilai => {
  const el = layar.value
  if (!el) return

  if (nilai) {
    if (!el.open) el.showModal()
    await nextTick()
    masukan.value?.focus()
  } else if (el.open) {
    el.close()
  }
})

/* Escape sudah ditangani <dialog> sendiri. Baris ini hanya
   menyinkronkan state saat jendela ditutup lewat Escape atau
   klik di luar panel, supaya navbar tahu panel sudah tidak ada. */
function saatTutup() {
  if (terbuka.value) tutup()
}

/* Dialog memenuhi layar, jadi klik yang mendarat di elemen dialog
   itu sendiri berarti pengguna menekan tirai di luar panel. Yang
   di dalam panel selalu punya target lain. */
function saatKlik(e: MouseEvent) {
  if (e.target === layar.value) tutup()
}

/* Kueri dikosongkan → panel ikut tutup.

   Kolomnya dikosongkan lewat tombol hapus bawaan browser, atau
   Ctrl+A lalu Backspace. Dua-duanya membuat `adaKueri` jadi
   false, dan itu berarti blok hasil di halaman ikut lenyap.

   Kalau panel tetap terbuka di saat itu, isinya tidak berguna
   apa pun: tidak ada teks untuk dicari, dan hasil yang tadi
   dibaca sudah hilang. Menutupnya mengembalikan keadaan ke yang
   konsisten — panel tertutup, halaman kosong, keduanya
   tersembunyi satu sama lain.

   Dipakai `trim` supaya spasi saja dianggap kosong. Tanpa itu,
   panel masih terbuka dengan isi spasi yang tidak akan pernah
   mencari apa pun. */
watch(kueri, nilai => {
  if (terbuka.value && nilai.trim() === '') tutup()
})

/* Panel hanya hidup di halaman /search. Kalau pengguna menutup tab
   atau menekan tombol back saat panel terbuka, komponen ini
   dibuang tanpa sempat menutup dialognya — tapi `terbuka` tetap
   menyala di state.

   Watch di atas tidak akan menangkap itu: ia hanya bereaksi pada
   perubahan nilai, dan nilainya sudah `true` sejak komponen
   dilepas. Akibatnya kunjungan berikutnya ke /search akan
   ter-render dengan panel terbuka tanpa diminta.

   Membersihkan di onUnmounted menutup celah itu. */
onUnmounted(() => {
  if (terbuka.value) tutup()
})
</script>

<template>
  <dialog
    ref="layar"
    class="cari__layar"
    :aria-label="t('cari.panel')"
    @click="saatKlik"
    @close="saatTutup"
  >
    <div class="cari__panel">
      <!-- Tombol tutup punya barisnya sendiri, bukan ditumpuk di
           atas input.

           Alasannya tombol hapus bawaan browser. `type="search"`
           memunculkan tanda silang kecil di dalam kotak begitu
           ada teks, di sisi kanan — persis di tempat yang biasa
           dipakai tombol tutup. Kalau keduanya ditumpuk, yang
           terlihat hanya satu silang dan orang tidak tahu itu
           menghapus teks atau menutup panel.

           Baris kepala membuat keduanya terpisah, dan tombol
           hapus browser tetap ada di dalam kotak seperti
           biasanya. -->
      <div class="cari__kepala">
        <span class="cari__label">{{ t('cari.panel') }}</span>

        <button
          type="button"
          class="cari__tutup"
          :aria-label="t('cari.tutup')"
          @click="tutup"
        >
          <Icon name="lucide:x" />
        </button>
      </div>

      <!-- Enter diteangani langsung di input, bukan lewat <form>.

         Semula input-nya dibungkus `<form>` dengan
         `@submit.prevent`, karena itu cara baku membuat Enter
         berarti "cari". Tapi submit implisit peramban — yang
         terjadi otomatis saat Enter ditekan di kolom teks tanpa
         tombol submit — ternyata membawa perilaku bawaan yang
         tidak kita inginkan: di Android, menutup panel lewat
         Enter membuat navbar melompat turun lalu kembali,
         sementara lewat Escape atau tombol X tidak.

         Pindah ke `@keydown.enter` membuang seluruh submit
         implisit itu, jadi yang tersisa hanyalah satu hal yang
         kita tulis sendiri.

         `enterkeyhint="search"` supaya tombol di keyboard Hp tetap
         berbunyi "cari". Tanpa itu, tombolnya berbunyi "enter"
         yang terdengar seperti tombol biasa, padahal ia
         menjalankan pencarian. Atribut ini ada di Chrome Android
         110 ke atas; di bawah itu tombolnya kembali jadi "enter"
         dan tombol paling bawah keyboard tetap memunculkan
         "cari" seperti biasanya.

         `.input` dipakai apa adanya dari main.css, termasuk
         state fokusnya. Tidak ada aturan warna di sini. -->
      <input
        ref="masukan"
        v-model="kueri"
        type="search"
        enterkeyhint="search"
        class="input cari__input"
        :aria-label="t('cari.label_input')"
        :placeholder="t('cari.placeholder')"
        @keydown.enter.prevent="tutup"
      />
    </div>
  </dialog>
</template>

<style scoped>
/* ==========================================================================
   Panel pencarian yang melayang di tengah halaman.

   Tirainya polos, tanpa blur — belum sengaja.

   Semula ada `backdrop-filter: blur(0.375rem)` di elemen ini
   (bukan di `::backdrop`, karena yang terakhir baru benar sejak
   Safari 18). Itu menyebabkan artefak di navbar: lapisan
   komposit sebesar layar tidak selalu hilang bersih begitu
   dialog ditutup, dan isi di bawahnya — navbar — tertinggal
   dalam versi yang sudah ter-blur sampai halaman di-reload.

   Fade-out sebelum menutup dan paksa repaint setelahnya sudah
   dicoba, keduanya tidak berhasil. Kalau nanti blur mau
   dinyalakan lagi, dua baris berikut harus ditambahkan di dalam
   `.cari__layar` — dan bukan hanya itu, karena penyebabnya belum
   benar-benar dipahami:

     backdrop-filter: blur(0.375rem);
     -webkit-backdrop-filter: blur(0.375rem);

   Solusi yang lebih mungkin berhasil nanti: pakai `::backdrop`
   dan korbankan blur di Safari 18 ke bawah, karena pseudo-element
   itu dikelola peramban dengan jalur komposit yang berbeda.
   ========================================================================== */

.cari__layar {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  padding: 0;
  border: 0;

  background: var(--tirai);
}

/* Hanya saat dialog terbuka.

   Tanpa aturan ini, <dialog> yang terbuka hanya mendapat
   `display: block` bawaan peramban. Akibatnya panel tidak
   dipusatkan — ia menempel di pojok kiri atas — dan padding
   1rem yang menjaga panel tidak menyentuh tepi layar.

   Peramban memakai `display: none` untuk dialog yang tertutup,
   jadi aturan ini tidak perlu apa pun untuk kondisi itu. */
.cari__layar[open] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cari__layar::backdrop {
  background: transparent;
}

.cari__panel {
  width: min(34rem, 100%);
  padding: 0.75rem;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);
  box-shadow: var(--bayang-panel);

  /* Masukkan kursor di dalam panel, bukan menyeberang ke input
     yang tidak bisa diklik. */
  cursor: default;
}

.cari__kepala {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  margin-bottom: 0.5rem;
}

/* Label memakai bentuk yang sama dengan .bagian__judul di
   main.css dan .pengaturan__label di halaman Pengaturan, supaya
   huruf kecil di navbar terasa satu keluarga. */
.cari__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

.cari__tutup {
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

.cari__tutup:hover {
  color: var(--teks-utama);
  border-color: var(--garis-sedang);
}
</style>