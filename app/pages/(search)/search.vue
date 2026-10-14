<template>
  <main class="konten cari">
    <h1 class="konten__judul">{{ t('cari.judul') }}</h1>

    <!-- ============ Tempat hasil pencarian ============

         Satu blok, tiga kondisi. Semuanya sudah ditulis dari
         awal supaya kerangkanya tidak perlu dibongkar saat
         pencarian sungguhan menyusul:

           belum ada yang diketik   → blok ini tidak muncul
           ada kueri, nol hasil     → "tidak ada hasil"
           ada hasil                → jumlah, lalu daftar

         Dua hal yang sengaja belum ada: keadaan "sedang mencari"
         dan keadaan "gagal". Keduanya butuh keputusan bentuk dulu
         — apakah spinner, apakah pesan, apakah hasilnya menumpuk
         dari atas — dan menebak sekarang hanya menambah kode yang
         nanti harus dibongkar.

         Jumlah hasil ditulis terpisah dari kalimat "tidak ada
         hasil". Saat daftar kosong, kabar buruknya sudah cukup;
         menambah jumlah nol di dalamnya cuma membingungkan.

         `role="status"` + `aria-live="polite"` dipakai karena
         hasil muncul tanpa halaman berpindah. Tanpa itu, orang
         yang memakai screen reader tidak pernah tahu bahwa
         pencarian sudah selesai. -->
    <section v-if="adaKueri" class="cari__hasil">
      <p class="cari__jumlah" role="status" aria-live="polite">
        <template v-if="hasil.length">
          {{ t('cari.temu', { jumlah: hasil.length, kueri: kueriBersih }) }}
        </template>
        <template v-else>
          {{ t('cari.tak_ada', { kueri: kueriBersih }) }}
        </template>
      </p>

      <ul v-if="hasil.length" class="cari__daftar">
        <li v-for="satu in hasil" :key="satu.id" class="cari__baris">
          <span class="cari__baris-judul">{{ satu.judul }}</span>
          <span class="cari__baris-ket">{{ satu.keterangan }}</span>
        </li>
      </ul>
    </section>
  </main>

  <!-- Petunjuk yang menunjuk ke navbar.

       Di luar <main>, bukan di dalamnya. Elemen ini melayang di
       atas navbar dan tidak ikut mengalir dengan isi halaman —
       isinya Navigasi, bukan konten halaman. Taruh di luar
       <main> supaya yang di dalamnya benar-benar isi halaman,
       dan supaya `padding-bottom` milik .konten tidak ikut
       menggesernya.

       `aria-hidden` karena isinya cuma mengulang sesuatu yang
       sudah bisa dilihat orang: ada ikon search di navbar.
       Membacakannya lewat screen reader hanya menambah
       kebisingan — apalagi pada halaman yang isinya sudah
       sedikit.

       Duration dan animasinya di CSS, bukan `setTimeout` di
       script. Kalau timer-nya yang dipakai, orang yang
       meninggalkan halaman sebelum lima detik akan menyimpan
       timer yang tidak pernah dibersihkan. -->
  <p class="cari__petunjuk" aria-hidden="true">
    <span class="cari__teks">{{ t('cari.petunjuk') }}</span>

    <!-- Motif miring, di dalam kotak dan di bawah teks. -->
    <span class="cari__miring" />
  </p>

  <NavigationSearchOverlay />
</template>

<script setup lang="ts">
const { t } = useI18n()

/* Bagian hasil membaca apa yang diketik orang. Belum ada
   pencarian sungguhan — `hasil` hanya berisi data contoh
   sementara, jadi daftar itu belum benar-benar hasil pencarian. */
const { kueriBersih, adaKueri, hasil } = useSearchOverlay()
</script>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue, running-man/index.vue, dan
   (profile)/profile.vue. */
.cari {
  padding-bottom: 10rem;
}

/* --- Petunjuk melayang --- */

/* Melayang, bukan ikut aliran halaman.

   Dulu teks ini duduk di dalam <main>, persis di bawah judul.
   Itu salah tempat: yang ditunjuk adalah navbar di tepi
   bawah, sedangkan teksnya jauh dari sana di tengah halaman
   kosong. Jarak mata orang dari teks ke ikon yang disebutnya
   praktis seluruh tinggi layar.

   Sekarang dia turun ke navbar dan menempel di atasnya, jadi
   jarak dari kalimat ke ikon yang dimaksud cuma beberapa
   sentimeter. */
.cari__petunjuk {
  position: fixed;

  /* Menempel di sisi kiri, tidak dipusatkan.

     Alasannya: elemen ini bukan konten halaman, dan dipusatkan
     di tengah layar membuatnya mengambang jauh dari ikon yang
     sedang disebutnya. Yang harus dekat dengan navbar di bawah
     adalah sisi kirinya, karena di situ letak ikon search.

     `left: 1rem` memberi jarak dari tembok kiri. Tanpa itu
     kotaknya menempel di `left: 0`, persis seperti di foto —
     dan tepi kirinya jadi tidak sejajar dengan teks halaman
     yang mulai 1.5rem dari tepi.

     `width: fit-content` tetap dipakai supaya tiap locale
     mendapat lebar sesuai panjang kalimatnya sendiri, tanpa ada
     angka yang perlu disesuaikan per bahasa.

     `display` sengaja dibiarkan apa adanya (block). Isinya cuma
     satu kalimat, jadi tidak butuh flex atau grid untuk menyusun
     apa pun.

     JANGAN ditambah `margin: 0` di bawah ini. `margin` itu
     shorthand yang menimpa keempat sisi sekaligus, dan begitu
     itu terjadi jarak kirinya ikut hilang lalu kotak ini
     kembali menempel ke tembok. Kalau butuh nolkan margin
     vertis, tulis `margin-block: 0` saja. */
  left: 1rem;
  width: fit-content;

  /* Jarak ke navbar, dan kenapa angkanya kecil.

     Jarak yang diukur di sini BUKAN jarak ke tepi atas navbar.
     Yang penting justru jarak ke IKON, karena ikon itulah yang
     sedang disebut kalimat ini.

     Ikon duduk di tengah navbar, dan navbar setinggi 72px —
     jadi pusat ikon ada 36px di bawah tepi atasnya. Dengan
     jarak 1rem, jarak sebenarnya dari kotak ke ikon jadi
     1rem + 36px, hampir tiga kali lipat jarak kiri yang cuma
     1rem. Itu sebabnya sisi bawah terasa jauh lebih jauh
     daripada sisi kiri.

     0.5rem memperbaiki perbandingannya: 8px + 36px = 44px dari
     ikon, terhadap 16px di kiri. Belum sama persis, tapi kotak
     ini turun cukup untuk tidak terlihat melayang.

     0.25rem adalah titik paling mepet yang masih aman: kotak
     ini tidak menyenggol navbar dan menutupi tetesan cyan
     di atas ikon. */
  bottom: calc(72px + 0.25rem);

  z-index: 35;

  /* Padding bawah 1rem, bukan 0.75rem. Ada satu baris lagi di
     bawah teks — motif miringnya — jadi kotak perlu ruang untuk
     keduanya. Dengan padding yang sama seperti teks, motif itu
     akan duduk menempel di garis bawah kotak. */
  padding: 0.75rem 0.875rem 1rem;

  /* Teks di baris pertama, motif miring di baris kedua.

     Grid, bukan flex. Dengan flex keduanya akan duduk sebaris
     dan motif tidak akan pernah turun ke bawah teks. */
  display: grid;
  grid-template-rows: auto auto;

  /* Rata kiri, bukan rata tengah.

     `width: fit-content` membuat lebar kotak mengikuti teksnya,
     jadi kotak ini sudah pas — tidak ada sisa ruang kosong
     yang perlu diseimbangkan. Dengan `center`, teksnya malah
     terlihat terdorong ke kiri dari kotaknya sendiri, karena
     yang dirata-tengahkan adalah jarak sisa yang hampir nol.

     Kalimat ini satu bagian utuh, bukan judul dan paragraf.
     Rata kiri membuatnya terbaca sebagai satu baris pesan. */
  text-align: left;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);

  /* Latar dan garis tipis supaya kalimatnya tetap terbaca
     saat lewat di atas teks halaman atau navbar. Tanpa
     keduanya, teks ini transparan dan hilang begitu ada apa
     pun di belakangnya. */
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);

  /* Bayangan khusus kotak kecil, bukan `--bayang-panel`.

     Yang itu disusun untuk panel selayar seperti dialog slot
     tengah: jarak 24px dan kabut 64px. Dipakai di kotak ini,
     bayangannya jadi selebar kotak dan set transparan sampai
     nyaris tidak terlihat — persis yang terjadi di foto,
     kotak terasa menempel rata di layar, bukan melayang.

     Yang benar untuk kotak selapis ini adalah jarak dekat dan kabut
     sempit, supaya siluetnya terbaca dan kotaknya jelas terangkat
     dari isinya. */
  box-shadow: var(--bayang-petunjuk);

  pointer-events: none;


  /* Muncul, tahan, lalu hilang. Seluruhnya lewat CSS —
     tidak ada `setTimeout` di script yang bisa bocor kalau
     orang meninggalkan halaman sebelum waktunya habis.

     `forwards` menahan nilai akhir, jadi setelah selesai
     elemennya benar-benar tidak terlihat, bukan kembali ke
     kondisi awal yang terlihat lagi. */
  animation: petunjuk 5s ease-in-out forwards;
}

/* Teks di baris pertama grid. */
.cari__teks {
  grid-row: 1;
}

/* Motif miring di bawah teks, di dalam kotak.

   Bentuknya sebaris tipis yang dicondongkan 30°. Arahnya dari
   kiri atas ke kanan bawah, mengikuti arah tetesan di navbar —
   yang juga menyempit ke arah kanan bawah.

   Bukan pemotongan kotak. Kotak ini tetap bulat seperti
   semula; yang miring hanya garis ini.

   Catatan penting: motif ini berada di dalam kotak petunjuk,
   bukan di navbar. Kalau sekilas terlihat menempel pada ikon
   search, itu karena kotak petunjuk melayang tepat di atas
   navbar — bukan karena motifnya ada di sana. */
.cari__miring {
  grid-row: 2;

  display: block;
  width: 2.5rem;
  height: 0.25rem;

  /* Cyan murni, sama persis dengan tetesan di navbar — bukan
     `--aksen-utama`. Yang 500 itu cyan yang lebih tenang,
     dipakai untuk tombol dan teks di atasnya. Motif ini kecil
     dan tidak punya teks di atasnya, jadi yang dipakai adalah
     yang paling terang supaya benar-benar terbaca sebagai
     aksen, bukan sekadar garis dekoratif.

     `--aksen-indikator` sudah persis nilai itu di main.css,
     jadi tidak ada warna baru yang perlu ditambahkan. */
  background: var(--aksen-indikator);

  /* `skewX`, bukan `rotate`. Yang dimiringkan hanya sisi
     miringnya — panjang dan tinggi garisnya tetap. Kalau
     diputar, ujungnya ikut naik dan motifnya tidak lagi rata
     dengan basalanya. */
  transform: skewX(-30deg);
}

/* Pil navbar melayang 1.5rem dari bawah di layar lebar, bukan
   menempel tepi. Petunjuk harus ikut mengambang, kalau tidak
   ia akan menempel di navbar yang sebenarnya ada di bawah.

   Jarak 0.25rem-nya ikut di sini. Kalau hanya di aturan atas,
   aturan ini menimpanya dan kotak ini melompat ke bawah
   0.25rem begitu layar melebar. */
@media (min-width: 48rem) {
  .cari__petunjuk {
    bottom: calc(72px + 1.5rem + 0.25rem);
  }
}

/* 12% untuk masuk, 76% untuk mulai keluar — jadi masih terlihat
   jelas di tengah, lalu menghilang pelan.

   `transform` di sini hanya untuk gerak vertis. Tidak ada
   `translateX` sama sekali: kotak ini tidak dipusatkan, tapi
   dikunci ke `left: 1rem` di atas. Kalau `translateX` muncul,
   teks akan bergeser ke kanan dari posisi kiri yang sudah
   benar. */
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

/* Yang berubah tetap durasinya — teks tetap hilang sendiri,
   cuma tidak lagi bergerak. Menahan opacity tanpa
   transform sudah cukup, dan ini yang membuat animasi bisa
   dimatikan tanpa membiarkan teksnya menggantung selamanya
   di layar. */
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

/* ============ Tempat hasil pencarian ============ */

/* Jarak dari judul lewat `margin-top`, bukan padding, supaya
   jarak ini hilang bareng elemennya saat `v-if` menyingkirkan
   bagian hasil. Jarak yang menempel ke elemennya sendiri tidak
   punya masalah itu. */
.cari__hasil {
  margin-top: 2.5rem;
}

/* Satu blok pesan untuk dua keadaan: jumlah hasil, atau kabar
   tidak adanya.

   Semula dipisah jadi dua elemen dengan dua kelas berbeda —
   `.cari__jumlah` dan `.cari__kosong` — padahal keduanya cuma
   berbeda ukuran dan jarak ke daftar. Dua elemen untuk satu
   tempat berarti aturan warnanya bisa berbeda satu baris,
   dan saat keadaan ketiga nanti ditambahkan, aturan
   warnanya bisa tertinggal satu baris.

   Bentuknya mengikuti `.bagian__judul` di main.css supaya
   label ini konsisten dengan bagian di halaman lain.

   Warnanya `--teks-lembut` untuk kedua keadaan. Ini kabar
   netral — berhasil atau tidak, hasilnya bukan tempat untuk
   mempertegas pesan. Mempertegas kabar buruk hanya memaksa
   orang membaca lagi, dan mempertegas kabar baik membuat
   halaman terasa berteriak. */
.cari__jumlah {
  margin-bottom: 0.75rem;

  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--teks-lembut);
}

/* Daftar hasil.

   `.grid-demo` dari main.css sengaja tidak dipakai di sini. Itu
   untuk kotak demo dengan tinggi sama, bukan untuk daftar yang
   panjang isinya berbeda-beda.

   Jarak antar baris 0.5rem, bukan 0.75rem seperti jarak bagian
   di halaman lain. Hasil pencarian dibaca cepat dan beruntun,
   bukan satu per satu seperti bagian Setting — jarak yang terlalu
   renggang membuat daftar terasa terpisah, yang justru
   counterproductive untuk hal yang memang harus terbaca
   sebagai satu daftar. */
.cari__daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

/* Satu hasil.

   Permukaannya ditulis sendiri, bukan memakai `.kartu` dari
   main.css.

   Alasannya `.kartu` menyertakan `:hover` yang mengubah warna
   garis — dan hover itu sinyal "ini bisa diklik". Baris hasil
   belum punya tujuan: belum ada sumber data, jadi belum ada
   yang bisa dituju. Memakai `.kartu` sekarang berarti
  sebagian baris terlihat bisa diklik padahal tidak ada yang
   terjadi kalau diklik.

   Begitu setiap hasil punya alamat, baris ini jadi `<a>` atau
   `NuxtLink`, dan `cursor: pointer` plus hover-nya ikut
   ditambahkan saat itu — bukan sekarang.

   `cursor: default` ditulis supaya tidak ada bayangan bahwa
   baris ini bisa ditekan. */
.cari__baris {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  padding: 0.875rem 1rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  cursor: default;
}

/* Judul hasil.

   0.9375rem, bukan 0.8125rem seperti keterangan. Keterangan
   menjelaskan, judul yang menamai — jadi judul yang lebih besar dan
   lebih terang, keterangan yang lebih kecil dan lebih redup.
   Kalau ukurannya sama, keduanya jadi satu blok teks dan mata
   tidak tahu harus mulai dari mana. */
.cari__baris-judul {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Keterangan hasil.

   Dipangkas dua baris, bukan satu. Keterangan hasil pencarian
   sering memuat potongan kalimat yang panjang; dipangkan
   satu baris hampir selalu memotong di tengah kata.

   Dua baris cukup untuk memberi konteks tanpa membuat satu
   baris menentukan tinggi seluruh daftar. */
.cari__baris-ket {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}
</style>