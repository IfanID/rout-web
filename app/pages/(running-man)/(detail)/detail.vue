<script setup lang="ts">
/* Informasi acara Running Man: apa acaranya, kapan tayang, dan
 * angkanya.
 *
 *   /running-man   beranda — kapan tayang
 *   /detail        halaman ini
 *
 * Yang tidak ada di sini: daftar episode. Itu menjawab pertanyaan
 * lain — "episode mana yang sudah tayang" — dan punya halamannya
 * sendiri di ../episode/index.vue. Dicampur, halaman yang isinya
 * menjelaskan acara terasa seperti halaman arsip.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Running Man". Nama
 * acara dari Korea Selatan itu bukan brand Rout dan bukan teks yang
 * perlu diterjemahkan, sama seperti di useMiddleSlot.ts.
 *
 * Beralamat `/detail` dan bernama `detail`. Keduanya sama karena file
 * ini diletakkan di dua route group bersarang, `(running-man)/(detail)/`:
 * keduanya diabaikan saat menyusun URL, dan ikut hilang dari nama route
 * tanpa sisa.
 *
 * Kalau salah satu folder itu dilepas — jadi `detail/detail.vue` —
 * URL-nya berubah jadi `/detail/detail` sementara nama route tetap
 * `detail`. Keduanya dibaca dari tempat berbeda, jadi yang satu tidak
 * bisa dipakai untuk menyebut yang lain, dan keduanya harus dicek
 * terpisah di useMiddleSlot.ts.
 *
 * Yang tetap tidak bisa dilakukan: menaruh file ini satu level lebih
 * dalam, di `(running-man)/running-man/detail.vue`. Route
 * `/running-man/detail` memang terbentuk dengan nama yang benar, tapi
 * yang dirender adalah beranda — `running-man.vue` dan folder
 * `running-man/` berdiri di direktori yang sama dengan nama yang sama,
 * lalu Nuxt menyatukan keduanya. Terlihat seperti route rusak padahal
 * semua URL-nya bisa dibuka.
 *
 * Karena halaman ini tidak ada di bawah `/running-man`, tetesan navbar
 * tidak bisa mewarisi lewat path. Hubungannya dinyatakan lewat kolom
 * `dalam` di useMiddleSlot.ts — lihat catatan fungsi `milik` di
 * BottomNav.vue. */

const { acara, jadwal, berikutnya, tentang, statistik } = useRunningMan()

const localePath = useLocalePath()
</script>

<template>
  <main class="konten detail">
    <!-- Kembali ke beranda. Satu-satunya tautan di halaman ini.

         Berdiri di atas judul, bukan di bawahnya: tuannya kembali ke
         beranda, jadi posisinya paling dekat dengan tempat orang
         pertama kali melihat halaman ini. -->
    <NuxtLink :to="localePath('running-man')" class="detail__kembali">
      <Icon name="lucide:arrow-left" class="detail__kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <h1 class="konten__judul">Running Man</h1>

    <p class="konten__sub">
      Jadwal tayang, tentang acara, dan statistiknya.
    </p>

    <!-- ===== Kartu acara ======================================= -->

    <section class="kartu acara">
      <!-- Mark huruf, belum ada poster resmi. `aria-hidden` karena
           h1 di atas sudah menyebut nama acaranya — membacakannya
           sekali lagi hanya menambah kebisingan. -->
      <span class="acara__mark" aria-hidden="true">{{ acara.huruf }}</span>

      <div class="acara__data">
        <!-- Nama asli Korea, bukan "Running Man". H1 sudah menyebut
             nama yang dikenal orang, jadi yang menambah informasi di
             sini justru nama resminya — bukan pengulangan. -->
        <h2 class="acara__nama">{{ acara.namaAsli }}</h2>
        <p class="acara__jenis">{{ acara.jenis }}</p>

        <!-- Status "Tayang" memakai warna status, bukan aksen. "Tayang"
             itu kondisi acara, bukan hiasan, dan warna status sudah
             ada persis untuk ini.

             Badge kedua sengaja tidak ada. Kalau suatu saat butuh dua
             tanda sekaligus, warna kedua bisa dipakai tanpa membuat
             kelas baru. -->
        <div class="acara__tanda">
          <span class="badge badge--sukses">{{ acara.status }}</span>
        </div>
      </div>

      <ul class="meta">
        <li v-for="(satu, id) in acara.meta" :key="id" class="meta__butir">
          <Icon :name="satu.ikon" class="meta__ikon" aria-hidden="true" />
          {{ satu.nilai }}
        </li>
      </ul>
    </section>

    <!-- ===== Jadwal tayang ====================================== -->

    <section id="siaran-berikutnya" class="bagian">
      <h2 class="bagian__judul">Jadwal tayang</h2>

      <div class="kartu jadwal">
        <!-- Episode berikutnya naik lebih dulu, sebelum pola tetap.
             Orang yang membuka halaman jadwal hampir selalu mencari
             satu ini dulu; pola mingguan ada untuk melengkapinya. -->
        <div class="jadwal__berikutnya">
          <p class="label jadwal__label">Siaran berikutnya</p>
          <p class="jadwal__episode">Episode {{ berikutnya.nomor }}</p>
          <p class="jadwal__waktu">
            {{ berikutnya.hari }} · {{ berikutnya.jam }}
          </p>
        </div>

        <!-- Pola tetap. Satu baris = satu pasang ikon, label, dan
             nilai.

             Ikon di depan label bukan hiasan: jadwal ini dibaca
             berulang, jadi ikon membuat orang mengenali barisnya
             tanpa harus membaca katanya dulu — "jam" dan
             "hari" bisa tertukar di layar sempit kalau semuanya cuma
             teks. Nilai rata kanan dan dipisahkan oleh
             space-between, jadi yang dibandingkan tidak perlu
             dicocokkan dengan mata. -->
        <ul class="jadwal__tetap">
          <li v-for="(satu, id) in jadwal" :key="id" class="jadwal__baris">
            <span class="jadwal__baris-nama">
              <Icon :name="satu.ikon" class="jadwal__ikon" aria-hidden="true" />
              {{ satu.label }}
            </span>
            <span class="jadwal__baris-nilai">{{ satu.nilai }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ===== Tentang acara ====================================== -->

    <section id="tentang" class="bagian">
      <h2 class="bagian__judul">Tentang acara</h2>

      <div class="kartu ringkas">
        <p class="ringkas__teks">{{ tentang.ringkas }}</p>

        <ul class="meta">
          <li v-for="(satu, id) in tentang.meta" :key="id" class="meta__butir">
            <Icon :name="satu.ikon" class="meta__ikon" aria-hidden="true" />
            {{ satu.nilai }}
          </li>
        </ul>
      </div>
    </section>

    <!-- ===== Statistik ========================================= -->

    <section id="statistik" class="bagian">
      <h2 class="bagian__judul">Statistik</h2>

      <ul class="statistik">
        <li v-for="(satu, id) in statistik" :key="id" class="kartu statistik__butir">
          <Icon :name="satu.ikon" class="statistik__ikon" aria-hidden="true" />
          <span class="statistik__nilai">{{ satu.nilai }}</span>
          <span class="statistik__label">{{ satu.label }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. */
.detail {
  padding-bottom: 10rem;
}

/* Beranda melompat ke section lewat anchor, jadi section yang punya
 * `id` perlu ruang ekstra di atasnya. Tanpa ini, begitu lompat ke
 * `#statistik`, judul bagian itu berhenti tepat di belakang header.
 *
 * Header memakai `position: sticky`, bukan `fixed`. Bedanya di sini:
 * `sticky` masih menyisakan ruang di tempatnya di dalam aliran, jadi
 * konten di bawahnya tergeser ke bawah header — sementara lompatan
 * anchor justru membuat elemen tujuan berhenti tepat di tepi atas
 * viewport, yaitu persis di tempat header itu berada. */
[id] {
  scroll-margin-top: 3.5rem;
}

/* --- Kembali ------------------------------------------------- */

/* Punya kelas sendiri, bukan `.meta` dari main.css, karena ini
 * tautan dan perlu `font-weight` serta warna tautan — dua hal yang
 * tidak boleh ikut pada daftar keterangan yang tidak bisa ditekan. */
.detail__kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.detail__kembali-ikon {
  font-size: 1rem;
}

/* --- Kartu di halaman ini ------------------------------------ */

/* Kartu di halaman ini tidak bisa diklik ke mana pun, tapi `.kartu`
 * dari main.css mengubah warna garis saat hover. Hover itu sinyal
 * "ini punya tujuan", dan di sini tidak ada tujuan.
 *
 * Ditulis sebagai satu selector berumpun, bukan aturan terpisah per
 * kartu. Empat aturan yang isinya sama persis adalah tempat di mana
 * ketiganya akan mulai berbeda sendiri nanti. */
.acara:hover,
.jadwal:hover,
.ringkas:hover,
.statistik__butir:hover {
  border-color: var(--garis-halus);
}

/* --- Kartu acara --------------------------------------------- */

/* `flex-wrap` dipakai supaya daftar keterangan turun ke baris sendiri
 * di layar sempit. Kolom data di samping mark tetap di baris pertama,
 * jadi saat baris ketiga turun, kolom yang isinya cuma dua kalimat
 * tidak ikut meninggi.
 *
 * `min-width: 0` pada kolom data itu penting: tanpa itu, teks panjang
 * menahan baris flex dan mark terdorong ke baris bawah maupun di
 * layar yang sebenarnya cukup lebar. */
.acara {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;

  margin-top: 2rem;
  padding: 1.75rem;
}

/* Mark huruf. Bentuk dan tipografinya sama persis dengan
 * `.tayang__mark` di beranda — keduanya adalah huruf yang sama,
 * sehingga satu ukuran untuk keduanya lebih jujur daripada
 * sengaja dibuat berbeda. */
.acara__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-besar);

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  /* `line-height: 1` wajib, sama seperti di SlotMark: elemen induk
     mewarisi line-height 1.6 dari body, dan tanpa baris ini huruf
     duduk beberapa piksel lebih rendah dari tengah kotaknya. */
  font-size: 2rem;
  line-height: 1;
  color: var(--teks-aksen);
}

.acara__data {
  min-width: 0;
  flex: 1 1 12rem;
}

.acara__nama {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--teks-utama);
}

.acara__jenis {
  margin-top: 0.125rem;
  font-size: 0.875rem;
  color: var(--teks-lembut);
}

.acara__tanda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

/* --- Jadwal tayang -------------------------------------------- */

/* Padding kartu dikosongkan, karena dua bagian di dalamnya masing-
 * masing menentukan paddingnya sendiri. Kalau padding kartu
 * dibiarkan, dua bagian itu tidak akan bisa menempel pada garis
 * pemisah — pemisah selalu penuh selebar kartu, sementara isi di
 * dalamnya menyempit selebar kartu juga, dan jaraknya jadi tidak
 * seragam. */
.jadwal {
  padding: 0;
}

/* Dua bagian dalam satu kartu dipisah satu garis rambut, bukan dua
 * permukaan. Dua kartu yang ditumpuk akan terlihat seperti dua hal
 * terpisah, padahal keduanya bagian dari satu jadwal. */
.jadwal__berikutnya {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--garis-halus);
}

/* Jarak ke bawah label milik pemanggil, bukan milik `.label`
 * di main.css — makanya ditulis di sini dan bukan di sana. */
.jadwal__label {
  margin-bottom: 0.375rem;
}

/* Nomor episode. Warna aksen karena ini angka, bukan kalimat —
 * sama seperti angka level di (profile)/profile.vue. */
.jadwal__episode {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--teks-aksen);
  font-variant-numeric: tabular-nums;
}

/* Waktu tayang. Kalimat, jadi warna teks sekunder — bukan warna
 * aksen yang dipakai untuk angka di atasnya. */
.jadwal__waktu {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}

.jadwal__tetap {
  margin: 0;
  padding: 0;
  list-style: none;
}

.jadwal__baris {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;

  padding: 0.75rem 1.5rem;

  font-size: 0.875rem;
}

/* Garis pemisah antar baris pakai `border-top` pada baris kedua dan
 * seterusnya, bukan pada semua baris. Kalau dipakai di semua, garis
 * pertama akan menggantung di tepi atas kartu dan terlihat seperti
 * sisa garis kartu. */
.jadwal__baris + .jadwal__baris {
  border-top: 1px solid var(--garis-halus);
}

.jadwal__baris-nama {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  color: var(--teks-sekunder);
}

.jadwal__ikon {
  font-size: 1rem;
}

.jadwal__baris-nilai {
  font-weight: 500;
  color: var(--teks-utama);
  text-align: right;
}

/* --- Tentang acara -------------------------------------------- */

.ringkas {
  padding: 1.75rem;
}

/* Batas lebar baris. Tanpa itu, paragrafnya memenuhi 72rem dan
 * setiap barisnya jadi terlalu panjang untuk dibaca tanpa
 * memutar kepala — di layar lebar, memutar kepala ke kiri dan ke kanan
 * lebih banyak dari yang perlu.

 * Dipakai `max-width` pada teks, bukan pada kartunya: kartunya tetap
 * lebar penuh supaya permukaannya seragam dengan kartu lain, dan
 * yang berhenti melebar hanya baris kata-kata. */
.ringkas__teks {
  max-width: 42rem;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--teks-sekunder);
}

/* Garis pemisah sebelum daftar keterangan, supaya dua kelompok
 * informasi di kartu ini tidak menyatu jadi satu paragraf panjang.
 * `margin-top` menulis jarak dari paragraf, bukan `padding-top`,
 * supaya kartu ikut menyusut kalau paragrafnya hilang nanti. */
.ringkas .meta {
  padding-top: 0.875rem;
  border-top: 1px solid var(--garis-halus);
}

/* --- Statistik ------------------------------------------------ */

/* auto-fit, bukan empat kolom tetap. Di layar sempit kolom ketiga
 * menyempit sampai angkanya mulai turun baris, sementara dua kolom
 * masih muat dengan lebar yang sama. Pola ini sama persis dengan
 * yang dipakai di (profile)/profile.vue. */
.statistik {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: 0.75rem;

  margin: 0;
  padding: 0;
  list-style: none;
}

.statistik__butir {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1rem;
}

.statistik__ikon {
  font-size: 1.125rem;
  color: var(--teks-lembut);
}

.statistik__nilai {
  margin-top: 0.625rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--teks-aksen);
  /* Angka yang berubah-ubah tidak boleh geser lebarnya sendiri,
     sehingga rata kiri kolom yang sebelahnya ikut bergerak. */
  font-variant-numeric: tabular-nums;
}

.statistik__label {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}
</style>