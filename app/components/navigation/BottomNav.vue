<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// Slot tengah: satu-satunya item yang isinya bisa diganti pemakai.
const { pintasan, label } = useMiddleSlot()

// Panel pencarian. Yang dipakai hanya membuka panel dan menulis
// keadaan terbukanya ke aria-expanded.
const { terbuka: cariTerbuka, buka: bukaCari } = useSearchOverlay()

/* NuxtLink dirender lewat `:is`, bukan sebagai tag, karena tiap
   item bisa berupa link atau tombol tergantung apakah halamannya
   sudah ada — atau apakah item itu menjalankan aksi, bukan
   navigasi. resolveComponent dipanggil eksplisit supaya tidak
   bergantung pada resolusi string saat runtime. */
const Tautan = resolveComponent('NuxtLink')

/* Slash di ujung dibuang sebelum dibandingkan: satu sisi bisa
   memberikannya dan sisi lain tidak, sehingga "/id" dan "/id/"
   tidak akan dianggap sama. */
const tanpaSlash = (p: string) => p.replace(/\/$/, '')

/* Path halaman beranda untuk locale yang sedang aktif.

   `/id`, `/en`, atau `/ko`. Dipakai oleh `milik` di bawah untuk
   menghentikan pewarisan tetesan di titik yang salah. */
const beranda = localePath('index')

/* Apakah path yang sedang dibuka termasuk bagian dari sebuah item
 * navbar: berandanya sendiri, halaman anaknya, atau salah satu
 * halaman lain di bagiannya.
 *
 * Ketiga hal ini memang satu kesatuan. Slot tengah mewakili bagian
 * Running Man, dan bagian itu punya empat halaman yang tidak saling
 * menimpa: beranda di `/running-man`, isi lengkap di `/detail`, daftar
 * episode di `/episode`, dan halaman menonton di `/episode/streaming`.
 * Kalau hanya dibandingkan sama persis dengan berandanya, tetesan
 * navbar ikut hilang tepat ketika orang sedang membaca halaman-halaman
 * itu — padahal tidak ada item lain yang bisa mewakili bagian itu.
 *
 * Routing berbasis file menjawab why halaman-halaman itu tidak bisa
 * dianggap anak dari berandanya lewat path: satu-satunya cara meletakkan
 * file di bawah `/running-man` adalah lewat folder yang namanya
 * `running-man`, dan folder itu lalu bertabrakan dengan `running-man.vue`
 * yang bernama sama di direktori yang sama. Nuxt menyatukan keduanya,
 * route `/running-man/detail` tetap terbentuk tapi yang dirender adalah
 * beranda. Karena itu hubungan ini dinyatakan lewat nama route di kolom
 * `dalam`, bukan lewat path.
 *
 * Warisan path berhenti di halaman beranda, dan ini bukan sekadar
 * biaya tambahan: `/id`, `/en`, dan `/ko` adalah awalan dari setiap
 * path di locale-nya. Kalau beranda ikut mewarisi path di bawahnya,
 * semua halaman — Pengaturan, Cari, Profil, semuanya — akan menyalakan
 * tetesan Beranda. Beranda memang tidak punya halaman anak, jadi tidak
 * ada yang perlu diwariskan ke sana.
 *
 * Garis slash di akhir awalan itu wajib. Tanpa itu, `/id/running`
 * ikut terhitung milik `/id/running-man`, karena awalan hurufnya sama. */
function milik(path: string, target: string, halamanLain: readonly string[]) {
  const dari = tanpaSlash(path)

  /* `.some`, bukan `includes`: yang dibandingkan adalah hasil
     `localePath`, yaitu path lengkap untuk locale yang sedang aktif,
     bukan nama route yang tertulis di `dalam`. */
  if (halamanLain.some(nama => dari === tanpaSlash(localePath(nama)))) return true

  const ke = tanpaSlash(target)

  if (dari === ke) return true
  if (ke === beranda) return false

  return dari.startsWith(`${ke}/`)
}

/* Item search punya dua wajah, dan itu disengaja.

   Di halaman lain ia link biasa ke /search, supaya halaman itu
   tetap punya pintu masuk dari navbar.

   Sudah berada di /search, tautan itu tidak lagi berguna — kita
   sudah ada di sana. Yang ditekan saat itu adalah membuka panel,
   jadi item ini berubah jadi tombol biasa.

   `ke` sengaja TIDAK dikosongkan waktu itu. `ke` yang kosong dibaca
   `aktif` di bawah sebagai "tidak punya halaman", dan tetesan air
   akan hilang tepat ketika pengguna sedang berada di halaman
   search. Penentuan <a> atau <button> karena itu dipindah ke
   field turunan `tautan` di bawah. */
const diHalamanCari = computed(() =>
  tanpaSlash(route.path) === tanpaSlash(localePath('search'))
)

/* `ke` adalah nama route, bukan path. Dikosongkan untuk item yang
   halamannya belum ada.
   `dalam` adalah daftar nama route halaman lain milik item itu, dan
   hanya diisi slot tengah. Lihat kolom `dalam` di useMiddleSlot.ts.

   Slot tengah ikut aturan yang sama: `ke` dan `dalam` diambil dari
   pintasan yang sedang terpilih, sehingga item ini punya halaman
   kalau pintasan itu punya halaman, dan tidak punya kalau belum.

   `aksi` diisi hanya kalau item ini harus menjalankan sesuatu
   alih-alih melakukan navigasi. Nilai kosong berarti tidak ada
   aksi, dan `tautan` di bawah yang menentukan dia jadi link. */
const item = computed(() => {
  const daftar = [
    { nama: t('nav.beranda'), ikon: 'lucide:house', huruf: '', ke: 'index', dalam: [], aksi: '' },
    { nama: t('nav.cari'), ikon: 'lucide:search', huruf: '', ke: 'search', dalam: [], aksi: diHalamanCari.value ? 'cari' : '' },
    { nama: label.value, ikon: pintasan.value.ikon, huruf: pintasan.value.huruf, ke: pintasan.value.ke, dalam: pintasan.value.dalam, aksi: '' },
    { nama: t('nav.pengaturan'), ikon: 'lucide:settings', huruf: '', ke: 'settings', dalam: [], aksi: '' },
    { nama: t('nav.profil'), ikon: 'lucide:user', huruf: '', ke: 'profile', dalam: [], aksi: '' }
  ]

  /* `tautan` memisahkan dua hal yang tadinya bercampur jadi satu.
     `ke` menjawab "halaman mana", `tautan` menjawab "dirender
     sebagai link atau sebagai tombol".

     Item yang `ke`-nya kosong dan tidak punya aksi tetap jadi
     tombol mati — itu slot tengah yang pintasan yang dipilih
     belum punya halaman. */
  return daftar.map(s => ({ ...s, tautan: Boolean(s.ke) && !s.aksi }))
})

/* Item aktif dibaca dari route, bukan dari klik terakhir.
   Sebelumnya ini `ref(0)`, jadi item pertama menyala terus
   bahkan ketika sedang di halaman lain.

   Dibandingkan lewat `milik`, bukan sama persis, supaya halaman
   lain di dalam satu item — dan halaman anaknya — tetap menyalakan
   item itu. Lihat catatan fungsi `milik` di atas.

   Dibandingkan lewat path dan bukan route.name, supaya tidak
   bergantung pada cara modul i18n menamai route per locale.

   Hasilnya -1 kalau halaman ini memang tidak punya item navbar.
   Tetesan lalu diam di posisi dasar tanpa membesar. */
const aktif = computed(() =>
  item.value.findIndex(s => (s.ke ? milik(route.path, localePath(s.ke), s.dalam) : false))
)

/* Animasi tetesan baru dinyalakan setelah frame pertama selesai.

   Selama halaman baru dimuat, ukuran navbar belum tentu sudah
   mapan. Kalau `transition` sudah menyala sejak style pertama,
   selisih antara nilai yang belum mapan dan nilai akhirnya
   direkam sebagai titik awal animasi — dan tetesan tampak
   meluncur dari luar layar kanan walaupun pemakainya tidak
   berpindah ke mana pun.

   Yang diperlukan cuma menahannya sampai cat pertama selesai.
   Dua rAF dipakai karena satu rAF saja masih bisa jatuh di frame
   yang sama dengan cat pertama. */
const siap = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      siap.value = true
    })
  })
})
</script>

<template>
  <nav class="nav" :class="{ 'nav--siap': siap }">
    <ul class="nav__list">
      <!-- Penting: tanpa pembungkus <li>, dan SVG indikator di dalam
           <ul>. Selector ~ dan :nth-child hanya bekerja kalau semua
           elemen ini saudara satu sama lain. Itu juga alasan
           `<component>` dipakai di sini: ia merender <a> atau
           <button> langsung, tanpa membungkus elemen lain yang
           bisa merusak urutan saudara.

           Penentuan link atau tombol membaca `tautan`, bukan
           `ke`. Item search di halaman /search punya `ke` yang
           tetap terisi supaya tetesannya tidak hilang, tapi
           dirender sebagai tombol. -->
      <component
        :is="satu.tautan ? Tautan : 'button'"
        v-for="(satu, i) in item"
        :key="i"
        :to="satu.tautan ? localePath(satu.ke) : undefined"
        :type="satu.tautan ? undefined : 'button'"
        :disabled="!satu.tautan && !satu.aksi"
        class="nav__link"
        :class="{ 'active-link': i === aktif }"
        :aria-current="i === aktif ? 'page' : undefined"
        :aria-haspopup="satu.aksi ? 'dialog' : undefined"
        :aria-expanded="satu.aksi ? cariTerbuka : undefined"
        @click="satu.aksi ? bukaCari() : undefined"
      >
        <!-- Mark ikon atau huruf, keduanya lewat satu komponen
             supaya kotak dan tipografinya hanya ada di satu
             tempat — lihat navigation/slot/SlotMark.vue. -->
        <NavigationSlotMark
          class="nav__mark"
          :ikon="satu.ikon"
          :huruf="satu.huruf"
        />
        <span class="nav__name">{{ satu.nama }}</span>
      </component>

      <!-- Tetesan air, dirotasi 180° dari source aslinya.

           Bentuk aslinya melebar di BAWAH (menyimpan di dasar
           navbar), lalu menyempit ke ATAS. Itu bentuk cairan yang
           mengendap, bukan yang jatuh.

           Di sini dibalik: melebar di ATAS navbar, lalu menjurus
           ke bawah sampai runcing. Jadi yang ditunjukkan air yang
           keluar dari permukaan navbar lalu menetes — bukan yang
           mengendap.

           Rotasi dilakukan dengan membalik tiap koordinat y
           (y -> 56 - y) langsung di dalam path, bukan pakai
           `scaleY(-1)` di CSS. Scale hanya memantulkan gambar
           visual tanpa mengubah path-nya, sehingga koordinat yang
           dipakai rumus posisi tidak ikutsinkron. Dengan menulis
           ulang path-nya, setiap titik benar-benar pindah dan
           bentuknya tetap simetris.

           Lebar 94px dan warnanya tetap sama seperti aslinya. -->
      <svg
        class="indicator"
        width="94"
        height="56"
        viewBox="0 0 94 56"
        aria-hidden="true"
      >
        <ellipse cx="47" cy="28" rx="24" ry="28" />
        <path d="M24 36C24 36 28 0 48 0L0 0C18 0 24 36 24 36Z" />
        <path d="M70 36C70 36 66 0 46 0L94 0C76 0 70 36 70 36Z" />
      </svg>
    </ul>
  </nav>
</template>

<style scoped>
/* ==========================================================================
   Struktur dan angka diambil apa adanya dari:
   https://github.com/bedimcode/liquid-navigation-indicator

   Yang diganti hanya warna, supaya cocok dengan tema Rout:
     --container-color -> --latar-naik-2
     --first-color     -> --aksen-utama
     --title-color     -> --teks-sekunder
     --body-color      -> --teks-aksen-tekan

   Plus tiga perbaikan dari aslinya:

   1. Width dibatasi supaya navbar tidak meluar di layar yang lebih
      sempit dari 328px. Tanpa itu, margin auto tidak berlaku dan
      isinya terdorong ke tepi kiri.

   2. Ruang dihitung dari lebar navbar itu sendiri. Versi aslinya
      memakai `100vw`, sedangkan navbar ini `position: fixed` dengan
      `left: 0; right: 0`, jadi lebarnya viewport dikurangi
      scrollbar. Ruang jadi terlalu lebar dan tetesan meleset, makin
      ke kanan makin jauh karena selisihnya menumpuk tiap langkah.

   3. Ruang dihitung lewat persentase pada `left`, bukan lewat
      `translateX`.

      Semula keduanya memakai `100cqw` plus `container-type:
      inline-size` di navbar. Itu benar secara spesifikasi, tapi
      nilainya sempat terpecah saat halaman baru dimuat: yang
      terpecah bukan lebar navbar, tapi viewport, sehingga ruang
      antar item jadi jauh lebih lebar dan tetesan mulai dari luar
      layar kanan lalu meluncur ke tempatnya. Karena `transform`
      punya transition, selisih yang hanya beberapa frame itu tetap
      terlihat sebagai gerakan.

      Persentase pada `left` selalu relatif ke padding box elemen
      yang jadi pemb positioning, yaitu navbar ini juga, dan
      nilainya tersedia sejak layout pertama. Tidak ada container
      query yang perlu ditunggu. Rumus angkanya sendiri tidak
      berubah, jadi tetesan tetap pas di item yang sama, termasuk
      di layar lebar tanpa override terpisah.

      Yang dibayar: `left` menganimate layout, sementara
      `transform` cuma komposit. Untuk satu SVG 94x56 di dalam
      navbar yang diam, selisihnya tidak terasa.
   ========================================================================== */

.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: auto;
  height: 72px;
  background-color: var(--latar-naik-2);
  /* Ruang gesture bar di perangkat yang punya. */
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: var(--bayang-navbar);
  /* Batas atas membulat, bawah menempel tepi layar. */
  border-radius: var(--radius-besar) var(--radius-besar) 0 0;
  border-top: 1px solid var(--garis-halus);
  overflow: hidden;

  /* space-evenly membagi navbar jadi 6 ruang sama besar:
   4 antar item + 2 di tepi. Lebar tiap ruang = (lebar - 5*24) / 6.

     --langkah  jarak antar titik tengah = ruang + lebar ikon
     --mula     jarak tepi ke pusat tetesan pertama, dikurangi
                separuh lebar indikator (47px) supaya pas di ikon

     Ketiga rumus ini mengasumsikan tiap item selebar 1.5rem.
     Angka itu ditulis lewat --lebar-item, bukan langsung, supaya
     cuma ada satu nilai yang menentukan: kalau kotak mark nanti
     diubah, rumus ini ikut berubah dan tetesan tidak meleset
     diam-diam.

     120px yang lama = 5 item x 24px, sekarang jadi
     var(--lebar-item) * 5. Perkalian harus di dalam calc karena
     --lebar-item bertipe length, bukan number.

     Persentase di sini sengaja, bukan `cqw`. Nilai `--ruang`
     diselesaikan di tempat variabel ini dipakai, yaitu pada
     `left` di .indicator, relatif ke navbar ini. Container query
     unit baru bisa dijawab setelah ukuran container selesai
     dihitung, dan saat halaman baru dimuat belum tentu sudah.
     Lihat catatan poin 3 di atas. */
  --lebar-item: 1.5rem;
  --ruang: calc((100% - var(--lebar-item) * 5) / 6);
  --langkah: calc(var(--ruang) + var(--lebar-item));
  --mula: calc(var(--ruang) + var(--lebar-item) / 2 - 47px);

  z-index: 30;
}

/* Di layar lebar, navbar tidak melar dari tepi ke tepi. */
@media (min-width: 48rem) {
  .nav {
    bottom: 1.5rem;
    left: 50%;
    right: auto;
    width: 328px;
    margin: 0 auto;
    transform: translateX(-50%);
    padding-bottom: 0;
    border-top: 0;
    border: 1px solid var(--garis-halus);
    border-radius: var(--radius-besar);
  }
}

/* space-evenly: ruang di tepi sama besarnya dengan ruang antar
   item. space-around hanya diberi setengah, itu yang bikin navbar
   terlihat timpang. */
.nav__list {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  height: 72px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Area klik 44px sesuai standar sentuh, tapi yang terlihat tetap
   ikon 24px. Padding memperbesar tombol, margin negatif mengembalikan
   lebar yang dipesan flex ke 24px — jadi rumus --ruang dan --langkah
   tetap benar dan indikator tidak bergeser. */
.nav__link {
  display: flex;
  flex-direction: column;
  align-items: center;

  /* Jangkar untuk label. Tanpa ini, `bottom: 100%` akan terukur
     terhadap .nav dan teksnya meleset jauh dari ikon. */
  position: relative;

  padding: 10px;
  margin: -10px;

  border: 0;
  background: none;
  cursor: pointer;

  /* Elemen ini bisa jadi <a> (item yang halamannya sudah ada)
     atau <button> (yang belum). Tanpa dua baris ini, begitu
     ada <a> di antara keduanya, navbar akan menampilkan teks
     biru bergaris bawah bawaan browser — bukan tema Rout. */
  color: inherit;
  text-decoration: none;

  /* Hilangkan kotak biru bawaan Android saat disentuh. */
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

/* Item yang halamannya belum ada.

   `disabled` dipakai, bukan sekadar `aria-disabled`, supaya item
   ini tidak masuk urutan tab dan tidak bisa terpicu Enter.
   Sebuah control yang kelihatan bisa diklik tapi tidak melakukan
   apa pun lebih buruk daripada yang terlihat mati. */
.nav__link:disabled {
  opacity: 0.4;
  cursor: default;
}

/* TIDAK ada aturan `:focus-visible` di sini, dan itu disengaja.

   Semula ada garis cyan 2px di sekitar item yang sedang fokus.
   Garis itu benar secara aksesibilitas — tanpa penanda seperti
   ini, orang yang navigasi dengan keyboard tidak tahu sedang di
   mana posisinya.

   Tapi garis itu muncul hanya setelah interaksi keyboard, bukan
   setelah ketukan. Ketika panel pencarian ditutup, fokus
   dikembalikan ke ikon search, dan saat itulah garisnya muncul —
   lalu bertahan sampai halaman di-reload.

   Bentuknya kotak dan warnanya cyan yang sama dengan tetesan,
   jadi bagi yang tidak tahu asalnya, ia terbaca bukan sebagai
   penanda fokus, melainkan sebagai bagian dari tetesan yang
   berubah bentuk.

   Dihapus atas permintaan: tampilan lebih bersih, dan tetesan
   tidak lagi berubah-ubah bentuk sendiri.

   Kalau nanti penanda fokus dibutuhkan lagi, jangan pakai
   `outline` penuh seperti sebelumnya. Yang lebih halus: gerakkan
   hanya tetesannya ke item yang fokus, atau beri warna teks yang
   lebih terang. Keduanya tidak menutupi bentuk tetesan. */

/* Mark item.

   Kotak dan tipografinya sekarang milik
   navigation/slot/SlotMark.vue, bukan di sini. Yang tersisa di
   navbar cuma warna, z-index, dan transisinya.

   Aturan ini hanya menata warna. Kotak 24x24 yang tetap pernah
   ada di sini sudah pindah ke komponen mark, karena tiga tempat
   butuh ukuran yang sama persis. Kalau ukuran kotak meleset,
   space-evenly menghitung ulang ruangnya sementara rumus --ruang
   tetap memakai lebar yang sama — dan tetesan bergeser. */
.nav__mark {
  color: var(--teks-sekunder);
  z-index: 20;
  transition: color var(--transisi);
}

/* Mark berupa huruf tidak punya aturan terpisah di navbar lagi.
   Aturan huruf dan kotak ada di navigation/slot/SlotMark.vue.
   Warna huruf ikut .nav__mark karena mewarisi, jadi aturan
   .active-link di bawah otomatis berlaku untuk ikon maupun
   huruf. */

/* Label teks, di dalam tetesan.

   Dipakai `bottom`, bukan `translateY` dengan angka tebakan.
   `bottom: 100%` menaruh tepi bawah label tepat di tepi atas kotak
   tombol, jadi posisinya mengikuti tombol, bukan static position
   yang bergeser oleh padding dan margin negatif.

   Angka 6px menarik label ke bawah supaya tidak terlalu tinggi.
   Tepi atas tombol ada 10px di atas ikon (itu `padding: 10px`),
   jadi tanpa angka ini label duduk 10px di atas ikon. Dengan 9px,
   label duduk 1px di atas ikon.

   Ini batasnya: kalau label masih terasa terlalu rendah, angka ini
   sudah penuh. Untuk menurunkan lagi, yang harus diubah adalah
   jarak ikon ke tepi navbar, bukan angka di sini.

   `left: 50%` + `translateX(-50%)` menjaga teks tetap di tengah.
   Tanpa `translateX(-50%)`, `left: 50%` cuma menggeser separuh
   lebar teks ke kanan.

   Animasi: teks mulai 12px di atas posisi akhirnya, lalu turun ke
   tempatnya sambil fade in. Arahnya mengikuti tetesan yang
   menjurus ke bawah. */
.nav__name {
  position: absolute;
  bottom: calc(100% - 9px);
  left: 50%;

  font-size: 0.625rem;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1),
              opacity 0.3s;
  color: var(--teks-aksen-tekan);
  z-index: 20;

  transform: translate(-50%, -12px);
  opacity: 0;
}

.active-link .nav__name {
  opacity: 1;
  transform: translate(-50%, 0);
}

.indicator {
  position: absolute;

  /* Menempel di tepi ATAS navbar, karena tetesan yang sudah dirotasi
     melebar di atas dan menjurus ke bawah. Kalau tetap di
     `bottom: 0`, sayap lebarnya jatuh di tengah navbar dan bentuknya
     hilang.

     Posisi horizontalnya lewat `left`, bukan `translateX`.

     Alasannya ada di --ruang: persentase hanya boleh dipakai di
     properti yang menerimanya, yaitu `left` yang relatif ke navbar
     ini. Kalau dipakai di `translateX`, persentasenya relatif ke
     lebar SVG itu sendiri, yaitu 94px, bukan navbar.

     Poros di tepi atas, mengikuti titik keluar air. Tetesan tumbuh
     ke bawah menjauhi navbar, dan bagian lebarnya tetap rata
     dengan tepi atas navbar. */
  left: var(--mula);
  top: 0;
  fill: var(--aksen-utama);
  transform: scale(1);
  transform-origin: 50% 0%;
}

/* Animasi baru menyala setelah frame pertama selesai, supaya nilai
   yang belum mapan tidak terekam sebagai titik awal. Lihat catatan
   `siap` di script. */
.nav--siap .indicator {
  transition: left 0.3s cubic-bezier(0.34, 1.4, 0.64, 1),
              transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}

/* Huruf dan ikon sama-sama mewarisi dari .nav__mark, jadi satu
   aturan ini menutup keduanya. */
.active-link .nav__mark {
  color: var(--teks-aksen-tekan);
}

/* --- Move indicator ---
   Scale ikut ditulis di sini, bukan cuma di .indicator, kalau tidak
   aturan ini akan menimpanya dan tetesan tidak ikut membesar. */

.nav__link:nth-child(1).active-link ~ .indicator {
  left: var(--mula);
  transform: scale(1.1);
}

.nav__link:nth-child(2).active-link ~ .indicator {
  left: calc(var(--mula) + var(--langkah) * 1);
  transform: scale(1.1);
}

.nav__link:nth-child(3).active-link ~ .indicator {
  left: calc(var(--mula) + var(--langkah) * 2);
  transform: scale(1.1);
}

.nav__link:nth-child(4).active-link ~ .indicator {
  left: calc(var(--mula) + var(--langkah) * 3);
  transform: scale(1.1);
}

.nav__link:nth-child(5).active-link ~ .indicator {
  left: calc(var(--mula) + var(--langkah) * 4);
  transform: scale(1.1);
}

@media (prefers-reduced-motion: reduce) {
  .nav__mark,
  .nav__name,
  .indicator,
  /* Specificity-nya lebih tinggi dari .nav--siap .indicator, jadi
     harus disebut terpisah dan sesudahnya. Tanpa ini, reduce motion
     diabaikan begitu navbar selesai frame pertama. */
  .nav--siap .indicator {
    transition: none;
  }
}
</style>
