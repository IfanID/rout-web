<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

/* `buka` sengaja tidak diambil di sini. Pemicunya ada di navbar
   bawah, bukan di panel — panel ini cuma menerima perintah. */
const { terbuka, kueri, tutup } = useSearchOverlay()

/* Tiga keadaan yang menyangkut ketikan dan jalannya pencarian, bukan
 * hasil. Ketiganya di atas kotak panel, bukan di halaman.
 *
 * Sifat ketiganya, urut dari yang paling menentukan:
 *
 * - "Pendek": kuerinya belum cukup panjang untuk dicari. Satu kalimat
 *   tanpa alternatif, jadi panel menampilkannya apa adanya.
 * - "Mencari": permintaan sedang jalan.
 * - "Kosong": sudah selesai dicari dan tetap nol. Yang berarti **final**
 *   — indeks klip sudah selesai dibaca — bukan "sedang mencari". Kalau
 *   indeksnya masih disiapkan, nilainya tetap `null`: menyatakan "tidak
 *   ada hasil" saat arsipnya belum selesai dibaca akan berbohong.
 *
 * Ketiganya bernilai kosong selama isi input belum sama dengan kueri
 * yang sedang dicari, supaya orang yang menambah satu huruf tidak masih
 * membaca jawaban kueri sebelumnya.
 *
 * Dihitung di halaman, bukan di sini. Panel yang memanggil `useCari()`
 * sendiri akan membuat instance `useAsyncData` dan watcher kedua untuk
 * kueri yang sama — dua salinan yang bisa berbeda diam-diam. Pola yang
 * sama dipakai `SearchGroupDialog.vue`. */
defineProps<{
  kueriPendek: boolean
  kueriMencari: boolean
  kueriKosong: string | null
}>()

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
   di dalam panel selalu punya target lain.

   Pesan keadaan kosong berada di luar kotak panel, tapi tetap anak
   dialog, jadi mencarinya bukan berarti menekan tirai: yang di dalam
   dialog tidak pernah menutup panel lewat klik. */
function saatKlik(e: MouseEvent) {
  if (e.target === layar.value) tutup()
}

/** Mengosongkan kolom dan mengembalikan fokus ke input.
 *
 *  Fokus dikembalikan dengan sengaja. Kalau tombolnya yang menahan
 *  fokus, orang harus menekan kolom lagi sebelum bisa mengetik ulang —
 *  padahal aksinya sudah jelas. Memulihkan fokus berarti
 *  keyboard langsung siap, dan di layar sentuh itu yang biasa
 *  terjadi ketika menekan tanda silang bawaan peramban. */
function hapusTeks() {
  kueri.value = ''
  masukan.value?.focus()
}

/* Kueri dikosongkan TIDAK menutup panel.

   Semula panel ikut menutup begitu kolomnya kosong. Alasannya waktu
   itu isi panel masih hasil pencarian, jadi tanpa teks tidak ada yang
   terbaca. Sekarang isi panel cuma pesan, dan waktu input kosong
   ketiga keadaan itu semuanya bernilai kosong — panel tinggal kotak
   menganggur berisi label dan tombol tutup.

   Yang dirugikan justru orang yang menghapus untuk menulis ulang:
   dia sedang berpikir, dan panel dicabut tepat saat dia butuh menulis.

   Menutup panel tetap punya jalannya sendiri: Escape, tombol tutup,
   klik di luar, dan Enter. */

/* Panel hanya hidup di halaman /search. Kalau pengguna menutup tab
   atau menekan tombol back saat panel terbuka, komponen ini
   dibuang tanpa sempat menutup dialognya — tapi `terbuka` tetap
   menyala di state.

   Efeknya kunjungan berikutnya ke /search ter-render dengan panel
   terbuka tanpa diminta. Karena state itu di luar komponen, yang
   bisa membersihkannya hanya komponen ini, dan komponen baru dibuat
   setelah halaman selesai dirender. Jadi harus di `onUnmounted`. */
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
    <!-- Tiga keadaan di atas kotak panel: kuerinya kependekan, sedang
         mencari, atau selesai tanpa hasil.

         Berada DI ATAS kotak, bukan di dalamnya — jadi yang terbaca
         adalah jawabannya dulu, lalu di bawahnya kolom tempat
         menjawabnya. Bukan kebetulan: yang perlu dijawab adalah
         pertanyaan "kenapa begini", dan kotak panel menjawab "tulis
         di sini". Menumpukkannya di dalam kotak membuat yang satu
         menutupi yang lain.

         Ketiganya saudara satu sama lain, bukan elemen yang selalu ada
         dengan isi yang berubah. Wadah yang selalu ada akan menambah
         satu jarak `gap` kosong di bawah panel di saat tidak ada pesan,
         dan `role="status"`-nya akan ikut membaca ulang teks lama.

         Tidak ada keadaan keempat: waktu ada hasil, panel tidak perlu
         apa-apa. Hasilnya milik halaman, dan orang membacanya setelah
         panel ditutup.

         `role="status"` dipakai supaya pembaca layar ikut tahu keadaan
         berubah. Isi dialog ada di dalam top layer, jadi teks halaman
         yang sama di belakangnya tidak ikut diumumkan dua kali. -->
    <div class="cari__tumpuk">
      <p v-if="kueriPendek" class="cari__pesan" role="status">
        {{ t('cari.terlalu_pendek') }}
      </p>

      <p v-else-if="kueriMencari" class="cari__pesan" role="status">
        {{ t('cari.memuat') }}
      </p>

      <div v-else-if="kueriKosong" class="cari__pesan" role="status">
        <p class="cari__pesan-judul">
          {{ t('cari.tak_ada', { kueri: kueriKosong }) }}
        </p>

        <p class="cari__pesan-catatan">{{ t('cari.saran') }}</p>

        <ul class="cari__pintasan">
          <li>
            <NuxtLink :to="localePath('running-man-episode')" @click="tutup">
              {{ t('cari.saran_episode') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('running-man-preview')" @click="tutup">
              {{ t('cari.saran_klip') }}
            </NuxtLink>
          </li>
          </ul>
        </div>

      <div class="cari__panel">
        <!-- Baris kepala memuat label panel dan tombol tutupnya.

             Dulu alasannya lebih spesifik: tombol hapus bawaan
             browser muncul di dalam kotak input, persis di tempat
             tombol tutup biasanya, jadi kalau keduanya ditumpuk yang
             terlihat hanya satu silang dan orang tidak tahu itu
             menghapus teks atau menutup panel.

             Sekarang tombol hapusnya milik panel sendiri dan duduk di
             dalam input (lihat `.cari__kolom` di bawah), jadi tabrakan
             itu tidak ada lagi. Baris kepala tetap dipertahankan
             karena ia kepala panel: label menyatakan panel ini apa, dan
             tombolutup ada di tempat yang sama di seluruh dialog lain
             proyek ini. -->
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
        <div class="cari__kolom">
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

          <!-- Tombol hapus milik panel, bukan yang bawaan peramban.

               Yang bawaan itu muncul hanya di Blink dan WebKit, jadi
               bentuknya berbeda antarperamban dan areanya sentuhnya
               sekecil ikonnya — di layar sentuh itu sulit ditekan.
               Yang di sini 2.75rem, dan tetap sama di semua peramban.
               Aturan menyembunyikan tombol bawaan ada di `.cari__input`,
               tanpa itu akan ada dua tanda silang berdampingan. -->
          <button
            v-if="kueri"
            type="button"
            class="cari__hapus"
            :aria-label="t('cari.bersihkan')"
            @click="hapusTeks"
          >
            <Icon name="lucide:x" class="cari__hapus-ikon" />
          </button>
        </div>
      </div>
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

  /* `--tirai` 60%, sama seperti popup kelompok dan SlotSelect — halaman
   tetap terlihat redup di belakang panel, dan itu memang yang
   diinginkan.

   Efeknya: teks halaman masih terbaca di balik tirai. Blok keadaan
   kosong karena itu diletakkan di atas kotak panel dengan lebar yang
   sama, supaya jelas miliknya panel dan bukan sisa halaman di
   belakang. */
  background: var(--tirai);
}

/* Hanya saat dialog terbuka.

   Tanpa aturan ini, <dialog> yang terbuka hanya mendapat
   `display: block` bawaan peramban. Akibatnya panel tidak
   dipusatkan — ia menempel di pojok kiri atas — dan padding
   1rem yang menjaga panel tidak menyentuh tepi layar.

   Satu anaknya: `.cari__tumpuk`. Pesan keadaan tidak ikut dihitung
   di tingginya — lihat catatan di `.cari__tumpuk`.

   Peramban memakai `display: none` untuk dialog yang tertutup,
   jadi aturan ini tidak perlu apa pun untuk kondisi itu. */
.cari__layar[open] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cari__layar::backdrop {
  background: transparent;
}

.cari__panel {
  width: 100%;
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

/* --- Tumpuk: panel dan pesan di atasnya ---
   Elemen yang dipusatkan dialog ini tumpukan, bukan panel langsung.
   Penting karena tinggi tumpukan cuma tinggi panel: pesannya
   `position: absolute`, jadi saat muncul atau hilang tidak menambah
   apa pun dan panel tidak pernah bergeser.

   Kalau pesannya ikut dihitung di tinggi, tiap ketikan panel ikut
   naik-turun mengikuti panjang pesannya — "lompat-lompat" yang paling
   menyebalkan justru di layar yang paling sering dipakai mengetik. */

.cari__tumpuk {
  position: relative;
  width: min(34rem, 100%);
}

/* --- Kolom dan tombol hapus ---
   `position: relative` supaya tombolnya bisa di absolutkan tanpa
   keluar dari kotak panel. Tanpa pembungkus ini, satu-satunya cara
   menaruh tombol di dalam input adalah pseudo-element — dan itu
   persis yang tidak bisa dilakukan lintas peramban. */

.cari__kolom {
  position: relative;
}

/* Ruang untuk tombol di kanan. Tanpa ini teks panjang akan melintas
   ke bawah tombol dan terpotong tepat di tempat yang paling menyebalkan
   untuk dibaca: ujung kalimatnya. */
.cari__input {
  padding-right: 3rem;
}

/* Tombol hapus bawaan peramban dimatikan.
   Kalau tidak, di Blink dan WebKit akan ada dua tanda silang
   berdampingan — yang bawaan dan yang di bawah ini. */
.cari__input::-webkit-search-cancel-button,
.cari__input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}

/* `top` dan `bottom`, bukan `height`: tinggi tombol ikut tinggi
   input, jadi tidak ada angka yang harus disesuaikan kalau padding
   `.input` di main.css berubah. Lebarnya 2.75rem — 44px, ambang
   area sentuh yang lazim untuk layar sentuh, dan jauh di atas ukuran
   ikonnya sendiri.

   `right` 0.375rem itu jarak tanda silang ke tepi kanan kotak,
   bukan ke tepi panel. */
.cari__hapus {
  position: absolute;
  top: 1px;
  right: 0.375rem;
  bottom: 1px;
  width: 2.75rem;

  display: flex;
  align-items: center;
  justify-content: center;

  background: none;
  border: 0;
  border-radius: var(--radius-sedang);

  color: var(--teks-sekunder);
  cursor: pointer;
  transition: color var(--transisi), background var(--transisi);
}

/* Ikon sengaja kecil. Yang diketik orang adalah kotak 2.75rem-nya;
   ikon 1.125rem hanya penanda di dalamnya, supaya tombol sebesar
   44px tidak terlihat seperti tombol besar bertuliskan. */
.cari__hapus-ikon {
  font-size: 1.125rem;
}

.cari__hapus:hover {
  color: var(--teks-utama);
  background: var(--latar-naik-2);
}

/* Hanya untuk navigasi keyboard. `outline: none` tanpa pengganti
   akan membuat tombol ini hilang total dari pandangan orang yang
   memakai Tab — jadi cincin fokusnya wajib, bukan opsional.

   Cincinnya sama dengan `.input:focus` di main.css. */
.cari__hapus:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--aksen-glow);
}

/* --- Keadaan ketikan ---
   Dipindah dari halaman bersama bloknya. Aturan ini pindah, bukan
   disalin: halaman sudah tidak lagi menampilkan bagian ini, jadi
   tidak ada duplikat yang harus dijaga sinkron.

   `.cari__pesan` dipakai tiga elemen — kalimat "kuerinya kependekan",
   "Mencari…", dan blok "tidak ada hasil" — supaya lebar dan bentuk
   hurufnya cuma satu tempat. Kalau dipisah, satu lagi akan jadi versi
   berbeda.

   Lebarnya sama persis dengan `.cari__panel` supaya judul pesan,
   catatannya, dan dua chip tautannya lurus dengan kotak panel di
   bawahnya. Tanpa itu, blok yang lebih sempit akan terlihat melayang
   tanpa pemilik di atas kotak.

   Jarak ke panel datang dari `gap` milik `.cari__layar[open]`, bukan
   dari `margin` di sini — dua sumber jarak untuk dua anak yang
   memang berdampingan.

   Bentuk huruf dasarnya mengikuti `.cari__catatan` di halaman, karena
   kalimat "tambahkan satu huruf lagi" sebelumnya tampil persis
   seperti itu. Judulnya memakai bentuk baris jumlah, karena
   kalimatnya (`cari.tak_ada`) sama persis dengan yang di sana. */

.cari__pesan {
  /* Diabsolutekan dari atas kotak panel, bukan mengalir di atasnya.

     `bottom: 100%` berarti dasar pesan tepat di tepi atas panel, dan
     `margin-bottom` menjauhkannya dari border kotak. Lebarnya
     mewarisi `.cari__tumpuk`, jadi selalu sama dengan panel — tidak
     ada lagi lebar yang harus dijaga dua tempat. */
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  margin-bottom: 0.75rem;

  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--teks-sekunder);
}

.cari__pesan-judul {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

.cari__pesan-catatan {
  margin-top: 0.5rem;
}

.cari__pintasan {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.cari__pintasan a {
  display: inline-flex;
  padding: 0.4375rem 0.75rem;

  border: 1px solid var(--garis-sedang);
  border-radius: 999px;

  color: var(--teks-sekunder);
  text-decoration: none;
  transition: color var(--transisi), border-color var(--transisi);
}

.cari__pintasan a:hover {
  border-color: var(--garis-aktif);
  color: var(--teks-aksen);
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