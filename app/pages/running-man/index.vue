<script setup lang="ts">
/* Beranda Running Man: satu kartu — tayang berikutnya — dan dua
 * perintah ke halaman lain.
 *
 *   /running-man                       halaman ini
 *   /running-man/detail                informasi acara
 *   /running-man/episode               daftar episode
 *   /running-man/episode/streaming     menonton
 *
 * Berkasnya `index.vue`, bukan `running-man.vue`, dan itu syarat,
 * bukan gaya penulisan. Berkas `running-man.vue` tidak boleh berdiri
 * bersama folder `running-man/` yang bernama sama: kalau keduanya ada,
 * route di bawah folder itu menjadi CHILD dari route beranda, bukan
 * saudara. Vue Router merender parent lebih dulu dan hanya menampilkan
 * child lewat `<router-view>` milik parent — dan beranda ini tidak punya
 * satu pun. Gejalanya bukan 404, bukan peringatan di console, dan
 * semua tautannya tetap berfungsi: `/running-man/detail` hanya membuka
 * isi beranda. Bug yang lolos dari pemeriksaan biasa.
 *
 * Dengan `index.vue`, nama route mentahnya `running-man/index`, bukan
 * `running-man`, sehingga pencarian parent di `toVueRouter4` gagal
 * cocok dan `detail` tetap jadi saudara dengan path absolut. Nama route
 * akhirnya tetap `running-man`, karena `index` di ujung nama route
 * dibuang.
 *
 * Tetesan navbar diwarisi lewat awalan path `/running-man/`, jadi
 * kolom `dalam` di useMiddleSlot.ts dibiarkan kosong untuk bagian ini.
 * Lihat catatan fungsi `milik` di BottomNav.vue.
 *
 * Yang tampil di sini sengaja cuma satu kartu, karena orang yang
 * masuk lewat slot tengah navbar sedang menanyakan satu hal: "tayang
 * lagi kapan?". Jadwal, tentang acara, dan statistiknya semuanya
 * ada di halaman detail.
 *
 * Di bawahnya ada bagian klip — tiga yang terbaru, sisanya di
 * /running-man/preview. Datanya nyata, diambil dari SBS lewat
 * /api/running-man/clips.
 *
 * Sifatnya berbeda dari kartu di atas: kartu menjawab pertanyaan yang
 * sudah dibawa orang, klip menawarkan yang belum terpikir olehnya.
 * Karena itu ia duduk paling bawah, dan jumlahnya dibatasi tiga — daftar
 * penuh menjawab pertanyaan lain, dan punya halamannya sendiri.
 *
 * Kartu dan tombol sengaja terpisah, bukan kartu yang bisa diketuk
 * seluruhnya. Kalau kartu ikut jadi tautan, isinya jadi dua perintah
 * dalam satu tempat — "ini yang akan tayang" dan "buka yang lengkap"
 * — dan kartu tidak bisa menampilkan hover tanpa ikut menyiratkan
 * bahwa ia bisa diklik. Terpisah, kartu berhenti jadi penanda dan
 * tombol jadi satu-satunya perintah di halaman ini.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Running Man". Nama
 * acara dari Korea Selatan itu bukan brand Rout dan bukan teks yang
 * perlu diterjemahkan, sama seperti di useMiddleSlot.ts. */

definePageMeta({
  /* Halaman ini di-mount ulang setiap kali query berubah.
   *
   * Tanpa itu, berpindah tab hanya mengganti URL: route-nya sama persis,
   * jadi Vue Router memakai ulang instance komponennya dan `<script setup>`
   * tidak dijalankan lagi — datanya tetap milik urutan yang lama, dan
   * tabelnya terlihat tidak berubah padahal sudah pindah.
   *
   * `key` yang ikut `fullPath` membuat setiap query terbaca sebagai halaman
   * baru bagi Nuxt: setup, pengambilan data, dan pengintai ikut dibuat dari
   * nol. Halaman daftar punya catatan yang sama. */
  key: route => route.fullPath
})

const { acara, berikutnya, statistik } = useRunningMan()

const localePath = useLocalePath()

/* Klip tayang, tiga yang terbaru.
 *
 * Datanya nyata, dari SBS lewat /api/running-man/clips — bukan dummy.
 * Keputusan kenapa tiga dan kenapa diletakkan paling bawah ada di catatan
 * bagiannya di bawah, bukan di sini.
 *
 * Halaman /running-man/preview memakai daftar yang sama persis dari
 * composable yang sama, jadi berpindah ke sana tidak meminta ulang. */
const JUMLAH_KLIP = 3

const clips = await useRunningManClips(HALAMAN_BERANDA)

/* `computed` karena `clips` reaktif: `.value`-nya berubah sendiri saat
 * urutannya diganti, dan bagian ini harus ikut berubah tanpa setup
 * dijalankan ulang. */
const klipTampil = computed(() => clips.value.slice(0, JUMLAH_KLIP))

/* Urutan ikut dibawa ke halaman daftar, supaya "Lihat lebih banyak" membuka
   halaman yang urutannya sama dengan yang sedang dilihat — bukan selalu
   yang terbaru. */
const urutan = urutanKlip(useRoute().query.urutan)
</script>

<template>
  <main class="konten running-man">
    <h1 class="konten__judul">Running Man</h1>

    <p class="konten__sub">
      Tayang setiap Minggu di SBS.
    </p>

    <!-- Kartu ini bukan tautan dan tidak punya control di dalamnya,
         jadi `aria-hidden` pada mark dan ikon sudah cukup — tidak ada
         yang perlu dibaca orang yang memakai screen reader dari dalam
         kartu, karena h1 di atas sudah menyebut nama acaranya. -->
    <div class="kartu tayang">
      <!-- Mark huruf yang sama dengan yang di navbar dan di slot
           tengah. `aria-hidden` karena h1 di atas sudah menyebut nama
           acaranya; membacakan huruf "R" sekali lagi hanya menambah
           kebisingan. -->
      <span class="tayang__mark" aria-hidden="true">R</span>

      <div class="tayang__isi">
        <!-- Label dari `.label` di main.css, sama persis dengan yang
             dipakai di halaman detail dan halaman episode. Bentuk
             hurufnya sama dengan `.bagian__judul` supaya seluruh
             halaman terasa satu keluarga tipografi. -->
        <p class="label tayang__label">Tayang berikutnya</p>

        <!-- Nomor episode, bukan tanggal, yang paling besar. Ini satu-
             satunya angka besar di halaman, dan orang yang membuka
             halaman acara lebih sering mencari episode berikutnya
             daripada tanggal lengkapnya. -->
        <p class="tayang__episode">Episode {{ berikutnya.nomor }}</p>

        <!-- Tanggal dan jam dipisah jadi dua butir, bukan satu
             kalimat. "Minggu, 18 Oktober 2026 · 17.50 WIB" terbaca
             sebagai satu blok yang harus diurai, sedangkan dua butir
             dengan ikonnya bisa dipindai satu per satu. -->
        <ul class="tayang__jadwal">
          <li class="tayang__jadwal-butir">
            <Icon name="lucide:calendar-days" class="tayang__ikon" aria-hidden="true" />
            {{ berikutnya.hari }}
          </li>
          <li class="tayang__jadwal-butir">
            <Icon name="lucide:clock" class="tayang__ikon" aria-hidden="true" />
            {{ berikutnya.jam }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Dua perintah, urutannya sudah benar di HTML — utama lebih
         dulu, karena "tayang lagi kapan" sudah dijawab kartu di atas
         dan yang dicari tinggal sisanya.

         Teksnya sependek mungkin. "Lihat jadwal, statistik, dan
         semua detail" menyebut isi halaman detail di dalam tombolnya,
         dan itu membuat tombolnya hampir sepanjang satu baris penuh
         dengan kata-kata yang bukan perintah. Yang pendek tidak
         membuat orang salah paham tujuan — tiap tombol sudah punya
         ikon dan letaknya jelas. -->
    <div class="tayang__tujuan">
      <NuxtLink :to="localePath('running-man-detail')" class="tombol tombol--utama tayang__tombol">
        Semua detail
        <Icon name="lucide:arrow-right" class="tayang__ikon" aria-hidden="true" />
      </NuxtLink>

      <NuxtLink :to="localePath('running-man-episode')" class="tombol tombol--sekunder tayang__tombol">
        <Icon name="lucide:list" class="tayang__ikon" aria-hidden="true" />
        Semua episode
      </NuxtLink>
    </div>

    <!-- Rekap seperlunya saja: satu angka yang menjawab pertanyaan
         "berapa banyak yang sudah tayang", yang tidak bisa dijawab
         kartu di atas.

         Bukan grid statistik. Empat angka dalam kotak-kotak
         bertoa jadi dasbor, dan dasbor bukan tempat orang datang
         untuk melihat kapan acaranya tayang — tapi satu baris
         kalimat ringan tidak berlebihan. Yang penuh sudah ada di halaman
         detail. -->
    <p class="running-man__rekap">
      {{ statistik.episode.nilai }} episode sudah tayang sejak
      {{ acara.sejak }}.
    </p>

    <!-- ===== Klip tayang ========================================= -->

    <!-- Disembunyikan kalau daftarnya kosong. Larik kosong berarti SBS
         sedang tidak bisa dihubungi atau memang belum punya klip baru,
         dan menampilkan judul dengan isi kosong di bawahnya terlihat
         seperti ada isinya yang belum termuat. -->
    <section v-if="klipTampil.length" class="bagian">
      <h2 class="bagian__judul">예고보기</h2>

      <PreviewSort />

      <PreviewList :daftar="klipTampil" />

      <!-- Satu-satunya perintah di bagian ini, dan sengaja di bawah
           daftarnya. Orang yang sudah membaca tiga baris dan ingin
           sisanya baru menekan ini — dan saat menekannya, dia sudah
           tahu isinya akan seperti apa. -->
      <NuxtLink
        :to="localePath({ name: 'running-man-preview', query: { urutan } })"
        class="tombol tombol--sekunder lebih"
      >
        Lihat lebih banyak
        <Icon name="lucide:arrow-right" class="tayang__ikon" aria-hidden="true" />
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue, (search)/search.vue, dan
   (profile)/profile.vue. */
.running-man {
  padding-bottom: 10rem;
}

/* --- Kartu tayang -------------------------------------------- */

/* Grid dengan kolom mark dan kolom isi.
 *
 * `flex-wrap` sengaja tidak dipakai. Kartu ini hanya satu, jadi
 * tidak ada layout sempit yang perlu dilindungi — dan kalau mark
 * turun ke baris sendiri di layar kecil, isinya ikut menyempit
 * jadi pil yang memanjang, yang justru lebih buruk daripada mark
 * yang berputar ke baris kedua. */
.tayang {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.25rem;
  align-items: center;

  margin-top: 2rem;
  padding: 1.75rem;

  /* Garis aksen setebal 3px di tepi atas.
     *
     * Penanda ini yang membuat kartu ini terbaca sebagai "yang
     * berikutnya terjadi", bukan sekadar informasi. Tapi penanda ini bukan
     * latar penuh: latar cyan memenuhi separuh kartu dan berubah
     * jadi blok warna yang bersaing dengan angka episode. Garis tipis
     * memberi tanda yang sama dengan bobot yang lebih rendah. */
  border-top: 3px solid var(--aksen-indikator);
}

/* Kartu ini tidak bisa diklik ke mana pun, tapi `.kartu` dari
 * main.css mengubah warna garis saat hover. Hover itu sinyal "ini
 * punya tujuan", dan di sini tidak ada tujuan — kartu bukan tautan,
 * dan yang menuju halaman lain adalah tombol di bawahnya. */
.tayang:hover {
  border-top-color: var(--aksen-indikator);
  border-right-color: var(--garis-halus);
  border-bottom-color: var(--garis-halus);
  border-left-color: var(--garis-halus);
}

/* Mark huruf. Bentuk dan tipografinya sama persis dengan
 * `.acara__mark` di halaman detail, cuma lebih kecil supaya isinya
 * tetap yang mendominasi kartu di layar sempit.
 *
 * `line-height: 1` wajib, sama seperti di SlotMark: elemen induk
 * mewarisi line-height 1.6 dari body, dan tanpa baris ini huruf
 * duduk beberapa piksel lebih rendah dari tengah kotaknya. */
.tayang__mark {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-besar);

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  font-size: 2rem;
  line-height: 1;
  color: var(--teks-aksen);
}

/* `min-width: 0` penting: tanpa itu, tanggal yang panjang menahan
 * kolom grid dan mark terdorong ke luar kartu. */
.tayang__isi {
  min-width: 0;
}

.tayang__episode {
  margin-top: 0.25rem;
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--teks-aksen);
  /* Angka ini tidak pernah berubah bentuknya, tapi tabular-nums
     tetap dipakai supaya posisinya tidak bergeser kalau nanti diganti
     tiga angka atau dihapus jadi nol. */
  font-variant-numeric: tabular-nums;
}

/* Daftar tanggal dan jam. Jarak antar butir lebih rapat dari jarak
 * daftar keterangan di main.css — ini dua baris yang dibaca sebagai
 * satu kelompok, bukan dua keterangan terpisah. */
.tayang__jadwal {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 1.25rem;

  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

.tayang__jadwal-butir {
  display: flex;
  align-items: center;
  gap: 0.375rem;

  font-size: 0.875rem;
  color: var(--teks-sekunder);
}

/* --- Tombol -------------------------------------------------- */

/* Dua tombol berbagi lebar, bukan menumpuk.
 *
 * Menumpuknya membuat halaman jadi dua kali lebih tinggi dari yang
 * perlu — padahal isinya cuma satu kartu. Berbagi lebar
 * sekaligus memperjelas urutannya tetap terbaca sebagai utama-lalu-
 * kedua, karena yang utama lebih terang dan yang kedua garisnya
 * tetap tipis.
 *
 * `flex-wrap` yang menentukan kapan keduanya turun ke baris masing-
 * masing di layar sempit, bukan media query. */
.tayang__tujuan {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  margin-top: 1rem;
}

.tayang__tombol {
  flex: 1 1 10rem;
  justify-content: center;
}

/* --- Rekap ---------------------------------------------------- */

/* Satu kalimat di bawah tombol, redup dan rapat. Isinya cuma jumlah
 * episode, yang tidak ada di kartu — tapi cukup kecil supaya tidak
 * episode, dan cukup kecil supaya tidak jadi bagian yang meminta
 * perhatian. */
.running-man__rekap {
  margin-top: 1.25rem;
  font-size: 0.8125rem;
  color: var(--teks-lembut);
}

/* --- Pratinjau ------------------------------------------------ */

/* Tombol "lihat lebih banyak".
 *
 * Selebar bagiannya, bukan selebar tulisannya. Ia menutup daftar di
 * atasnya, dan tombol yang lebih sempit dari daftar itu terbaca
 * sebagai tambahan pada satu baris, bukan sebagai akhir dari
 * daftarnya. */
.lebih {
  width: 100%;
  justify-content: center;

  margin-top: 1rem;
}

/* --- Ikon ---------------------------------------------------- */

/* Ikon ikut ukuran teksnya, supaya tidak terlihat lebih besar dari
 * kata di sebelahnya.
 *
 * Kelasnya diletakkan langsung di `<Icon>`, bukan lewat
 * `:deep(svg)`. Bentuk `:deep(svg)` itu tidak pernah cocok: @nuxt/icon
 * merender ikon sebagai `<span class="iconify">` dan menggambarnya
 * lewat mask CSS, bukan elemen `<svg>`. Lihat catatan yang sama di
 * `.meta__ikon` di main.css. */
.tayang__ikon {
  font-size: 1rem;
}

/* --- Gerak ---------------------------------------------------- */

/* Halaman ini tidak punya gerak yang wajib diputar. Transisi di atas
 * hanya memberi tahu apa yang berubah, jadi matikan kalau pemakai
 * meminta. */
@media (prefers-reduced-motion: reduce) {
  .tayang__tombol,
  .tayang__ikon {
    transition: none;
  }
}
</style>