<script setup lang="ts">
const item = [
  { nama: 'Home', ikon: 'lucide:house' },
  { nama: 'Profile', ikon: 'lucide:user' },
  { nama: 'Message', ikon: 'lucide:message-circle' },
  { nama: 'Mail', ikon: 'lucide:mail-open' },
  { nama: 'Settings', ikon: 'lucide:settings' }
]

const aktif = ref(0)

function pilih(i: number) {
  aktif.value = i
}
</script>

<template>
  <nav class="nav">
    <ul class="nav__list">
      <!-- Penting: tanpa pembungkus <li>, dan SVG indikator di dalam
           <ul>. Selector ~ dan :nth-child hanya bekerja kalau semua
           elemen ini saudara satu sama lain. -->
      <button
        v-for="(satu, i) in item"
        :key="satu.nama"
        type="button"
        class="nav__link"
        :class="{ 'active-link': i === aktif }"
        :aria-current="i === aktif ? 'page' : undefined"
        @click="pilih(i)"
      >
        <i><Icon :name="satu.ikon" /></i>
        <span class="nav__name">{{ satu.nama }}</span>
      </button>

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

           Ellipse tidak berubah bentuk: cx=47 cy=28 rx=24 ry=28
           sudah simetris terhadap titik tengah, jadi rotasi 180°
           menghasilkan bentuk yang sama.

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

   Plus dua perbaikan dari aslinya:

   1. Width dibatasi supaya navbar tidak meluar di layar yang lebih
      sempit dari 328px. Tanpa itu, margin auto tidak berlaku dan
      isinya terdorong ke tepi kiri.

   2. Rumus ruang pakai 100cqw, bukan 100vw. Navbar ini
      `position: fixed` dengan `left: 0; right: 0`, jadi lebarnya
      viewport dikurangi scrollbar, sedangkan 100vw masih
      menyertakan scrollbar. Ruang jadi terlalu lebar dan tetesan
      meleset, makin ke kanan makin jauh karena selisihnya menumpuk
      tiap langkah.

      Karena 100cqw merujuk ke lebar navbar itu sendiri, rumus yang
      sama otomatis berlaku juga di layar lebar, tanpa perlu override
      terpisah.
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
  box-shadow: 0 -8px 32px rgb(0 0 0 / 40%);
  /* Batas atas membulat, bawah menempel tepi layar. */
  border-radius: var(--radius-besar) var(--radius-besar) 0 0;
  border-top: 1px solid var(--garis-halus);
  overflow: hidden;

  /* space-evenly membagi navbar jadi 6 ruang sama besar:
   4 antar item + 2 di tepi. Lebar tiap ruang = (lebar - 5*24) / 6.

     --langkah  jarak antar titik tengah = ruang + lebar ikon
     --mula     jarak tepi ke pusat tetesan pertama, dikurangi
                separuh lebar indikator (47px) supaya pas di ikon */
  --ruang: calc((100cqw - 120px) / 6);
  --langkah: calc(var(--ruang) + 24px);
  --mula: calc(var(--ruang) + 12px - 47px);

  /* Dibuat container agar 100cqw di atas merujuk ke navbar ini,
     bukan ke elemen luar seperti <html>. */
  container-type: inline-size;

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

  /* Hilangkan kotak biru bawaan Android saat disentuh. */
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

/* Fokus keyboard tetap dikasih garis. Menjamanya jadi buta. */
.nav__link:focus-visible {
  outline: 2px solid var(--aksen-utama);
  outline-offset: -2px;
  border-radius: var(--radius-sedang);
}

.nav__link i {
  font-size: 1.5rem;
  font-style: normal;
  color: var(--teks-sekunder);
  z-index: 20;
  transition: 0.3s;
}

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
  left: 0;
  /* Menempel di tepi ATAS navbar, karena tetesan yang sudah dirotasi
     melebar di atas dan menjurus ke bawah. Kalau tetap di
     `bottom: 0`, sayap lebarnya jatuh di tengah navbar dan bentuk
     bentuknya hilang. */
  top: 0;
  fill: var(--aksen-utama);
  transition: 0.3s;

  /* Poros di tepi atas, mengikuti titik keluar air. Tetesan tumbuh
     ke bawah menjauhi navbar, dan bagian lebarnya tetap rata
     dengan tepi atas navbar. */
  transform: translateX(var(--mula)) scale(1);
  transform-origin: 50% 0%;
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.active-link i {
  color: var(--teks-aksen-tekan);
}

/* --- Move indicator ---
   Scale ikut ditulis di sini, bukan cuma translateX. Kalau scale
   hanya ada di .indicator, aturan ini akan menimpanya dan tetesan
   tidak ikut membesar. */

.nav__link:nth-child(1).active-link ~ .indicator {
  transform: translateX(var(--mula)) scale(1.1);
}

.nav__link:nth-child(2).active-link ~ .indicator {
  transform: translateX(calc(var(--mula) + var(--langkah) * 1)) scale(1.1);
}

.nav__link:nth-child(3).active-link ~ .indicator {
  transform: translateX(calc(var(--mula) + var(--langkah) * 2)) scale(1.1);
}

.nav__link:nth-child(4).active-link ~ .indicator {
  transform: translateX(calc(var(--mula) + var(--langkah) * 3)) scale(1.1);
}

.nav__link:nth-child(5).active-link ~ .indicator {
  transform: translateX(calc(var(--mula) + var(--langkah) * 4)) scale(1.1);
}

@media (prefers-reduced-motion: reduce) {
  .nav__link i,
  .nav__name,
  .indicator {
    transition: none;
  }
}
</style>
