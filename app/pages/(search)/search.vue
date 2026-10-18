<template>
  <main class="konten cari">
    <h1 class="konten__judul">{{ t('cari.judul') }}</h1>

    <p v-if="!online" class="cari__spanduk" role="status">
      {{ t('cari.offline') }}
    </p>

    <!-- Yang tertulis di halaman ini sengaja lebih sedikit dari yang
         diketahui. Tiga keadaan — kueri kependekan, sedang mencari, dan
         selesai tanpa hasil — dilaporkan panel cari di atas kotak
         inputnya, karena panel itu tempat orang mengetik dan di situ
         orang bisa membacanya; di halaman dia hanya terlihat diredup
         tirai, yang bikin orang mengira itu isi panel.

         `halamanAdaIsi` menentukan section ini perlu dirender atau
         tidak. Tanpa itu, section tetap muncul tanpa isi apa pun:
         `<section aria-label>` kosong tetap terbaca pembaca layar,
         dan baris jumlah yang kosong meninggalkan
         `margin-bottom: 0.75rem` yang tidak terlihat tapi tetap
         menekan isi di bawahnya.

         Fase `pendek` termasuk di dalamnya, dan itu bukan pilihan
         gaya. `tentukanKeadaan` memberi `sementara: false` untuk fase
         itu, jadi kalau section ikut dirender, baris jumlah jatuh ke
         cabang paling akhir dan menulis "Tidak ada hasil untuk j" —
         padahal kueri satu huruf itu belum pernah dikirim ke server.
         Halaman menyatakan ada kesimpulan untuk pencarian yang belum
         jalan. -->
    <section
      v-if="halamanAdaIsi"
      id="hasil-cari"
      class="cari__hasil"
      :aria-label="t('cari.hasil')"
      :aria-busy="memuat"
    >
      <!-- Satu baris ringkasan untuk keadaan yang jadi milik halaman ini.
           `role="status"` dipakai karena hasil muncul tanpa halaman
           berpindah; tanpa itu, pembaca layar tidak pernah tahu
           pencarian sudah selesai.

           Tiga cabangnya sepadan dengan tiga keadaan di
           `halamanAdaIsi`, jadi baris ini tidak pernah kosong. -->
      <p class="cari__jumlah" role="status" aria-live="polite">
        <template v-if="jumlahHasil">
          {{ t('cari.temu', { jumlah: angka(jumlahHasil), kueri: qTunda }) }}
        </template>
        <template v-else-if="keadaan.fase === 'galat'">
          {{ t('cari.gagal') }}
        </template>
        <template v-else>
          {{ t('cari.belum_lengkap', { kueri: qTunda, jumlah: angka(status.terindeks) }) }}
        </template>
      </p>

      <p v-if="keadaan.memperbarui" class="cari__catatan">
        {{ t('cari.memperbarui') }}
      </p>

      <!-- Hasil sudah ada, tapi arsip klip belum selesai dicari. -->
      <p v-if="indeksSebagian" class="cari__spanduk">
        {{ t('cari.sebagian', { jumlah: angka(status.terindeks) }) }}
      </p>

      <p v-if="status.galat && status.keadaan !== 'gagal'" class="cari__spanduk">
        {{ t('cari.klip_gagal') }}
      </p>

      <p v-if="galat && !episodeGalat && jumlahHasil > 0" class="cari__spanduk">
        {{ t('cari.gagal_sebagian') }}
      </p>

      <p v-if="episodeGalat" class="cari__spanduk">
        {{ t('cari.episode_gagal') }}
      </p>

      <!-- Hasil campuran: tiap kelompok dipotong, dengan tombol
           “Lihat semua” yang membuka popup berisi daftar lengkap.

           Langsung anak `<section>`, tanpa `<template>` pembungkus.
           `<template>` tanpa `v-if`/`v-for` dikompilasi jadi elemen
           `<template>` sungguhan: isinya pindah ke `.content` yang
           tidak digambar, dan saat hydration Vue memakai
           `.content.firstChild` — yang di sini anchor fragmen, bukan
           elemen. Hasilnya tidak terlihat sama sekali dan hydration
           gagal. `v-for` di dalam sudah jadi fragmen dengan sendirinya,
           jadi pembungkus tidak perlu ada. -->
      <template v-for="satu in kelompok" :key="satu.jenis">
        <h2 class="bagian__judul cari__kelompok">
          {{ satu.label }}
          <span class="cari__angka">{{ angka(satu.total) }}</span>
        </h2>

        <ul class="cari__daftar">
          <SearchResultRow
            v-for="hasil in satu.daftar"
            :key="hasil.id"
            :hasil="hasil"
          />
        </ul>

        <div v-if="satu.total > satu.daftar.length" class="cari__lebih">
          <span>
            {{ t('cari.lebih', { tampil: angka(satu.daftar.length), total: angka(satu.total) }) }}
          </span>
          <button
            type="button"
            class="cari__semua"
            @click="bukaKelompok(satu.jenis)"
          >
            {{ t('cari.selengkapnya') }}
          </button>
        </div>
      </template>

      <!-- Belum ada satu pun klip yang cocok, dan arsipnya belum selesai
           dicari. Ini bukan "tidak ada hasil" — hasilnya bisa muncul
           beberapa detik lagi. -->
      <p v-if="indeksDisiapkan" class="cari__catatan">
        {{ t('cari.klip_disiapkan', { jumlah: angka(status.terindeks) }) }}
      </p>

      <button
        v-if="keadaan.fase === 'galat' || status.galat || (galat && jumlahHasil > 0)"
        type="button"
        class="cari__ulang"
        @click="segarkan"
      >
        <Icon name="lucide:refresh-cw" aria-hidden="true" />
        {{ t('cari.coba_lagi') }}
      </button>

      <!-- Keadaan kosong tidak dirender di sini. Pesannya milik panel
         cari, karena panel itu tempat orang mengetik — lihat
         SearchOverlay.vue. Yang tetap di halaman cuma baris jumlah di
         atas, supaya keadaan terakhir masih terbaca setelah panel
         ditutup. -->
    </section>
  </main>

  <!-- Petunjuk yang menunjuk ke navbar.

       Di luar <main>, bukan di dalamnya. Elemen ini melayang di atas
       navbar dan tidak ikut mengalir dengan isi halaman — isinya
       Navigasi, bukan konten halaman.

       `aria-hidden` karena isinya cuma mengulang sesuatu yang sudah
       bisa dilihat orang: ada ikon search di navbar. Membacakannya
       lewat screen reader hanya menambah kebisingan.

       Duration dan animasinya di CSS, bukan `setTimeout` di script.
       Kalau timer-nya yang dipakai, orang yang meninggalkan halaman
       sebelum lima detik akan menyimpan timer yang tidak pernah
       dibersihkan. -->
  <p class="cari__petunjuk" aria-hidden="true">
    <span class="cari__teks">{{ t('cari.petunjuk') }}</span>

    <span class="cari__miring" />
  </p>

  <!-- Panel cari dari navbar. Dulu komponen ini yang menjadi satu-satunya
       tempat mengetik; sekarang halaman juga punya kolom sendiri. Keduanya
       tetap ada dan memakai state yang sama: kolom halaman untuk mengetik
       langsung, panel untuk membuka pencarian dari ikon navbar.

       Ketiganya cuma berisi sesuatu kalau isi input sama dengan
       kueri yang benar-benar dicari. Syarat itu penting: tanpa itu,
       orang yang menambah satu huruf masih membaca jawaban kueri
       sebelumnya. -->
  <NavigationSearchOverlay
    :kueri-pendek="kueriPendek"
    :kueri-mencari="kueriMencari"
    :kueri-kosong="kueriKosong"
  />

  <!-- Popup daftar lengkap satu kelompok. Hasil campuran tetap di
       belakangnya; popup tidak mengubah URL dan tidak punya tab. -->
  <NavigationSearchGroupDialog
    :label="labelKelompok"
    :jenis="kelompokTerbuka"
    :total="totalKelompok"
    :daftar="daftarKelompok"
    :memuat="memuat"
    :memuat-lagi="memuatLagi"
    :habis="habisKlip"
    :format="angka"
    @muat="muatKlipLagi"
  />
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { kueri, kelompokTerbuka, bukaKelompok } = useSearchOverlay()

/** Kueri dari URL, sudah dirapikan. Query bisa berupa larik kalau orang
 *  menulis `?q=a&q=b`; yang dipakai elemen pertama. */
const qUrl = computed(() => {
  const nilai = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q

  return typeof nilai === 'string' ? nilai.trim() : ''
})

/* Diisi SEBELUM `useCari()` dipanggil, supaya render server pertama
 * sudah memakai kueri dari tautan yang dibagikan. Kalau diisi sesudah,
 * hasil pertama adalah keadaan awal lalu berganti setelah mount. */
if (qUrl.value) kueri.value = qUrl.value

const {
  kueriBersih,
  qTunda,
  selesaikanKetik,
  kelompok,
  semuaKlip,
  jumlahHasil,
  keadaan,
  status,
  totalKlip,
  memuat,
  memuatLagi,
  habisKlip,
  muatKlipLagi,
  galat,
  episodeGalat,
  online,
  angka,
  jawabanSiap,
  segarkan
} = useCari()

/** Kelompok yang popupnya sedang terbuka. Nilainya datang dari
 *  `useSearchOverlay`, bukan dari URL — popup tidak mengubah alamat. */
const kelompokAktif = computed(() =>
  kelompokTerbuka.value
    ? kelompok.value.find(satu => satu.jenis === kelompokTerbuka.value) ?? null
    : null
)

const labelKelompok = computed(() => {
  if (!kelompokTerbuka.value) return ''

  return kelompokAktif.value?.label ?? t(`cari.jenis.${kelompokTerbuka.value}`)
})

const totalKelompok = computed(() => {
  if (!kelompokTerbuka.value) return 0

  return kelompokTerbuka.value === 'klip'
    ? totalKlip.value
    : kelompokAktif.value?.semua.length ?? 0
})

const daftarKelompok = computed(() => {
  if (!kelompokTerbuka.value) return []

  return kelompokTerbuka.value === 'klip'
    ? semuaKlip.value
    : kelompokAktif.value?.semua ?? []
})

/** Apakah halaman ini punya sesuatu untuk ditulis.
 *
 *  `false` untuk tiga keadaan yang sekarang dilaporkan panel cari di
 *  atas kotak inputnya: kueri kependekan, sedang mencari, dan selesai
 *  tanpa hasil. Kalau halaman ikut menuliskannya, kalimat yang sama
 *  muncul dua kali — sekali di panel, sekali diredup di belakang tirai.
 *
 *  `sementara` tetap masuk, karena itu keadaan milik halaman: indeks
 *  klip belum selesai dibaca dan orang perlu tahu hasil yang tampil
 *  belum final. Panel tidak mengatakannya.
 *
 *  `tentukanKeadaan` tetap satu-satunya penentu fase; ini cuma
 *  menerjemahkannya jadi "apakah section perlu ada". */
const halamanAdaIsi = computed(() => {
  if (keadaan.value.fase === 'awal' || keadaan.value.fase === 'pendek') return false
  if (jumlahHasil.value > 0 || keadaan.value.fase === 'galat') return true

  /* "Indeks klip belum selesai dibaca" cuma berarti kalau jawabannya
   * sudah tahu. Selama `jawabanSiap` masih salah, yang diketahui hanya
   * "belum bertanya" — dan itu bukan jawaban atas pertanyaan apa pun.
   * Melaporkannya sama saja memberitahu orang bahwa hasilnya sudah
   * final padahal belum.
   *
   * `jawabanSiap` menggantikan cek `memuat`: kalau permintaan sedang
   * jalan, `data` masih berisi jawaban kueri yang lalu, jadi
   * `jawabanSiap` sudah salah dengan sendirinya. */
  return keadaan.value.sementara && jawabanSiap.value
})

/** Spanduk "hasil klip bisa bertambah sebentar lagi".
 *
 *  Sama syaratnya dengan bagian di atas: kalimat tentang indeks hanya
 *  boleh berbunyi setelah jawabannya datang. Tanpa itu, render pertama
 *  dari tautan langsung sudah menulis "0 klip terbaru" padahal belum
 *  ada yang ditanyakan. */
const indeksSebagian = computed(
  () => jawabanSiap.value && keadaan.value.sementara && jumlahHasil.value > 0
)

/** Catatan "indeks klip sedang disiapkan".
 *
 *  Sama juga: hanya setelah jawabannya datang, dan hanya kalau
 *  memang tidak ada kelompok klip — kalau sudah ada, orang butuh
 *  tahu hasilnya bisa bertambah, bukan bahwa indeksnya belum ada. */
const indeksDisiapkan = computed(
  () =>
    jawabanSiap.value &&
    !kelompok.value.some((satu) => satu.jenis === 'klip') &&
    status.value.keadaan !== 'lengkap' &&
    status.value.keadaan !== 'gagal'
)

/** Kueri yang perlu ditampilkan panel cari sebagai "tidak ada hasil".
 *  tidak perlu memanggil `useCari()` dan membuat instance
 *  `useAsyncData` kedua untuk kueri yang sama.
 *
 *  Ketiganya mensyaratkan hal yang sama, dan itu bukan tambahan:
 *  selama isi input belum sama dengan kueri yang sedang dicari, teksnya
 *  harusnya hilang — orang yang menambah satu huruf tidak boleh masih
 *  membaca jawaban kueri yang sudah ditinggalkan. Untuk "terlalu
 *  pendek" ini yang paling terasa, karena begitu huruf kedua masuk,
 *  pesannya harus hilang walau `qTunda` yang baru belum selesai
 *  dicari. */
const sesuaiInput = computed(() => kueriBersih.value === qTunda.value)

/** Kueri kependekan — belum cukup panjang untuk dicari. */
const kueriPendek = computed(() => sesuaiInput.value && keadaan.value.fase === 'pendek')

/** Sedang mencari. Bedanya dengan `memuat` biasa: pesan "Mencari…"
 *  hanya muncul kalau input sudah sama dengan kueri yang dicari, dan
 *  hanya kalau memang ada kueri — `memuat` bisa menyala sesaat untuk
 *  input kosong, karena `useAsyncData` tetap dipanggil untuk
 *  mengembalikan jawaban kosong. */
const kueriMencari = computed(
  () => sesuaiInput.value && memuat.value && qTunda.value !== ''
)

/** Sudah selesai dicari dan tetap nol. `null` selama indeks klip masih
 *  disiapkan: menyatakan "tidak ada hasil" saat arsipnya belum selesai
 *  dibaca akan berbohong. */
const kueriKosong = computed(() => {
  if (!sesuaiInput.value) return null
  if (keadaan.value.fase !== 'kosong' || keadaan.value.sementara) return null

  return qTunda.value
})

/* --- Sinkronisasi kueri dan URL --------------------------------
 *
 * `?q=` adalah sumber kebenaran: tautan bisa dibagikan, refresh
 * mempertahankan hasil, dan tombol back bekerja. Ketikan tidak menulis
 * URL per huruf — ditunggu sebentar dan memakai `replace`, supaya
 * riwayat browser tidak berisi satu entri per ketikan. */

let timerUrl: ReturnType<typeof setTimeout> | null = null

function tulisUrl(nilai: string) {
  if (nilai === qUrl.value) return

  void router.replace({
    query: { ...route.query, q: nilai || undefined }
  })
}

watch(kueriBersih, nilai => {
  if (timerUrl) clearTimeout(timerUrl)

  timerUrl = setTimeout(() => tulisUrl(nilai), 320)
})

/* Back/forward dan tautan yang dibuka di tab lain mengubah URL, bukan
 * state. Tanpa ini, alamatnya berubah tapi hasilnya tertinggal. */
watch(qUrl, nilai => {
  if (nilai === kueri.value.trim()) return

  kueri.value = nilai
  selesaikanKetik()
})

/* Kueri yang tersisa dari panel (panel ditutup tanpa Enter) belum ada
 * di URL. Ditulis sekali saat halaman terpasang supaya alamatnya
 * sesuai dengan yang terlihat. */
onMounted(() => {
  if (kueriBersih.value && kueriBersih.value !== qUrl.value) {
    tulisUrl(kueriBersih.value)
  }
})

onBeforeUnmount(() => {
  if (timerUrl) clearTimeout(timerUrl)
})
</script>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah tetap
   72px ditambah env(safe-area-inset-bottom). Tanpa ini konten terakhir
   tertutup navbar. Sama seperti di halaman lain. */
.cari {
  padding-bottom: 10rem;
}

/* --- Petunjuk melayang --- */

/* Melayang, bukan ikut aliran halaman.
 *
 * Dulu teks ini duduk di dalam <main>, persis di bawah judul. Itu
 * salah tempat: yang ditunjuk adalah navbar di tepi bawah, sedangkan
 * teksnya jauh dari sana di tengah halaman kosong. Jarak mata orang
 * dari teks ke ikon yang disebutnya praktis seluruh tinggi layar.
 *
 * Sekarang dia turun ke navbar dan menempel di atasnya, jadi jarak
 * dari kalimat ke ikon yang dimaksud cuma beberapa sentimeter.
 *
 * Ini bukan sekadar hiasan: halaman ini tetap punya panel yang dibuka
 * dari ikon navbar, dan petunjuk ini yang memberi tahu caranya. */
.cari__petunjuk {
  position: fixed;

  /* Menempel di sisi kiri, tidak dipusatkan.
   *
   * Alasannya: elemen ini bukan konten halaman, dan dipusatkan di
   * tengah layar membuatnya mengambang jauh dari ikon yang sedang
   * disebutnya. Yang harus dekat dengan navbar di bawah adalah sisi
   * kirinya, karena di situ letak ikon search.
   *
   * `left: 1rem` memberi jarak dari tembok kiri. Tanpa itu kotaknya
   * menempel di `left: 0` dan tepi kirinya tidak sejajar dengan teks
   * halaman yang mulai 1.5rem dari tepi.
   *
   * `width: fit-content` tetap dipakai supaya tiap locale mendapat
   * lebar sesuai panjang kalimatnya sendiri, tanpa ada angka yang
   * perlu disesuaikan per bahasa. */
  left: 1rem;
  width: fit-content;

  /* Jarak ke navbar, dan kenapa angkanya kecil.
   *
   * Jarak yang diukur di sini BUKAN jarak ke tepi atas navbar. Yang
   * penting justru jarak ke IKON, karena ikon itulah yang sedang
   * disebut kalimat ini.
   *
   * Ikon duduk di tengah navbar, dan navbar setinggi 72px — jadi
   * pusat ikon ada 36px di bawah tepi atasnya. Dengan jarak 1rem,
   * jarak sebenarnya dari kotak ke ikon jadi 1rem + 36px, hampir
   * tiga kali lipat jarak kiri yang cuma 1rem. Itu sebabnya sisi
   * bawah terasa jauh lebih jauh daripada sisi kiri.
   *
   * 0.5rem memperbaiki perbandingannya: 8px + 36px = 44px dari ikon,
   * terhadap 16px di kiri. */
  bottom: calc(72px + 0.25rem);

  z-index: 35;

  /* Padding bawah 1rem, bukan 0.75rem. Ada satu baris lagi di bawah
   * teks — motif miringnya — jadi kotak perlu ruang untuk keduanya. */
  padding: 0.75rem 0.875rem 1rem;

  /* Teks di baris pertama, motif miring di baris kedua. */
  display: grid;
  grid-template-rows: auto auto;

  text-align: left;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);

  /* Latar dan garis tipis supaya kalimatnya tetap terbaca saat lewat
   * di atas teks halaman atau navbar. */
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);

  /* Bayangan khusus kotak kecil, bukan `--bayang-panel`. Yang itu
   * disusun untuk panel selayar; dipakai di kotak ini bayangannya
   * selebar kotak dan nyaris tidak terlihat. */
  box-shadow: var(--bayang-petunjuk);

  pointer-events: none;

  /* Muncul, tahan, lalu hilang. Seluruhnya lewat CSS — tidak ada
   * `setTimeout` di script yang bisa bocor kalau orang meninggalkan
   * halaman sebelum waktunya habis.
   *
   * `forwards` menahan nilai akhir, jadi setelah selesai elemennya
   * benar-benar tidak terlihat. */
  animation: petunjuk 5s ease-in-out forwards;
}

/* Teks di baris pertama grid. */
.cari__teks {
  grid-row: 1;
}

/* Motif miring di bawah teks, di dalam kotak.
 *
 * Bentuknya sebaris tipis yang dicondongkan 30°, mengikuti arah
 * tetesan di navbar. Bukan pemotongan kotak: kotak ini tetap bulat;
 * yang miring hanya garis ini. */
.cari__miring {
  grid-row: 2;

  display: block;
  width: 2.5rem;
  height: 0.25rem;

  background: var(--aksen-indikator);

  /* `skewX`, bukan `rotate`. Yang dimiringkan hanya sisi miringnya —
   * panjang dan tinggi garisnya tetap. */
  transform: skewX(-30deg);
}

/* Pil navbar melayang 1.5rem dari bawah di layar lebar, bukan
 * menempel tepi. Petunjuk harus ikut mengambang.
 *
 * Posisi horizontalnya juga ikut berubah, dan ini yang sebelumnya
 * terlewat. `left: 1rem` di atas benar selama navbar menempel tepi:
 * di HP ikon search memang berada di sebelah kiri. Tapi di layar
 * lebar navbar berubah jadi pil 440px di TENGAH layar — lihat
 * `@media (min-width: 48rem)` di `navigation/BottomNav.vue` — jadi
 * ikon search ikut bergeser ke tengah, sementara kotak ini tetap
 * di 16px dari tepi kiri.
 *
 * Di 1440px selisihnya sekitar 630px: kalimatnya menunjuk ikon yang
 * ada hampir di seberang layar. Di HP jaraknya beberapa sentimeter,
 * di laptop jadi selebar layar — dan justru di layar besar tempat
 * orang lebih banyak membaca navbar.
 *
 * Dipusatkan, bukan memakai angka offset. Dua angka yang harus
 * dijaga sinkron — 440px dan posisi ikon di dalam navbar — sudah
 * hidup di `BottomNav.vue`, dan menyalinnya ke sini berarti dua
 * tempat yang harus dijaga sinkron.
 *
 * Dipusatkan juga nyaris tepat. Ikon search ada 77px di kiri pusat
 * navbar, sedangkan setengah lebar kotak sendiri: 144px untuk
 * kalimat Indonesia, 120px untuk Inggris. Ikonnya jatuh di dalam
 * lebar kotak, jadi kotak ini berada tepat di atas navbar tempat
 * ikon itu berada.
 *
 * Kore-nya lebih ketat dari yang terlihat: kalimat Korea hanya
 * 75px setengah lebarnya, jadi ikonnya keluar 2px dari sisi kotak.
 * Jaraknya 2px, bukan jarak yang terasa jauh — kotak masih tepat
 * di atas navbar, hanya ikonnya menyentuh tepi. Menambah offset
 * untuk menutup 2px itu berarti mengunci angka navbar ke sini,
 * dan itu justru yang dihindari di atas.
 *
 * `margin-inline: auto` dengan `left: 0; right: 0`, bukan
 * `left: 50%` + `translateX(-50%)`. Alasannya ada di keyframes
 * `petunjuk`: `transform` dipakai untuk gerak vertikal, jadi
 * `translateX` di properti yang sama akan ditimpa setiap frame
 * animasi berjalan. Auto margin tidak memakai `transform` sama
 * sekali, dan `width: fit-content` di atas tetap berlaku. */
@media (min-width: 48rem) {
  .cari__petunjuk {
    left: 0;
    right: 0;
    margin-inline: auto;
    bottom: calc(72px + 1.5rem + 0.25rem);
  }
}

/* 12% untuk masuk, 76% untuk mulai keluar — jadi masih terlihat jelas
 * di tengah, lalu menghilang pelan. `transform` di sini hanya untuk
 * gerak vertikal; tidak ada `translateX` karena kotak ini dikunci ke
 * `left`. */
@keyframes petunjuk {
  0% {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  12%, 76% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(0.5rem);
  }
}

/* Yang berubah tetap durasinya — teks tetap hilang sendiri, cuma tidak
 * lagi bergerak. */
@media (prefers-reduced-motion: reduce) {
  .cari__petunjuk {
    animation-name: petunjuk-diam;
  }
}

@keyframes petunjuk-diam {
  0% {
    opacity: 0;
  }
  12%, 76% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* --- Pesan --- */

.cari__catatan {
  margin-top: 1rem;

  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--teks-sekunder);
}

.cari__spanduk {
  margin-top: 1rem;
  padding: 0.75rem 0.875rem;

  background: var(--latar-naik-1);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);

  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* --- Hasil --- */

.cari__hasil {
  margin-top: 2rem;
}

/* Bentuknya mengikuti `.bagian__judul` di main.css. Warnanya
   `--teks-lembut` untuk kedua keadaan: berhasil atau tidak, hasilnya
   bukan tempat untuk mempertegas pesan. */
.cari__jumlah {
  margin-bottom: 0.75rem;

  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

/* Judul kelompok dan jumlahnya. Angka di kanan memakai huruf biasa —
   ia nilai, bukan judul. */
.cari__kelompok {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;

  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
}

.cari__angka {
  text-transform: none;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
}

.cari__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

/* Baris “Menampilkan X dari Y” dan tautan ke halaman penuh. */
.cari__lebih {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  margin-top: 0.5rem;

  font-size: 0.75rem;
  color: var(--teks-lembut);
}

.cari__semua {
  display: inline-flex;
  padding: 0.3125rem 0.625rem;

  background: none;
  border: 1px solid var(--garis-sedang);
  border-radius: 999px;

  color: var(--teks-sekunder);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  transition: color var(--transisi), border-color var(--transisi);
}

.cari__semua:hover {
  border-color: var(--garis-aktif);
  color: var(--teks-aksen);
}

.cari__ulang {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

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

.cari__ulang:hover {
  border-color: var(--garis-aktif);
  color: var(--teks-aksen);
}

.cari__ulang:disabled {
  opacity: 0.6;
  cursor: progress;
}
</style>
