<script setup lang="ts">
/* Daftar episode Running Man, diambil dari abyss.to.
 *
 *   /running-man                       beranda — kapan tayang
 *   /running-man/episode               halaman ini
 *   /running-man/episode/streaming     menonton
 *
 * Folder `episode/` di atasnya TIDAK berkurung, jadi ia masuk ke URL.
 * Karena itu halaman ini beralamat `/running-man/episode`, bukan
 * `/running-man`.
 *
 * Berkasnya `index.vue`, bukan `episode.vue`. Nama route halaman ini
 * `running-man-episode` — `index` di ujung nama route dibuang, jadi
 * hanya nama folder yang ikut. Kalau berkasnya diganti `episode.vue`,
 * URL-nya tetap `/running-man/episode` tapi nama route-nya menjadi
 * `running-man-episode-episode`, dan route halaman menonton di bawahnya
 * ikut berubah — jadi semua pemanggilan `localePath` yang menyebutnya
 * harus ditulis ulang.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Episode". Nama itu
 * bukan brand Rout dan bukan kata yang perlu diterjemahkan — di tiga
 * locale tetap "Episode", seperti "Stats" atau "Live". */

import type { Episode } from '#shared/types/episode'

const episode = await useDaftarEpisode()

const localePath = useLocalePath()

const { locale } = useI18n()

/* Pembuat format dibuat sekali per bahasa, bukan sekali per baris.
   `Intl.NumberFormat` turun ke data lokalitas setiap kali dibuat, dan
   daftar ini bisa 69 baris. Polanya sama dengan `formatTanggal` di
   PreviewList.vue. */
const formatUkuran = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
)

/** Nomor episode untuk tautan pemutar.
 *
 *  Dipakai sebagai objek `query`, bukan argumen kedua `localePath` —
 *  argumen kedua itu bahasa, bukan params. Satu episode punya halamannya
 *  sendiri lewat `?ep=`, dan param-nya wajib lewat `params`. */
function keTonton(satu: Episode) {
  return localePath({
    name: 'running-man-episode-streaming',
    query: { ep: satu.nomor }
  })
}

/** Ukuran berkas, dari byte jadi "0,87 GB" — "0.87 GB" di `/en`.
 *
 * Dibentuk di komponen, bukan di server: bentuk yang dilihat orang
 * bergantung pada bahasa yang sedang dibaca, dan kalau dipatok di
 * server, satu bahasa akan ikut terbaca di bahasa lain.
 *
 * Pembatasnya 1 GB, bukan 1 MB — video episodenya 0,8 sampai 1,7 GB.
 * Dengan 1 MB angkanya jadi "1.717,96 MB" dan tidak ada yang membacanya
 * lebih cepat. */
function keUkuran(byte: number): string {
  return `${formatUkuran.value.format(byte / 1e9)} GB`
}

/* Semua baris berlabel subtitle Indonesia atau tidak.
 *
 * Banner "bersubtitle Indonesia" di bawah hanya tampil kalau ini benar.
 * Hari ini 69 dari 69 baris berlabel "Sub Indo", tapi unggahan berikutnya
 * bisa saja tanpa keterangan itu — dan banner yang tetap tampil saat itu
 * berarti berbohong. Dihitung dari data, bukan ditulis mati. */
const semuaSubIndo = computed(
  () => episode.value.length > 0 && episode.value.every(satu => /indo/i.test(satu.label))
)

/* ===== Label pribadi ======================================
 *
 * Ditulis dari halaman ini, bukan dari abyss: episode dan videonya dari
 * sana, labelnya dari `data/running-man-label.json` yang disimpul server ke
 * setiap episode. Jadi yang di halaman ini cuma gerakannya — geser baris,
 * pilih label — dan sisanya menyimpan lewat endpoint.
 *
 * Kenapa gestur dan bukan tombol yang selalu terlihat: daftarnya tujuh puluh
 * baris, dan tombol di setiap baris membuat halaman ini jadi tabel alat,
 * bukan daftar nontonan. Tombolnya ada, tapi disembunyikan sampai baris itu
 * memang sedang dipilih — lewat geser di layar sentuh, lewat kursor atau
 * Tab di layar biasa. */

const { notify } = useNotifications()

/* Lebar panel aksi, dalam piksel. Harus sama dengan lebar `.episode__aksi`
 * di CSS di bawah — nilainya satu di dua tempat, bukan satu di dua bahasa. */
const LEBAR_AKSI = 52

/* Label pribadi episode. Disimpan di peramban, bukan di server — jadi tidak
 * ada kunci, tidak ada permintaan, dan tidak ada yang bisa ditimpa orang
 * lain. `labelSiap` dipakai di template supaya pilnya baru dirender setelah
 * isinya terbaca: label ini tidak ada di HTML yang dikirim server, dan
 * merendarnya lebih awal berarti hasil render server dan browser berbeda. */
const {
  labelUntuk,
  daftar: daftarLabel,
  siap: labelSiap,
  pakai,
  tambah,
  hapus
} = useLabelEpisode()

/* Nomor episode yang panel aksinya sedang terbuka. */
const terbuka = ref<number | null>(null)

/* Keadaan jari yang sedang bergerak, disimpan dalam satu objek supaya semua
 * penanganannya membaca angka yang sama. */
const geser = reactive({
  /* Episode yang disentuh. 0 berarti tidak ada gerakan yang sedang jalan. */
  nomor: 0,
  /* Titik awal jari, supaya yang dihitung selalu jarak dari awal, bukan dari
   * posisi terakhir — itu yang membuat gerakan tetap benar kalau satu
   * `touchmove` terlewat. */
  awalX: 0,
  awalY: 0,
  /* Ke mana gerakan sudah dikunci: belum, mendatar, atau vertikal. */
  arah: '' as '' | 'x' | 'y',
  /* Jarak geser sekarang, piksel; negatif ke kiri. */
  x: 0,
  /* Posisi awal baris ini: 0 kalau tertutup, -LEBAR_AKSI kalau terbuka.
   * Tanpa ini, jari harus menggeser baris yang sudah terbuka dari nol lagi
   * setiap kali membukanya untuk kedua kali. */
  dasar: 0
})

/* Berapa piksel sebelum gerakan dianggap mendatar.
 *
 * Dipakai sekali di awal, bukan tiap gerakan: kalau terlalu kecil, getaran
 * atau getar kecil saat menekan layar ikut menggeser baris. */
const AMBANG_AWAL = 8

function geserMulai(peristiwa: TouchEvent, nomor: number) {
  /* Dua jari = mencubit atau memperbesar, bukan menggeser baris. */
  if (peristiwa.touches.length !== 1) return

  const titik = peristiwa.touches[0]

  geser.nomor = nomor
  geser.awalX = titik.clientX
  geser.awalY = titik.clientY
  geser.arah = ''
  geser.dasar = terbuka.value === nomor ? -LEBAR_AKSI : 0
  geser.x = geser.dasar
}

function geserGerak(peristiwa: TouchEvent) {
  if (!geser.nomor || peristiwa.touches.length !== 1) return

  const titik = peristiwa.touches[0]
  const dx = titik.clientX - geser.awalX
  const dy = titik.clientY - geser.awalY

  /* Arah baru dikunci hanya sekali, setelah gerakan cukup jelas. Tidak
   * dikunci berarti daftar yang panjangnya tujuh puluh baris tidak bisa
   * digulir: setiap gerakan sedikit ke bawah akan dianggap awal geser
   * mendatar. Gerakan vertikal diteruskan ke halaman — itulah
   * gunanya `touch-action: pan-y` di barisnya. */
  if (!geser.arah) {
    if (Math.abs(dx) < AMBANG_AWAL && Math.abs(dy) < AMBANG_AWAL) return

    geser.arah = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'

    /* Geser mendatar pada baris lain menutup baris yang sedang terbuka.
     * Dua baris terbuka sekaligus tidak mungkin dibaca: yang kedua menutup
     * yang pertama. */
    if (geser.arah === 'x' && terbuka.value !== geser.nomor) terbuka.value = null
  }

  if (geser.arah !== 'x') return

  /* Dijepit antara tertutup dan terbuka penuh. Ke kanan tidak pernah lewat
   * nol, karena tidak ada panel di sebelah kiri — menggeser ke kanan baris
   * yang tertutup hanya akan memperlihatkan latar kosong. */
  geser.x = geser.dasar < 0
    ? Math.max(-LEBAR_AKSI, Math.min(0, geser.dasar + dx))
    : Math.min(0, dx)
}

function geserSelesai(peristiwa: TouchEvent) {
  if (!geser.nomor) return

  const titik = peristiwa.changedTouches[0]
  const dx = titik ? titik.clientX - geser.awalX : 0

  /* Geseran vertikal, atau gerakan yang tidak punya arah: tidak ada yang
   * terjadi pada panelnya. Baris yang tadinya terbuka tetap terbuka. */
  if (geser.arah === 'x') {
    if (dx < 0 && geser.dasar + dx <= -LEBAR_AKSI / 2) {
      terbuka.value = geser.nomor
    } else if (terbuka.value === geser.nomor) {
      terbuka.value = null
    }
  }

  geser.nomor = 0
  geser.x = 0
  geser.arah = ''
}

/* Baris yang terbuka ditutup begitu halaman digulir. Tanpa itu, baris yang
 * sudah lewat layar tetap terlihat bergeser — dan yang sekarang terlihat
 * cuma bagian dalam daftar yang tidak bisa dibaca lagi. */
function geserTutup() {
  if (terbuka.value !== null) terbuka.value = null
}

onMounted(() => {
  window.addEventListener('scroll', geserTutup, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', geserTutup)
})

/* Geseran satu baris, kalau baris itu yang sedang disentuh. Baris lain
 * tidak diberi gaya inline sama sekali — supaya tidak ada tujuh puluh
 * gaya yang menumpuk di DOM. */
function gayaGeser(nomor: number) {
  if (geser.nomor !== nomor) return undefined

  return { '--geser': `${geser.x}px` }
}

/* Episode yang pilihannya sedang dibuka, kalau ada. */
const dipilih = ref<number | null>(null)

/* Teks label yang sedang diketik, untuk label yang belum pernah dipakai. */
const labelBaru = ref('')

/* Apakah kolom "label baru" sedang terbuka. Ditutup lagi setiap kali sheet
 * dibuka, jadi sheet berikutnya tidak meninggalkan kolom kosong yang tidak ada
 * hubungannya dengan tugasnya. */
const bukaBaru = ref(false)

/* Episode yang sedang dibuka pemilihnya, untuk judul dan label sekarang. */
const episodeDipilih = computed(
  () => episode.value.find(satu => satu.nomor === dipilih.value) ?? null
)

const labelSekarang = computed(() =>
  episodeDipilih.value ? labelUntuk(episodeDipilih.value.nomor) : ''
)

/* Kotak pemilih difokuskan saat dibuka: Escape langsung menutupnya, dan
 * pembaca layar langsung tahu ada sesuatu yang terbuka. */
const kotakPemilih = ref<HTMLElement | null>(null)

function bukaPemilih(nomor: number) {
  dipilih.value = nomor
  labelBaru.value = ''
  bukaBaru.value = false
  terbuka.value = null

  nextTick(() => kotakPemilih.value?.focus())
}

function tutupPemilih() {
  dipilih.value = null
  labelBaru.value = ''
  bukaBaru.value = false
}

/* Pakai label untuk satu episode.
 *
 * Tanpa permintaan dan tanpa menunggu: labelnya milik peramban ini, jadi
 * pilnya sudah berubah pada saat fungsi ini selesai. Tidak ada notifikasi
 * sukses juga — pil di baris itu berubah dan itu sudah jadi jawabannya. */
function simpan(nomor: number, label: string) {
  pakai(nomor, label)
  tutupPemilih()
}

function pakaiLabelBaru() {
  const teks = labelBaru.value.trim()

  if (!teks || dipilih.value === null) return

  tambah(teks)
  simpan(dipilih.value, teks)
}

function hapusLabelEpisode() {
  if (episodeDipilih.value === null) return

  hapus(episodeDipilih.value.nomor)
  tutupPemilih()
}
</script>

<template>
  <main class="konten episode">
    <NuxtLink :to="localePath('running-man')" class="kembali">
      <Icon name="lucide:arrow-left" class="kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">Episode</h1>

    <p class="konten__sub">
      Daftar episode yang tersedia untuk ditonton.
    </p>

    <!-- Berapa episode yang benar-benar ada di abyss.

         Angka ini BUKAN jumlah episode acara. Berapa episode acaranya
         sudah tayang bisa dibaca di beranda — dan ikut berubah sendiri
         setiap minggu — sedangkan yang di sini hanya episode yang
         filenya benar-benar ada di abyss. Menyamakan keduanya membuat
         orang mengira ada ratusan baris yang gagal dimuat.

         Pill dari `.hitung` di main.css, dengan angkanya ditonjolkan:
         yang dicari orang di baris ini jumlahnya, bukan kalimatnya. -->
    <p v-if="episode.length" class="hitung episode__rekap">
      <Icon name="lucide:list-video" class="hitung__ikon" aria-hidden="true" />
      <span class="hitung__angka">{{ episode.length }}</span>
      episode tersedia
    </p>

    <!-- Penanda subtitle, sekali untuk seluruh halaman.
         Setiap baris memang sudah membawa labelnya sendiri ("Sub Indo"),
         tapi 69 tulisan yang sama di 69 baris tidak dibaca orang sebagai
         informasi — ia tenggelam jadi pola yang berulang. Satu banner di
         sini yang dibaca, bukan enam puluh sembilan.
         Hanya tampil kalau seluruh daftar memang berlabel subtitle,
         lihat `semuaSubIndo` di script. -->
    <p v-if="semuaSubIndo" class="episode__info">
      <Icon name="lucide:languages" class="episode__info-ikon" aria-hidden="true" />
      Semua episode di sini sudah bersubtitle Indonesia.
    </p>

    <!-- `episode` dan bukan `tampil`: daftar ini tidak dipotong. Tujuh
        puluhan baris muat tanpa paginasi, dan pemuatan berikutnya hanya
         menambah satu bentuk yang harus dirancang — tombol, atau
         pengintai gulir. Yang datanya satu sumber, atau lebih baik
         kosong dulu daripada separuh jadi. -->
    <ul v-if="episode.length" class="episode__daftar">
      <!-- Baris daftar episode.
           Peristiwa sentuhnya dipasang di `<li>`, bukan di tautannya: panel
           aksinya ini berada DI LUAR tautan, jadi tombolnya tidak bisa
           menjadi anak `<a>` — anak `<a>` yang punya `<button>` di dalamnya
           bukan tautan, tapi kontrol yang salah. -->
      <li
        v-for="satu in episode"
        :key="satu.nomor"
        class="episode__sel"
        :class="{ 'episode__sel--buka': terbuka === satu.nomor }"
        @touchstart.passive="geserMulai($event, satu.nomor)"
        @touchmove.passive="geserGerak"
        @touchend.passive="geserSelesai($event)"
        @touchcancel.passive="geserSelesai($event)"
      >
        <!-- Panel aksi. Di layar sentuh baru terlihat setelah baris digeser
             ke kiri; di layar biasa muncul saat kursor di atas baris atau saat
             tombolnya difokuskan lewat Tab. Bukan anak tautannya, jadi
             mengetuknya tidak membuka halaman pemutar. -->
        <button
          type="button"
          class="episode__aksi"
          @click.stop="bukaPemilih(satu.nomor)"
        >
          <Icon name="lucide:tag" class="episode__aksi-ikon" />
          <span>Label</span>
        </button>

        <NuxtLink
          :to="keTonton(satu)"
          class="episode__butir"
          :style="gayaGeser(satu.nomor)"
          :aria-label="`Episode ${satu.nomor}, ${satu.acara}`"
        >
          <!-- Kotak thumbnail, berisi nomor episode.
               Gambar sungguhan TIDAK ada dan tidak bisa ada: abyss tidak
               memberi endpoint thumbnail. Semua pola sudah dicoba —
               `GET /v1/thumbnail/<id>`, `thumbnails`, `.sprite.jpg` JW
               Player, `/thumb`, `/img`, `/poster`, `/cover` — semuanya
               404. (Yang balas 401 bukan petunjuk: SETIAP path `/v1/*`
               yang tidak dikenal begitu, termasuk path karangan.)

               Jadi nomornya yang mengisi kotak. Ini bukan hiasan supaya
               kotak kelihatan berisi — nomor itu memang satu-satunya
               hal per-baris yang tidak ada di teks, dan meletakkannya di
               sini membuatnya terbaca saat memindai ke bawah, karena
               kotak ada di kolom yang sama di seluruh baris.

               `aria-hidden`, karena nomornya sudah ada di dalam `title`
               tautan. -->
          <span class="episode__thumb" aria-hidden="true">
            <span class="episode__nomor">{{ String(satu.nomor).padStart(3, '0') }}</span>

            <!-- Tombol putar, muncul saat kursor mendekat. Tanda arah di
                 kanan baris dulu yang mengerjakan tugas ini, tapi di
                 layar sentuh tanda itu tidak terbaca sebagai perintah —
                 sedangkan tombol putar di atas kotak nomornya sudah
                 dikenal orang dari daftar video mana pun.

                 `@media (hover: hover)` yang menahannya supaya di layar
                 sentuh ia tidak macet menyala setelah barisnya
                 diketuk. -->
            <span class="episode__main">
              <Icon name="lucide:play" />
            </span>
          </span>

          <!-- Kolom teks. Dua baris tetap: nama acara dan keterangan
               subtitle. Ukuran dan kualitas pindah ke kolom kanan
               supaya baris ini tidak berlubang di tengahnya.

               Label pribadi menambah satu baris ke episodicya saja, bukan
               ke semua baris: ruang kosong yang dipaksakan ke tujuh puluh
               baris lain supaya baris tanpa label terlihat sama perlunya
               jauh lebih mahal daripada satu baris yang lebih tinggi. -->
          <span class="episode__isi">
            <!-- Di atas judul, bukan di bawah: yang paling spesifik dibaca
                 paling dulu. Label milik episode ini, sementara keterangan
                 subtitle di bawahnya berlaku untuk seluruh halaman.
                 Penjelasan kenapa pilnya tidak dirender lebih awal ada di
                 `labelSiap` di script. -->
            <span v-if="labelSiap && labelUntuk(satu.nomor)" class="badge episode__label">
              {{ labelUntuk(satu.nomor) }}
            </span>

            <span class="episode__acara">{{ satu.acara }}</span>

            <!-- `label` boleh kosong — subtitle Running Man tertanam di
                 dalam video, bukan di abyss sebagai berkas terpisah, jadi
                 "Sub Indo" di sini satu-satunya tempat informasi itu
                 tercatat. Unggahan berikutnya yang tanpa subtitle akan
                 punya sel kosong, bukan lencana yang berbohong. -->
            <span v-if="satu.label" class="episode__keterangan">{{ satu.label }}</span>
          </span>

          <!-- Kolom kanan: ukuran, lalu kualitas.
               Kualitas apa adanya dari abyss. Tidak disaring ke daftar
               tetap: episode 13 punya `mHD` yang tidak disebut di
               dokumentasi abyss, dan menyaringnya diam-diam membuang satu
               kualitas yang bisa diputar. -->
          <span class="episode__samping">
            <span class="episode__ukuran">{{ keUkuran(satu.ukuran) }}</span>

            <span class="episode__mutu">
              <span
                v-for="r in satu.resolusi"
                :key="r"
                class="badge mutu"
              >
                {{ r }}
              </span>
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>

    <!-- Daftar kosong punya dua sebab yang berbeda dan tidak bisa
         dibedakan dari sini: abyss tidak bisa dihubungi, atau kunci API
         belum diisi di `.env`. Keduanya ditulis apa adanya sebagai satu
         kalimat, karena yang perlu diketahui orang adalah "belum ada
         yang bisa ditonton", bukan akarnya — akarnya ada di log server. -->
    <p v-else class="episode__kosong">
      Belum ada episode yang bisa dimuat. Coba lagi nanti.
    </p>

    <!-- ===== Pemilih label =====================================

         Sheet dari bawah, karena di layar sentuh yang menempel di
         bawah lebih mudah dijangkau ibu jari daripada kotak di tengah.

         Kotaknya yang difokuskan saat dibuka, jadi Escape langsung menutup
         dan pembaca layar langsung tahu ada yang terbuka. -->
    <div
      v-if="episodeDipilih"
      class="sisip"
      role="dialog"
      aria-modal="true"
      :aria-label="`Label episode ${episodeDipilih.nomor}`"
      @click.self="tutupPemilih"
    >
      <div
        ref="kotakPemilih"
        class="sisip__kotak"
        tabindex="-1"
        @keydown.esc="tutupPemilih"
      >
        <div class="sisip__kepala">
          <p class="sisip__judul">
            Episode {{ String(episodeDipilih.nomor).padStart(3, '0') }}
          </p>

          <button
            type="button"
            class="sisip__tutup"
            aria-label="Tutup"
            @click="tutupPemilih"
          >
            <Icon name="lucide:x" />
          </button>
        </div>

        <!-- Dua kolom, lebar sama semua.

             Bukan daftar satu per baris: sepuluh label jadi sepuluh baris
             vertikal yang harus digulir, dan sheet yang lebih tinggi dari
             layar tidak bisa ditutup dengan mengetuk bagian luarnya.

             Bukan juga pil yang panjangnya mengikuti teksnya: ujungnya
             bergerigi — dua label sebaris lalu baris berikutnya satu saja.

             Grid dua kolom dengan lebar tetap menyelesaikan keduanya. Rata
             rapinya datang dari kolomnya, bukan dari isinya; teks boleh
             membungkus ke dua baris karena tinggi kotaknya dikunci
             `min-height`.

             Yang dipakai ditandai centang DAN `aria-current` — bukan
             `aria-pressed`, karena ini bukan sakelar yang menyala dan mati,
             melainkan satu nilai yang sedang terpasang. -->
        <ul v-if="daftarLabel.length" class="sisip__daftar">
          <li v-for="satu in daftarLabel" :key="satu">
            <button
              type="button"
              class="sisip__label"
              :class="{ 'sisip__label--dipakai': satu === labelSekarang }"
              :aria-current="satu === labelSekarang ? 'true' : undefined"
              @click="simpan(episodeDipilih.nomor, satu)"
            >
              {{ satu }}

              <Icon
                v-if="satu === labelSekarang"
                name="lucide:check"
                class="sisip__label-benar"
              />
            </button>
          </li>
        </ul>

        <!-- Label yang belum pernah dipakai.
             Kolom ketiknya hanya muncul setelah tombolnya diketuk: dari
             sepuluh label yang sudah ada, mengetik yang baru adalah hal
             yang jarang, dan satu kolom kosong yang selalu terlihat membuat
             sheet ini terasa seperti formulir. Yang diketik langsung dipakai
             untuk episode ini sekaligus masuk daftar, jadi bisa dipakai
             lagi di episode lain tanpa diketik ulang. -->
        <form v-if="bukaBaru" class="sisip__baru" @submit.prevent="pakaiLabelBaru">
          <input
            id="label-baru"
            v-model="labelBaru"
            class="input sisip__masukan"
            type="text"
            maxlength="40"
            placeholder="Tulis label baru"
            autocomplete="off"
            autofocus
          />

          <button
            type="submit"
            class="tombol tombol--sekunder sisip__tambah"
            :disabled="!labelBaru.trim()"
          >
            Pakai
          </button>

          <button
            type="button"
            class="sisip__batal"
            aria-label="Batal"
            @click="bukaBaru = false"
          >
            <Icon name="lucide:x" />
          </button>
        </form>

        <button
          v-else
          type="button"
          class="sisip__tambah-label"
          @click="bukaBaru = true"
        >
          <Icon name="lucide:plus" />
          Tambah label baru
        </button>

        <button
          v-if="labelSekarang"
          type="button"
          class="sisip__hapus"
          @click="hapusLabelEpisode"
        >
          <Icon name="lucide:eraser" />
          Hapus label episode ini
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
 * tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
 * konten terakhir tertutup navbar. */
.episode {
  padding-bottom: 10rem;
}

/* --- Rekap --------------------------------------------------- */

/* Pill `.hitung` duduk di bawah subjudul. Jaraknya lebih rapat dari
 * jarak bagian biasa — ia keterangan dari halaman ini, bukan bagian
 * tersendiri. */
.episode__rekap {
  margin-top: 1.5rem;
}

/* --- Info subtitle -------------------------------------------- */

/* Banner satu baris: semua episode di halaman ini bersubtitle Indonesia.
 *
 * Latar dan warnanya dari token status `--info`, bukan warna aksen.
 * "Bersubtitle" itu keadaan daftarnya, bukan hiasan — dan warna status
 * sudah ada persis untuk menandai keadaan seperti ini, sama seperti
 * badge `--sukses` untuk status tayang di halaman detail.
 *
 * Bukan `.kartu`: yang di sini satu kalimat, dan permukaan kartu
 * selebar halaman untuk satu kalimat terbaca sebagai panel kosong.
 * Bukan `.badge` juga: badge menandai satu nilai di dalam baris, dan
 * ini keterangan untuk seluruh halaman. */
.episode__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-sedang);

  background: var(--info-latar);

  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--info);
}

.episode__info-ikon {
  flex-shrink: 0;
  font-size: 1rem;
}

/* --- Daftar episode ------------------------------------------ */

/* Baris daftar, bukan tautannya, yang jadi tempat panel aksi dan yang
 * digeser.
 *
 * `overflow: hidden` supaya panel aksi terpotong mengikuti sudut membulat
 * kartu, bukan membentuk persegi di belakangnya. `position: relative`
 * supaya panel itu bisa absolutely positioned di kanan baris.
 *
 * `touch-action: pan-y` di sini, bukan di tautannya, karena satu
 * elemen harus menjawab dua hal sekaligus: peramban boleh menggulir
 * halaman secara vertikal, sementara gestur mendatar diserahkan ke kode
 * di bawah. Tanpa itu, daftar yang panjangnya tujuh puluh baris tidak bisa
 * digulir — setiap gerakan sedikit ke bawah dianggap permulaan geser. */
.episode__sel {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-besar);
  touch-action: pan-y;
}

/* Panel aksi: letakkan di belakang kartu supaya yang terlihat hanya bagian
 * yang tidak tertutup kartu setelah baris digeser.
 *
 * Sengaja TIDAK diberi `z-index`. Di keadaan terbuka (baris sudah digeser)
 * ia memang harus di belakang — itulah yang membuatnya terlihat sebagai
 * panel yang tersingkap, bukan tombol yang menimpa kartu. Yang perlu di
 * atas kartu hanya keadaan kursor dan fokus, dan itu diberi `z-index`
 * tersendiri di bawah. */
.episode__aksi {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;

  /* Harus sama dengan LEBAR_AKSI di script. */
  width: 3.25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;

  border-radius: var(--radius-besar);
  background: var(--aksen-latar);
  color: var(--teks-aksen);

  font-size: 0.625rem;
  font-weight: 500;
  line-height: 1;

  /* Sembunyi, tapi TIDAK `visibility: hidden` dan TIDAK `display: none`:
   * keduanya membuat tombolnya hilang dari urutan Tab, dan satu-satunya
   * cara menjangkau tombol ini di keyboard adalah lewat Tab. `pointer-events: none`
   * yang menahan kliknya lewat, bukan menyembunyikannya. */
  opacity: 0;
  pointer-events: none;

  transition: opacity var(--transisi);
}

.episode__aksi-ikon {
  font-size: 1rem;
}

.episode__sel--buka .episode__aksi,
.episode__aksi:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

/* Kursor dan fokus di atas kartu, bukan di belakangnya. Berbeda dengan
 * keadaan terbuka: tidak ada yang bergeser di sini, jadi kalau panelnya di
 * belakang kartu ia tidak akan terlihat sama sekali.
 *
 * Hanya di perangkat berkursor — di layar sentuh tidak ada hover, dan
 * `:hover` yang tidak dibatasi akan membuat panelnya menyala terus
 * sesudah barisnya diketuk. */
@media (hover: hover) {
  .episode__sel:hover .episode__aksi {
    z-index: 2;
    opacity: 1;
    pointer-events: auto;
  }
}

.episode__aksi:focus-visible {
  z-index: 2;
  outline: 2px solid var(--garis-aktif);
  outline-offset: -2px;
}

/* Di layar lebar daftar jadi DUA KOLOM.
 *
 * Tanpa ini, baris satu episode melebar sampai 1104px (`--lebar-konten`
 * 72rem dikurangi padding halaman) berisi thumbnail 76px — judul dan
 * badge kualitas terpisah hampir satu meter, dan mata harus berjalan
 * sepanjang itu setiap baris. 69 baris jadi 35, dan tiap baris punya
 * lebar yang masuk akal.
 *
 * `48rem` bukan angka yang dipilih di sini: itu breakpoint yang sudah
 * dipakai `BottomNav.vue` dan `search.vue`.
 *
 * Jarak antar kolom lebih kecil daripada jarak antar baris, supaya yang
 * terbaca sebagai satu daftar dan bukan dua daftar yang berdampingan. */

/* Jarak antar baris 0.5rem, bukan 0.75rem seperti jarak bagian di
 * halaman lain. Daftar ini dibaca cepat dan beruntun, bukan satu per
 * satu seperti bagian Pengaturan — jarak yang terlalu renggang membuat
 * daftar terasa terpisah, padahal isinya satu daftar. */
.episode__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

@media (min-width: 48rem) {
  .episode__daftar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem 0.75rem;
  }
}

/* Tiga kolom di laptop.
 *
 * Di antara 48rem dan 64rem ruangnya sudah cukup untuk tiga, tapi masih
 * dua — dan dua kolom yang masing-masing 480px hanya berisi thumbnail
 * 76px plus tiga kata, jadi sisanya ruang kosong.
 *
 * Batasnya tiga, bukan empat. Pada lebar konten maksimum (72rem = 1152px)
 * empat kolom memberi 264px — persis kebutuhan minimum satu baris, tanpa
 * sisa untuk napas. Kalau nanti kolom terasa sempit, angka
 * `--lebar-konten` yang harus dinaikkan lebih dulu, bukan jumlah
 * kolomnya. */
@media (min-width: 64rem) {
  .episode__daftar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Satu episode.
 *
 * TIGA kolom: thumbnail, isi, kanan. Ketiganya mengalir.
 *
 * `--geser` nol sampai negatif sejauh lebar panel aksi. Var, bukan
 * `transform` yang ditulis langsung dari script, supaya transisinya tetap
 * bekerja: nilai yang ditulis lewat `style` ikut bertransisi seperti yang
 * lain, sementara keadaan terbuka cukup dideklarasikan sekali di CSS.
 *
 * `z-index: 1` supaya kartu menutupi panel aksi yang ada di belakangnya.
 * Transisi transform-nya ikut dimatikan oleh `prefers-reduced-motion` di
 * bawah, sama seperti transisi lain di halaman ini.
 *
 * Hitungan kolomnya harus tepat dengan jumlah anak yang mengalir. Kalau
 * kolomnya kurang, anak terakhir turun ke baris kedua tanpa error apa
 * pun — itulah yang terjadi pada chevron sebelum dihapus, dan gejalanya
 * hanya ikon yang melayang di bawah thumbnail.
 *
 * Permukaannya ditulis sendiri, bukan memakai `.kartu`, karena
 * `.kartu` menyertakan `:hover` yang menebalkan garis tanpa memberi
 * tahu arahnya. Di sini hover-nya sudah punya arti sendiri: baris ini
 * memang menuju halaman pemutar, dan warnanya dinaikkan supaya tidak
 * menabrakkan hover kartu yang tidak punya tujuan.
 *
 * `color: inherit` menimpa aturan `a` global yang memberi warna
 * aksen ke semua tautan; warna teks di dalam baris sudah ditentukan
 * oleh kelasnya masing-masing. */
.episode__butir {
  position: relative;

  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.875rem;
  align-items: center;

  padding: 0.875rem 1rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  color: inherit;
  text-decoration: none;

  --geser: 0px;
  transform: translateX(var(--geser));
  z-index: 1;

  transition:
    border-color var(--transisi),
    background var(--transisi),
    transform var(--transisi);
}

/* Baris yang sedang dibuka. Nilainya setinggi panel aksi, jadi tepat
 * menutupi panel itu dan tidak ada sisa tombol yang menyembul. */
.episode__sel--buka .episode__butir {
  --geser: -3.25rem;
}

/* Garis aksen setebal 2px di tepi kiri saat barisnya disorot.
 *
 * Permukaannya sudah berubah warna saat hover, tapi di daftar sepanjang
 * 69 baris yang dibaca dengan mata menyapu, perubahan latar saja tidak
 * cukup untuk menunjukkan baris mana yang sedang di bawah kursor.
 *
 * Ditaruh di dalam `border` (padding box), jadi garis kartunya tidak
 * ikut hilang — dan tingginya tidak penuh, supaya tidak terbaca sebagai
 * tepi kartu yang berubah warna. */
.episode__butir::before {
  content: "";

  position: absolute;
  left: 0;
  top: 0.625rem;
  bottom: 0.625rem;

  width: 2px;
  border-radius: 999px;

  background: var(--aksen-indikator);

  opacity: 0;
  transition: opacity var(--transisi);
}

.episode__butir:hover {
  border-color: var(--garis-sedang);
  background: var(--latar-naik-3);
}

.episode__butir:hover::before {
  opacity: 1;
}

/* Fokus keyboard memakai penanda yang sama dengan hover: orang yang
 * berpindah dengan Tab tidak akan pernah melihat hover. */
.episode__butir:focus-visible::before {
  opacity: 1;
}

/* Thumbnail.
 *
 * Rasio 16:9 supaya bentuknya sama dengan blok video di
 * halaman streaming. Kalau keduanya berbeda rasio, daftar di sini
 * terlihat seperti jenis konten yang berbeda dari yang diputar —
 * padahal itu yang sama.
 *
 * Lebarnya tetap, bukan ikut teks. Kalau ikut, baris dengan
 * keterangan panjang akan punya kotak lebih besar dari baris di
 * atasnya, dan daftar jadi tidak rata.
 *
 * Isinya NOMOR EPISODE, bukan gambar. Lihat catatan di template: abyss
 * tidak punya endpoint thumbnail sama sekali, jadi kotak yang tadinya
 * kosong diisi nomor — satu-satunya hal per-baris yang tidak ada di teks.
 *
 * Kotak ini juga yang jadi wadah tombol putar yang ditumpuk di atas
 * nomornya, jadi `overflow: hidden` di sini yang memotongnya supaya
 * tidak menonjol keluar sudut membulat. */
.episode__thumb {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 5rem;
  aspect-ratio: 16 / 9;

  overflow: hidden;

  border-radius: var(--radius-sedang);

  /* Gradasi tipis, bukan latar datar. Kotak ini selalu berisi angka
   * tiga digit dan tidak pernah berisi gambar — latar datar membuatnya
   * terbaca sebagai gambar yang gagal dimuat, sedangkan gradasi
   * membuatnya jelas sebagai kotak yang memang kosong. */
  background: linear-gradient(135deg, var(--latar-naik-1), var(--latar-naik-3));
  border: 1px solid var(--garis-halus);

  color: var(--teks-aksen);
}

/* Angka nomornya, dan satu-satunya isi kotak itu.
 *
 * Dipisah dari kotaknya karena tombol putar ditumpuk di atas seluruh
 * kotak: begitu ada dua hal yang menempati ruang yang sama, yang satu
 * harus bisa meredup tanpa ikut memadamkan yang lain.
 *
 * `tabular-nums` dan `line-height: 1` wajib, dan itu bukan pilihan
 * gaya. Kotak ini ada di kolom yang sama pada 69 baris, dan angka yang
 * bergeser-geser karena digitnya beda lebar akan terlihat paling jelas
 * justru di deretan ini; `line-height: 1` membuat tingginya ditentukan
 * `aspect-ratio` kotaknya, bukan oleh ascent dan descent angka.
 * Monospace-nya mengikuti `.lencana` dari main.css, yang memang memakai
 * font itu untuk kolom angka. */
.episode__nomor {
  font-family: ui-monospace, "SF Mono", menlo, monospace;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;

  transition: opacity var(--transisi);
}

/* Tombol putar, menumpuk di atas nomornya. */
.episode__main {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgb(0 0 0 / 0.45);
  color: #fff;
  font-size: 1rem;

  opacity: 0;
  transition: opacity var(--transisi);
}

/* Hanya perangkat berkursor. Di layar sentuh tidak ada hover, dan
 * `:hover` di sana tetap menempel setelah diketuk — tombol putarnya
 * akan menyala terus di baris yang barusan dibuka. */
@media (hover: hover) {
  .episode__butir:hover .episode__main {
    opacity: 1;
  }

  /* Angkanya ikut meredup selagi tombol putarnya tampil. Dua hal yang
   * menempati kotak yang sama akan terbaca sebagai tumpukan yang
   * berantakan, bukan sebagai satu tombol di atas satu angka. */
  .episode__butir:hover .episode__nomor {
    opacity: 0.2;
  }
}

.episode__butir:focus-visible .episode__main {
  opacity: 1;
}

.episode__isi {
  display: block;
  min-width: 0;
}

.episode__acara {
  display: block;

  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Label pribadi, pill di atas judul.
 *
 * Bentuknya bukan `.badge` apa adanya. `.badge` di main.css berukuran
 * 0.75rem dan default-nya warna aksen — itu untuk satu nilai pendek di
 * dalam satu baris, sedangkan di sini isinya kalimat pendek, dan ruang
 * teks card di layar 390px hanya sekitar 143px. Ukurannya diturunkan ke
 * 0.6875rem supaya label terpanjang di daftar ini ("Sudah lupa
 * jalannya") tetap muat satu baris.
 *
 * `display: block` + `width: fit-content`, bukan `inline-flex` bawaan
 * `.badge`: pill yang terlalu panjang untuk ruangnya harus membungkus
 * teksnya sendiri, dan `text-overflow: ellipsis` di sini justru salah —
 * label yang terpotong jadi "Pertama saya to…" tidak lagi menyatakan
 * apa pun.
 *
 * Jarak ke bawahnya milik label ini. Kalau labelnya tidak ada, baris ini
 * tidak dirender sama sekali — bukan dirender dengan margin kosong,
 * karena itu membuat judul turun satu garis di episode tanpa label. */
.episode__label {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin-bottom: 0.25rem;
  font-size: 0.6875rem;
}

/* Keterangan subtitle, satu baris di bawah judul.
 *
 * `margin-top` ikut kecil karena baris kedua ini sekarang tidak lagi
 * berbaris dengan ukuran dan kualitas — jadi jarak ke judul boleh rapat
 * tanpa terasa bertumpuk. */
.episode__keterangan {
  display: block;

  margin-top: 0.125rem;

  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* Kolom kanan: ukuran lalu kualitas, vertikal tengah.
 *
 * Rapi karena dua halnya sejajar di kanan, bukan berbaris di tengah baris
 * yang sudah dipakai judul. `flex-wrap` dipasang supaya di layar sempit
 * kualitas turun ke barisnya sendiri alih-alih menekan kolom tengah.
 *
 * `margin-left: auto` tidak perlu di sini — kolomnya sudah kolom ketiga
 * di grid, jadi lebarnya ditentukan oleh isinya. */
.episode__samping {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;

  font-size: 0.6875rem;
  color: var(--teks-sekunder);
}

/* Ukuran berkas.
 *
 * Tidak pernah kosong: `size` selalu dikirim abyss untuk berkas yang
 * sudah selesai diproses. */
.episode__ukuran {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Badge kualitas ditumpuk ATAS BAWAH, bukan disebelkan.
 *
 * Dua alasannya. Yang pertama soal ruang: dua badge mendatar
 * memakan sekitar 66px dan mengambil sebagian kolom tengah; ditumpuk
 * hanya perlu 32px, jadi judul dapet ruang lebih lega — dan ruang itulah
 * yang baru saja mepet setelah ukuran dipindah ke kanan.
 *
 * Yang kedua soal membaca: SD lalu HD menumpuk jadi tangga yang mata
 * telusuri ke bawah, sedangkan mendatar jadi deretan yang harus dibaca
 * mendatar.
 *
 * Tinggi stack-nya 34px (dua badge 16px + jarak 2px) dan kotak thumbnail
 * 43px — muat tanpa membuat baris lebih tinggi dari sekarang. */
.episode__mutu {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.125rem;
}

/* Badge-nya pakai `.mutu` dari main.css, bukan kelas sendiri — daftar
 * episode dan halaman streaming menampilkan hal yang persis sama, dan
 * dua salinan dengan ukuran berbeda akan kelihatan begitu keduanya tampil
 * bersebelahan di layar lebar. */

/* --- Layar sempit --------------------------------------------- */

/* Di bawah 30rem, satu baris episode kehilangan hampir sepertiga
 * lebarnya sekaligus: padding halaman 1rem per sisi, padding kartu
 * 1rem per sisi, kotak nomor 80px, dan kolom kanan sekitar 95px. Yang
 * tersisa buat judul acara cuma sekitar 100px — cukup untuk dua kata
 * dalam dua baris.
 *
 * Yang dikecilkan di sini hanya kotak nomornya dan ruang kosongnya:
 * angka di dalamnya tetap terbaca, dan ukuran huruf judul tidak
 * diturunkan — teks yang paling perlu terbaca justru judulnya.
 *
 * `max-width` dan bukan `min-width`, karena ini soal ruang yang
 * benar-benar tidak ada. Breakpoint-nya sama dengan yang dipakai
 * `.konten` dan `Header.vue`. */
@media (max-width: 30rem) {
  .episode__butir {
    gap: 0.75rem;
    padding: 0.75rem 0.875rem;
  }

  .episode__thumb {
    width: 4.25rem;
  }
}

/* --- Pemilih label ------------------------------------------ */

/* Lapisan gelap di belakang sheet.
 *
 * `fixed` penuh layar dan pakai `flex` supaya kotaknya bisa menempel ke
 * bawah di layar sentuh dan ke tengah di layar lebar — itu satu aturan
 * dengan dua hasil, bukan dua breakpoint. */
.sisip {
  position: fixed;
  inset: 0;
  z-index: 50;

  display: flex;
  align-items: flex-end;
  justify-content: center;

  background: rgb(0 0 0 / 0.55);
  padding: 0;
}

/* Kotaknya.
 *
 * Batas tinggi di sini, bukan `max-height` saja: daftar label bisa jadi
 * panjang setelah menambah beberapa label, dan tanpa batas tinggi sheet
 * akan menutupi seluruh layar. `overscroll-behavior: contain` supaya
 * menggulir di dalam sheet tidak ikut menggulir halaman di belakangnya. */
.sisip__kotak {
  width: 100%;
  max-width: 28rem;
  max-height: min(32rem, 88vh);

  overflow-y: auto;
  overscroll-behavior: contain;

  padding: 1rem 1rem 1.25rem;
  border-radius: var(--radius-besar) var(--radius-besar) 0 0;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-bottom: none;
}

/* Sheet di tengah, bukan menempel bawah, di layar yang cukup lebar. */
@media (min-width: 48rem) {
  .sisip {
    align-items: center;
    padding: 1rem;
  }

  .sisip__kotak {
    border-bottom: 1px solid var(--garis-halus);
    border-radius: var(--radius-besar);
  }
}

/* Fokus kotaknya sendiri tidak boleh kelihatan — yang difokuskan adalah
 * isinya, bukan wadahnya. Tanpa ini, garis fokus besar muncul di sekeliling
 * sheet setiap kali dibuka. */
.sisip__kotak:focus {
  outline: none;
}

.sisip__kepala {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  margin-bottom: 0.75rem;
}

/* Judul sheet.
 *
 * Bukan gaya label bagian: di sheet ini judulnya satu-satunya hal yang
 * memberi tahu episode mana yang sedang diberi label, jadi ukurannya seperti
 * judul halaman, bukan seperti teks kecil pembatas bagian. */
.sisip__judul {
  margin: 0;

  font-size: 1rem;
  font-weight: 600;
  color: var(--teks-utama);
}

/* Tanpa `background` di sini, tombol ini memakai warna bawaan peramban:
 * abu terang. Dan karena `main.css` tidak pernah me-reset `button`, tidak
 * ada yang menggantikannya — hasilnya kotak putih di tengah sheet gelap.
 * Semua tombol di sheet ini karena itu menyebut warnanya sendiri. */
.sisip__tutup {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 2rem;
  height: 2rem;

  background: transparent;

  border-radius: var(--radius-sedang);
  color: var(--teks-lembut);

  transition: background var(--transisi), color var(--transisi);
}

.sisip__tutup:hover {
  background: var(--latar-naik-3);
  color: var(--teks-utama);
}

/* Daftar label: dua kolom, lebar sama semua.
 *
 * Dua kolom dipilih karena dua-duanya jadi masalah nyata: satu kolom jadi
 * sepuluh baris vertikal yang harus digulir, dan sheet yang lebih tinggi
 * dari layar tidak bisa ditutup dengan mengetuk bagian luarnya. Grid
 * ratanya datang dari kolomnya, bukan dari isi labelnya — itu sebabnya
 * ujungnya tetap rata walaupun panjang tiap label berbeda-beda.
 *
 * `minmax(1rem, 1fr)` dan bukan `1fr`: tanpa batas minimum, label yang
 * panjang akan memaksa kolomnya melebar dan kolom sebelahnya bergeser.
 *
 * Tidak ada `max-height` di sini: sepuluh label di dua kolom cuma lima
 * baris, jadi tidak ada yang perlu digulir. Kalau labelnya nanti banyak
 * sekali, yang menggulir adalah kotak sheet-nya — bukan daftar ini. */
.sisip__daftar {
  display: grid;
  grid-template-columns: repeat(2, minmax(1rem, 1fr));
  gap: 0.5rem;

  margin: 0 0 0.875rem;
  padding: 0;
  list-style: none;
}

/* Satu kotak label.
 *
 * **L warnanya lebih terang dari sheet-nya, bukan lebih gelap.** Sheet memakai
 * `--latar-naik-2`, kotaknya `--latar-naik-3`. Tombol yang lebih gelap dari
 * latar di belakangnya terbaca sebagai lubang, bukan sesuatu yang bisa
 * diketuk — itu sebabnya tombolnya terasa "tidak kelihatan". Lebih terang
 * membacanya sebagai permukaan yang terangkat, dan itu yang sebuah tombol.
 *
 * **Cyan tidak dipakai di sini.** Warna cyan di situs ini berarti "hal yang
 * sudah aktif" — badge yang sedang menyala, penanda aktif, tombol yang
 * tertekan. Kalau sepuluh kotak semuanya cyan, tidak ada satu pun yang
 * berarti "yang aktif". Jadi kotak yang belum dipilih netral dengan teks
 * terang, dan hanya yang sedang dipakai yang jadi cyan.
 *
 * `min-height` menandai tinggi minimum, bukan tinggi tetap: teks yang
 * panjang boleh membungkus ke dua baris, dan kotaknya ikut —
 * sementara teks yang pendek tetap setinggi yang bersebelahan, bukan
 * jadi setengah tinggi dengan ruang kosong di bawahnya. */
.sisip__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  min-height: 3rem;
  padding: 0.625rem 0.75rem;

  border-radius: var(--radius-sedang);
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  color: var(--teks-utama);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  text-align: left;

  transition: background var(--transisi), border-color var(--transisi),
    color var(--transisi);
}

.sisip__label:hover {
  background: var(--latar-sorot);
  border-color: var(--teks-lembut);
}

/* Yang sedang dipakai.
 *
 * Cyan dipakai **sebagai warna**, bukan sebagai blok pekat: latar
 * `--latar-sorot` (sepuluh persen cyan), garis aksen, huruf cyan tebal, dan
 * centang. Solid cyan dipakai di tempat yang benar-benar besar — tombol
 * utama — sedangkan satu kotak di antara sembilan kotak lain bukan tempat
 * untuk blok warna penuh: yang menonjolnya jadi rasa membosankan,
 * bukan informasi.
 *
 * Yang membedakannya dari kotak lain ada tiga, sekaligus: warnanya cyan,
 * garisnya cyan, dan hurufnya tebal. Kotak lain tidak punya satu pun dari
 * tiga itu, jadi pilihan yang aktif tidak perlu dibaca teksnya.
 *
 * Hover-nya sengaja tidak berubah warna — kalau hover menetas, kotak yang
 * sedang aktif akan terlihat sama dengan yang sedang disorot, dan itu
 * kebetulan yang paling mudah salah baca. */
.sisip__label--dipakai,
.sisip__label--dipakai:hover {
  background: var(--latar-sorot);
  border-color: var(--aksen-indikator);
  color: var(--teks-aksen);
  font-weight: 600;
}

.sisip__label-benar {
  flex-shrink: 0;
  font-size: 1rem;
}

/* Baris ketik label baru: kolom, tombol, lalu tombol batal.
 *
 * `align-items: stretch` supaya tinggi ketiganya sama — tombol yang lebih
 * pendek dari kolomnya terlihat seperti tombol yang salah ukuran, bukan
 * seperti tombol. */
.sisip__baru {
  display: flex;
  align-items: stretch;
  gap: 0.375rem;

  margin-bottom: 0.75rem;
}

.sisip__masukan {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
}

.sisip__tambah {
  flex-shrink: 0;
  font-size: 0.8125rem;
}

.sisip__batal {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 2.5rem;

  background: transparent;
  border-radius: var(--radius-sedang);
  border: 1px solid var(--garis-halus);

  color: var(--teks-lembut);
  font-size: 1rem;

  transition: background var(--transisi), color var(--transisi);
}

.sisip__batal:hover {
  background: var(--latar-naik-3);
  color: var(--teks-utama);
}

/* Pemicu baris ketik. Baris penuh di bawah daftar, netral dan redup:
 * menambah label baru adalah pengecarian, bukan langkah wajib, jadi ia
 * tidak boleh terlihat sejelas daftar label yang sudah ada. */
/* Pemicu baris ketik. Bentuknya sama dengan baris label — lebar, tinggi,
 * dan jaraknya — tapi garisnya putus-putus supaya jelas itu bukan pilihan
 * yang ada, melainkan perintah untuk membuka kolom ketik. */
.sisip__tambah-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;

  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.75rem;

  background: var(--latar-naik-3);
  border-radius: var(--radius-sedang);
  border: 1px dashed var(--garis-sedang);

  color: var(--teks-sekunder);
  font-size: 0.8125rem;
  font-weight: 500;

  transition: background var(--transisi), border-color var(--transisi),
    color var(--transisi);
}

.sisip__tambah-label:hover {
  background: var(--latar-naik-1);
  border-color: var(--teks-lembut);
  color: var(--teks-utama);
}

/* Menghapus label adalah satu-satunya hal merusak di sheet ini, jadi ia satu-
 * satunya baris merah. Tanpa itu, "Hapus label episode ini" terlihat sama
 * dengan perintah biasa — dan ini satu-satunya tindakan di sheet ini yang
 * tidak bisa dibatalkan. */
.sisip__hapus {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  width: 100%;
  padding: 0.625rem 0.75rem;

  background: var(--latar-naik-3);
  border-radius: var(--radius-sedang);
  border: 1px solid transparent;

  color: var(--galat);
  font-size: 0.875rem;

  transition: background var(--transisi), border-color var(--transisi);
}

.sisip__hapus:hover {
  background: var(--galat-latar);
  border-color: var(--galat);
}

/* --- Daftar kosong -------------------------------------------- */

/* Redup dan kecil. Halaman ini tetap hidup — judul, tombol kembali,
 * dan navigasi bawah semuanya ada; hanya daftarnya yang kosong. */
.episode__kosong {
  margin-top: 2rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--teks-lembut);
}

/* --- Gerak --------------------------------------------------- */

/* Transisi di baris hanya memberi tahu apa yang berubah, jadi matikan
 * kalau pemakai meminta. */
@media (prefers-reduced-motion: reduce) {
  .episode__butir,
  .episode__butir::before,
  .episode__main,
  .episode__nomor,
  .episode__aksi,
  .sisip__tutup,
  .sisip__label,
  .sisip__tambah-label,
  .sisip__batal,
  .sisip__hapus {
    transition: none;
  }
}
</style>