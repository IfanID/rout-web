<script setup lang="ts">
/* Lonceng riwayat aktivitas: ikon, jumlah yang belum dibaca, dan panel
 * ringkasan yang terbuka saat diklik.
 *
 *  Dipakai di dua halaman beranda, dan isinya sama persis — kalau tidak,
 * orang yang membuka beranda situs tidak akan pernah tahu ada episode baru
 * sampai ia kebetulan membuka halaman Running Man.
 *
 *  **Panelnya bukan `<dialog>`.** `SearchOverlay` dan `SlotSelect` memang
 *  memakai `<dialog>` + `showModal()`, tapi keduanya modal: isinya menutupi
 *  layar dan pemakai tidak boleh menyentuh apa pun di baliknya. Panel di sini
 *  sebaliknya — orang masih harus bisa menggulir halaman di belakangnya, dan
 *  menekan Escape seharusnya menutup panel ini, bukan membatalkan navigasi
 *  apa pun. `showModal()` tidak bisa melakukan salah satu dari dua hal itu.
 *
 *  Konsekuensinya tiga hal yang biasanya datang gratis dari `<dialog>`
 *  harus ditulis sendiri: menentukan klik di luar, menangani Escape, dan
 *  mengembalikan fokus ke tombol saat panel ditutup — supaya pemakai
 *  keyboard tidak kehilangan tempatnya setelah menekan Escape.
 *
 *  Panel **tidak** memakai `role="menu"`. Peran itu menuntut navigasi panah
 *  di antara butirnya, dan daftar ini butirnya tautan biasa — dipaksa jadi
 *  menu, panahnya justru jadi satu-satunya jalan untuk sampai ke butir keenam.
 *
 *  Teksnya lewat `t()`, jadi panel ikut bahasa yang sedang dibaca. */

const { t } = useI18n()
const localePath = useLocalePath()

const { daftar, siap, belumDibaca } = useAktivitas()

const terbuka = ref(false)

const tombol = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

/* Berapa baris yang ditampilkan di panel.
 *
 *  Panel adalah ringkasan; daftar lengkapnya punya halamannya sendiri, dan
 *  itu yang dituju tombol di kaki panel. Lima baris cukup untuk themed
 *  tanpa membuat panel taller daripada layar HP pendek. */
const BATAS_PANEL = 5

const terbaru = computed(() => daftar.value.slice(0, BATAS_PANEL))

/** Label tombolnya ikut menyebut jumlah yang belum dibaca.
 *
 *  Badge-nya `aria-hidden`, jadi tanpa ini angka itu tidak pernah sampai ke
 *  pembaca layar — dan "ada lonceng" jauh lebih lemah kabarannya daripada
 *  "ada tiga hal yang belum dibaca". Dua pesan karena dua keadaan: pesan
 *  yang selalu menyebut `{jumlah}` akan menampilkan "0 baru" saat kosong,
 *  dan itu kabar salah. */
const labelTombol = computed(() =>
  belumDibaca.value > 0
    ? t('aktivitas.buka_baru', { jumlah: belumDibaca.value })
    : t('aktivitas.buka')
)

function buka() {
  terbuka.value = true
}

function tutup() {
  if (!terbuka.value) return

  terbuka.value = false

  /* Fokus dikembalikan ke tombol, supaya setelah Escape pemakai keyboard
   * tahu di mana dia berada. Peramban juga melakukannya sendiri untuk
   * elemen yang baru saja kehilangan fokus — tapi hanya kalau closure-nya
   * masih hidup, dan di sini yang diketik manual adalah pemanggilnya. */
  tombol.value?.focus()
}

function alihkan() {
  if (terbuka.value) tutup()
  else buka()
}

/* Klik di luar panel. Di-mount saat panel terbuka saja, dan dilepas saat
 * ditutup — jadi `document` tidak punya pendengar yang sia-sia sepanjang
 * umur halaman.
 *
 * `pointerdown`, bukan `click`: `click` bisa sudah terlanjur diterima
 * elemen lain lebih dulu, jadi menekan tombol di dalam panel bisa membuat
 * panel ikut tertutup sebelum penanganannya sempat jalan. `pointerdown`
 * terjadi mendahului `click`, sehingga tidak ada balapan di antaranya —
 * dan tidak perlu memeriksa apakah tombolnya sudah menerima fokus. */
function saatKlikLuar(e: PointerEvent) {
  const target = e.target as Node | null

  if (!target) return

  if (tombol.value?.contains(target)) return
  if (panel.value?.contains(target)) return

  tutup()
}

/* Escape menutup panel. Yang ditekan di dalam input atau textarea tidak
 * ikut tertutup — di situ Escape berarti " batalkan yang sedang diketik",
 *  dan panel ini tidak ada hubungannya dengan itu. */
function saatTombol(e: KeyboardEvent) {
  if (e.key !== 'Escape') return

  const aktif = e.target as HTMLElement | null
  const tag = aktif?.tagName

  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  tutup()
}

watch(terbuka, nilai => {
  if (typeof document === 'undefined') return

  if (nilai) {
    document.addEventListener('pointerdown', saatKlikLuar)
    document.addEventListener('keydown', saatTombol)

    /* Fokus masuk ke panel, ke tombol di kakinya — bukan ke baris
     * pertamanya. Tombol kaki selalu ada, termasuk saat daftarnya kosong,
     * jadi tidak pernah jadi target fosit yang tidak ada. */
    nextTick(() => panel.value?.querySelector<HTMLElement>('button, a')?.focus())
  } else {
    document.removeEventListener('pointerdown', saatKlikLuar)
    document.removeEventListener('keydown', saatTombol)
  }
})

/* Tab ditutup atau halaman dilepas saat panel terbuka — listener-nya ikut
 * hilang bersama komponennya, jadi tidak ada yang perlu dilepas manual di
 * sini. Yang hilang barulah `terbuka`, dan komponennya juga ikut dibuang. */
onUnmounted(tutup)
</script>

<template>
  <div class="lonceng">
    <button
      ref="tombol"
      type="button"
      class="lonceng__tombol"
      :aria-expanded="terbuka"
      aria-controls="aktivitas-panel"
      :aria-label="labelTombol"
      @click="alihkan"
    >
      <Icon name="lucide:bell" class="lonceng__ikon" />

      <!-- Titik di pojok kanan atas ikon, muncul kalau ada yang belum
           dibaca.

           `aria-hidden` karena jumlahnya sudah ada di `aria-label` tombolnya
           — mengulanginya berarti pembaca layar membacakannya dua kali.

           Bulatan, bukan angka. Dulu isinya pil berisi digit, dan di tombol
           selebar 32px pil itu hampir separuh lebar tombol — terlalu besar
           untuk hal yang isinya cuma "ada". Jumlahnya sendiri sudah ada di
           `labelTombol`, dalam bentuk kalimat yang bisa dibacakan, bukan
           digit yang harus dijumlahkan orang sendiri.

           Karena tidak ada teks, `min-width`, `padding-inline`, dan
           `font-size` di bawah semuanya hilang — tidak ada isinya yang bisa
           membuat lebarnya berubah-ubah. -->
      <span v-if="belumDibaca > 0" class="lonceng__badge" aria-hidden="true" />
    </button>

    <!-- `v-if`, bukan `v-show`, dan bukan `hidden`.
         `hidden` hanya menyembunyikan lewat CSS, sehingga isi yang tak
         terlihat tetap bisa dibaca Tab dan bahkan ditemukan mesin
         pencari — panel tertutup berarti tidak boleh ada di dalam urutan fokus
         sama sekali. -->
    <div
      v-if="terbuka"
      id="aktivitas-panel"
      ref="panel"
      class="lonceng__panel"
    >
      <p class="lonceng__judul">{{ t('aktivitas.ringkas') }}</p>

      <!-- Kosong disembunyikan di server: daftar belum dibaca sampai
           `onMounted`, dan merendarnya lebih awal berarti hasil render
           server dan browser berbeda. -->
      <template v-if="siap">
        <ul v-if="terbaru.length" class="lonceng__daftar">
          <li v-for="satu in terbaru" :key="satu.id" class="lonceng__baris">
            <!-- Titik, bukan ikon. Yang belum terbaca memang berbeda dari
                 yang sudah, dan bentuk titik sudah cukup untuk
                 membedakan keduanya tanpa menambah satu ikon per jenis pesan —
                 dan saat ini memang belum ada jenisnya. -->
            <span
              class="lonceng__titik"
              :class="{ 'lonceng__titik--baru': !satu.dibaca }"
              aria-hidden="true"
            />

            <span class="lonceng__pesan">{{ t(satu.kunci, satu.param) }}</span>
          </li>
        </ul>

        <p v-else class="lonceng__kosong">{{ t('aktivitas.kosong') }}</p>
      </template>

      <NuxtLink :to="localePath('aktivitas')" class="lonceng__kaki" @click="tutup">
        {{ t('aktivitas.lihat') }}
        <Icon name="lucide:arrow-right" class="lonceng__kaki-ikon" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* Satu titik masuk untuk panel dan tombolnya. */
.lonceng {
  /* `position: relative` supaya panel bisa diposisikan terhadap tombolnya,
     bukan terhadap halaman. */
  position: relative;

  /* `display: flex` WAJIB, dan ini yang memperbaiki lonceng yang terlihat
     meleset ke atas.

     Tanpa itu, elemen ini `display: block` dan anaknya `<button>` ber-
     `display: inline-flex` — yaitu inline-level. Block container yang punya
     anak inline-level membentuk LINE BOX, dan line box menyelaraskan
     baseline, bukan memusatkan. Baseline-nya adalah tepi bawah, sebab
     satu-satunya isinya ikon tanpa teks:

       strut teks   line-height 1.6          ascent 18.3px  descent  7.3px
       tombol       24px, baseline di bawah   ascent 24px    descent  0px
       ----------------------------------------------------------------
       line box                                  31.3px

     Tombolnya menempati 24px teratas, dengan 7.3px kosong di bawah —
     dan kotak lonceng ikut jadi 31.3px, LEBIH TINGGI dari logo yang
     25.6px. Header ikut meninggi, dan itulah yang terlihat di layar.

     Sebagai flex container, tidak ada line box sama sekali: tombol jadi
     flex item, tinggi elemen ini tepat tinggi tombol, dan pemusatan
     diserahkan ke `align-items` — bukan ke baseline. */
  display: flex;
  align-items: center;

  /* `flex-shrink: 0` wajib: lonceng ini berbagi baris dengan teks berjala
     yang memang boleh menyusut, dan tanpa ini keduanya ikut menyusut
     bersama-sama — ikon lonceng ikut gepeng. */
  flex-shrink: 0;

  /* `stretch`, bukan `center`.
   
     Dipakai untuk soal yang satu: `top: 100%` di panel di bawah harus
     berarti tinggi SELURUH baris header, bukan hanya tinggi tombol. Dengan
     `center`, `.lonceng` hanya setinggi tombol (24px) dan duduk 0.8px di
     bawah puncak baris — jadi 100%-nya kurang, dan popup-nya tampil kurang
     tinggi dari jarak yang diminta.
   
     Tingginya sendiri tidak berubah: tombol tetap dipusatkan di dalamnya
     oleh `align-items: center` di atas. */
  align-self: stretch;
}

/* --- Tombol ----------------------------------------------------- */

/* Tanpa `display: inline-flex` tombol ini jadi kotak inline yang
   ukurannya ikut teks di dalamnya — dan teksnya cuma ikon, jadi lebarnya
   ikut glyph-nya. */
.lonceng__tombol {
  /* Wajib: badge-nya diposisikan terhadap tombol ini. Tanpa itu dia
     memakai `.lonceng` — kebetulan sama tinggi, tapi itu kebetulan. */
  position: relative;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* TINGGI TIDAK DITETAPKAN. Tombol ini boleh sebesar apa saja yang
     muat, dan tinggi header tidak bergerak sama sekali — itu bukan
     harapan, tapi hasil hitungan:

       ikon   1.125rem            = 18px   (@nuxt/icon width/height: 1em,
                                         jadi tidak ikut line-height)
       padding atas + bawah       =  6px
       ------------------------------------------
       lonceng                    = 24px

     sementara `.header__logo`      25.6px  (1rem x line-height 1.6)

     24 < 25.6, jadi yang menentukan tinggi header tetap logo. Angkanya
     tidak perlu diulang di CSS: begitu `line-height` di body berubah, tinggi
     logo ikut berubah, dan tombol ini ikut karena tinggiannya dari isinya.

     Padding horizontalnya jauh lebih longgar supaya target sentuhnya
     selebar mungkin dalam tinggi yang tersedia: 18px ikon + 2 x 7px =
     32px. Tinggi memang mentok di sini — header hanya setinggi itu, dan
     logo di sebelah kiri sudah punya batas yang sama. */
  padding: 0.1875rem 0.4375rem;

  /* Tanpa latar dan tanpa garis, karena yang di sebelahnya logo teks —
     permukaan di sini akan terasa seperti tombol yang lebih penting dari
     nama produk itu sendiri. */
  background: transparent;
  border: 0;
  border-radius: var(--radius-sedang);

  color: var(--teks-sekunder);
  cursor: pointer;

  /* Wajib di flex yang sama dengan teks berjala. Tanpa ini lonceng ikut
     menyusut bersama `header__kanan`, dan ikonnya ikut gepeng. */
  flex-shrink: 0;

  transition: background var(--transisi), color var(--transisi);
}

.lonceng__tombol:hover {
  background: var(--latar-sorot);
  color: var(--teks-utama);
}

/* Ikon lewat `font-size` pada `<Icon>` — lihat catatan yang sama di
   `.meta__ikon` di main.css. */
/* Ikon lewat `font-size` pada `<Icon>` — lihat catatan yang sama di
   `.meta__ikon` di main.css.

   1.125rem, PERSIS sama dengan `.header__ikon` di Header.vue. Dua ikon
   bersebelahan dengan ukuran berbeda akan terlihat seperti satu salah
   pasang. Tingginya tetap aman: @nuxt/icon memakai `width/height: 1em`,
   jadi ikon ini 18px — jauh di bawah 25.6px tinggi logo. */
.lonceng__ikon {
  font-size: 1.125rem;
}

/* --- Badge ------------------------------------------------------- */

/* Non-null di pojok kanan atas ikon, dan keluar sedikit dari kotak
   supaya tidak terasa seperti bagian dari tombol. */
.lonceng__badge {
  /* Bulatan murni — isinya cuma warna. Tidak ada teks di dalamnya, jadi
     tidak ada `min-width`, tidak ada `padding-inline`, dan tidak ada
     `font-size` yang perlu ikut. Konsekuensinya ukuran tidak pernah
     berubah: pill yang berisi angka melompat lebarnya begitu angka
     berubah dari satu digit ke dua, titik ini tidak. */
  position: absolute;

  /* DI DALAM kotak tombol, bukan menembus keluar seperti offset lama
     (`top: -0.25rem; right: -0.5rem`). Offset itu benar untuk pill yang
     harus terlihat jelas, tapi untuk titik 8px ia berarti keluar 4px di
     atas tombol — sedangkan header cuma punya 3px padding atas, jadi
     titiknya akan keluar dari header ke area halaman di atasnya.

     2px dari atas dan 4px dari kanan: tempel ke sudut kanan atas ikon
     (ikon 18px, dipusatkan oleh padding 3px), dan seluruhnya masih di
     dalam header. */
  top: 0.125rem;
  right: 0.25rem;

  width: 0.5rem;
  height: 0.5rem;

  /* Cyan 400, bukan `--aksen-utama` (500). Cyan murni tidak pernah boleh
     jadi latar teks, tapi di sini tidak ada teks — dan 400 adalah
     `--aksen-indikator`, yang juga dipakai garis aksen di kartu tayang,
     supaya "ada yang perlu dilihat" memakai warna yang sama di seluruh
     halaman. */
  background: var(--aksen-indikator);
  border-radius: 999px;
}

/* --- Panel ------------------------------------------------------- */

/* Lebarnya dibatasi dan tidak mengikuti lebar tombolnya. Panel yang
 * selebar tombol lonceng hanya muat tiga kata — dan daftar aktivitasnya
 * kalimat, bukan label. */
.lonceng__panel {
  /* Jarak panel dari tepi layar — dipakai di KEDUA sisi, atas dan kanan. */
  --jarak-panel: 0.5rem;

  position: absolute;

  /* Jarak ATAS. `100%` adalah tinggi `.lonceng`, yang sekarang sama dengan
     tinggi baris header (lihat `align-self: stretch` di `.lonceng`).

     Tapi itu BELUM tepi bawah header: masih ada padding bawah dan garis
     bawah yang dimiliki header. Jumlahnya dibawa lewat `--bawah-header`,
     supaya popup tetap menempel tepat di bawah garis begitu padding atau
     tebal garisnya berubah — bukan melayang atau tenggelam. */
  top: calc(100% + var(--jarak-panel) + var(--bawah-header, 0px));

  /* Jarak KANAN. Berbeda dengan yang atas: di sini tidak ada yang
     menghalangi antara tepi `.lonceng` dan tepi layar selain padding
     header itu sendiri. Jadi untuk berhenti `jarak-panel` di dalam tepi
     layar, panel harus maju sebesar `sisi-header - jarak-panel` ke kanan —
     dan karena `right` positif menggeser ke kiri, yang ditulis dibalik:

         right = jarak-panel - sisi-header

     Di HP: 0.5rem - 1rem   = -0.5rem -> 8px dari tepi layar.
     Di lebar: 0.5rem - 1.5rem = -1rem   -> 16px di kanan kolom konten,
     masih menempel dekat loncengnya.

     `0rem` sebagai cadangan supaya komponen ini tetap bisa dipakai di luar
     header: tanpa custom property itu, `calc()`-nya jadi tidak valid dan
     `right` kembali ke `auto`. */
  right: calc(var(--jarak-panel) - var(--sisi-header, 0rem));

  /* `width` tetap, bukan `min-width`: isi barisnya bisa panjang sekali,
     dan panel yang ikut melebar keluar dari layar di layar sempit. */
  width: min(20rem, calc(100vw - 2rem));
  max-height: min(24rem, calc(100vh - 8rem));
  overflow-y: auto;

  padding: 0.75rem;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);
}

.lonceng__judul {
  margin-bottom: 0.5rem;

  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

.lonceng__daftar {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lonceng__baris {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  padding-block: 0.5rem;
}

.lonceng__baris + .lonceng__baris {
  border-top: 1px solid var(--garis-halus);
}

/* Titik di kiri baris, sejajar baris pertama teksnya. */
.lonceng__titik {
  flex-shrink: 0;

  width: 0.375rem;
  height: 0.375rem;
  margin-top: 0.4375rem;

  background: var(--garis-sedang);
  border-radius: 999px;
}

.lonceng__titik--baru {
  background: var(--aksen-indikator);
}

.lonceng__pesan {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-utama);
}

.lonceng__kosong {
  padding-block: 0.5rem;

  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}

/* --- Kaki panel -------------------------------------------------- */

.lonceng__kaki {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  margin-top: 0.5rem;
  padding: 0.5rem 0.625rem;

  border-radius: var(--radius-sedang);

  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--teks-aksen);

  text-decoration: none;

  transition: background var(--transisi);
}

.lonceng__kaki:hover {
  background: var(--latar-sorot);
}

.lonceng__kaki-ikon {
  font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
  .lonceng__tombol,
  .lonceng__kaki {
    transition: none;
  }

  .lonceng__tombol:active {
    transform: none;
  }
}
</style>