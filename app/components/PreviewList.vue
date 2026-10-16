<script setup lang="ts">
/* Daftar klip: gambar 16:9, judul, dan keterangan episode/tanggal.
 *
 * Dipakai dua halaman — beranda menampilkan tiga baris, halaman
 * /running-man/preview menampilkan daftarnya penuh. Karena itu bentuknya
 * dibuat satu kali di sini: mengubah ukuran kotak, jarak, atau letak
 * lencana durasi cukup di berkas ini, dan kedua halaman ikut.
 *
 * Barisnya tautan ke halaman klip kita sendiri, bukan ke SBS. Halaman itu
 * yang memutar klipnya dan menyediakan tombol pembuka ke SBS — lihat
 * ./preview/[id].vue.
 *
 * Tanggal dan durasi diformat DI SINI, bukan di server. Server
 * mengirim tanggal dalam bentuk ISO dan durasi dalam detik; bentuk yang
 * dilihat orang bergantung pada bahasa yang sedang dibaca, dan kalau
 * dipatok di server, satu bahasa akan ikut terbaca di bahasa lain. */

import type { Klip } from '#shared/types/klip'

const localePath = useLocalePath()
const route = useRoute()

/* Urutannya diikutkan ke halaman klip.
 *
 * Tanpa ini, halaman klip selalu mencari judulnya di daftar Terbaru —
 * karena itu urutan yang dipakai kalau query-nya kosong. Terlama dan
 * Terpopuler jadi kehilangan judulnya, dan tombol "Semua klip" di sana
 * mengembalikan orang ke Terbaru, bukan ke urutan yang sedang dibacanya. */
const urutan = urutanKlip(route.query.urutan)

const props = defineProps<{
  /** Klip yang ditampilkan, urut dari atas. */
  daftar: Klip[]

  /**
   * Tinggi kotak daftarnya.
   *
   * - `daftar` (bawaan) — seluruh isinya ikut meninggi, dan yang
   *   menggulir adalah halamannya. Dipakai halaman daftar klip dan
   *   halaman satu klip, yang memang tempat orang menjelajah arsip.
   * - `gulir` — tinggi kotaknya dibatasi dan sisanya digulir DI DALAM
   *   kotak. Dipakai beranda, yang cuma perlu memperlihatkan beberapa
   *   klip terbaru tanpa mendorong bagian live jauh ke bawah.
   *
   * Bawaannya `daftar`, jadi halaman yang tidak mengirim properti ini
   * tidak berubah sama sekali. */
  bentuk?: 'daftar' | 'gulir'
}>()

/** Menitipkan klip yang diketuk ke halaman klip.
 *
 *  Yang dibawa cuma klipnya: judulnya untuk halaman berikutnya, dan
 *  tanggalnya untuk mencari tetangga di arsip. Tetangganya tidak lagi
 *  dihitung di sini — daftar ini bisa berisi klip acak, dan tetangga dari
 *  daftar acak bukan tetangga yang sebenarnya. Lihat `klipDiketuk`. */
function ketuk(satu: Klip) {
  klipDiketuk.value = satu
}
const { locale } = useI18n()

/* Pembuat format dibuat sekali per bahasa, bukan sekali per baris.
   `Intl.DateTimeFormat` itu mahal — ia turun ke data lokalitas setiap kali
   dibuat — dan daftar ini bisa dua puluh baris. */
const formatTanggal = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
)

/** Tanggal `2026-10-11` jadi "11 Oktober 2026".
 *
 *  `T00:00:00` sengaja ditambahkan. Tanpa itu, `new Date('2026-10-11')`
 *  ditafsirkan browser sebagai tengah malam UTC, dan di wilayah yang
 *  sehari lebih ke belakang tanggalnya bergeser ke 10. */
function tanggal(iso: string) {
  if (!iso) return ''

  return formatTanggal.value.format(new Date(`${iso}T00:00:00`))
}

/** Detik jadi `01:19`.
 *
 *  Dua digit di depan, bukan seperti `1:19`, karena inilah bentuk yang
 *  dipakai SBS sendiri dan yang lazim di daftar video. */
function durasi(detik: number) {
  const menit = Math.floor(detik / 60)
  const sisa = detik % 60

  return `${String(menit).padStart(2, '0')}:${String(sisa).padStart(2, '0')}`
}

/* Episode dan tanggal digabung jadi satu baris, dan salah satu boleh
   kosong. Episode ditulis lebih dulu karena itu yang sedang dicari orang,
   dan tanpa tanggal barisnya masih terbaca — bukan jadi setengah jadi. */
function keterangan(satu: Klip) {
  return [satu.episode, tanggal(satu.tanggal)].filter(Boolean).join(' · ')
}
</script>

<template>
  <ul class="pratinjau" :class="{ 'pratinjau--gulir': bentuk === 'gulir' }">
    <li v-for="(satu, posisi) in daftar" :key="satu.id">
      <!-- Objek dengan `name` dan `params`, bukan `localePath('nama', { id })`.
           Argumen kedua `localePath` adalah LOCALE, bukan params — mengirim
           objek ke sana menghasilkan tautan yang dirender tanpa `href`, dan
           barisnya jadi tidak bisa diklik tanpa error apa pun. -->
      <NuxtLink
        :to="localePath({
          name: 'running-man-preview-id',
          params: { id: satu.id },
          query: { urutan }
        })"
        class="pratinjau__baris"
        @click="ketuk(satu)"
      >
        <span class="pratinjau__thumb">
          <!-- `alt` kosong dengan sengaja: judulnya ada di sebelah kanan,
               jadi membacakan gambar hanya mengulang isi yang sudah
               terbaca. -->
          <img
            v-if="satu.gambar"
            :src="satu.gambar"
            alt=""
            loading="lazy"
            decoding="async"
            class="pratinjau__gambar"
          >
          <Icon v-else name="lucide:play" class="pratinjau__ikon" aria-hidden="true" />

          <!-- Tombol putar di tengah gambar, dan hanya muncul saat
               kursor mendekat. Tanda arah di kanan baris dulu yang
               mengerjakan tugas ini, tapi di layar sentuh tanda itu
               tidak pernah terbaca sebagai perintah — sementara tanda
               putar di atas gambar sudah dikenal orang dari daftar
               video mana pun.

               `aria-hidden` karena barisnya sudah punya label lengkap
               di tautannya, dan `@media (hover: hover)` yang menahan
               supaya di layar sentuh ia tidak macet menyala setelah
               diketuk. -->
          <span v-if="satu.gambar" class="pratinjau__main" aria-hidden="true">
            <Icon name="lucide:play" />
          </span>

          <!-- Lencana durasi di atas gambar, bukan di baris keterangan.
               Di sinilah letaknya di daftar video pada umumnya, dan
               meletakkannya di baris teks membuat baris itu penuh
               sementara informasinya justru paling mudah dibaca dari
               gambar. -->
          <span v-if="satu.detik" class="pratinjau__durasi">{{ durasi(satu.detik) }}</span>
        </span>

        <span class="pratinjau__isi">
          <span class="pratinjau__judul">{{ satu.judul }}</span>
          <span v-if="keterangan(satu)" class="pratinjau__keterangan">
            {{ keterangan(satu) }}
          </span>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
/* Daftar klip: satu kolom di layar sempit, dua di tablet, tiga di
 * laptop.
 *
 * Angkanya sama persis dengan daftar episode di
 * `pages/running-man/episode/index.vue`, dan itu bukan kebetulan:
 * keduanya daftar baris yang isinya thumbnail 16:9 plus satu-dua
 * baris teks, dan keduanya dibaca dengan mata yang menyapu ke bawah.
 * Kalau jumlah kolomnya berbeda, dua daftar yang isinya sebentuk
 * terlihat seperti dua komponen yang tidak berhubungan.
 *
 * Batasnya tiga. Pada lebar konten maksimum (72rem = 1152px) empat
 * kolom memberi 264px — thumbnail 96px menyisakan 154px untuk judul,
 * dan judul klip SBS jauh lebih panjang dari itu. */
.pratinjau {
  /* Jarak antar baris. Dipakai dua kali: oleh `gap` di bawah, dan oleh
   * hitungan tinggi kotak di bentuk `gulir`. Satu variabel supaya
   * keduanya tidak bisa berbeda — begitu jaraknya diubah di satu tempat
   * saja, batas kotaknya berhenti jatuh tepat di ujung kartu. */
  --jarak-baris: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: var(--jarak-baris);

  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

@media (min-width: 48rem) {
  .pratinjau {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--jarak-baris) 0.75rem;
  }
}

@media (min-width: 64rem) {
  .pratinjau {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* --- Bentuk gulir --------------------------------------------- */

/* Dipakai beranda: tinggi kotaknya dibatasi, dan sisanya digulir di
 * dalam kotaknya sendiri.
 *
 * Seperti apa yang terlihat mengikuti jumlah kolomnya, dan jumlah itu
 * tidak diubah di sini: satu kolom di HP jadi tiga kartu bertumpuk, dua
 * kolom di tablet jadi dua baris, tiga kolom di laptop jadi satu baris.
 * Jadi yang tampak tiga di HP dan di laptop, dan empat di tablet —
 * karena tiga kartu tidak bisa jatuh pas di ujung baris kalau satu
 * barisnya cuma memuat dua. Empat, bukan tiga, itu batas yang paling
 * dekat.
 *
 * **Tinggi barisnya dikunci di sini, dan itu syarat hitungan di
 * bawahnya.** `max-height` tidak bisa mengacu ke tinggi kartu yang
 * sedang dirender, jadi tinggi itu ditetapkan lebih dulu lewat
 * `--kartu`, lalu batas kotaknya dihitung darinya. Tanpa penguncian
 * itu, batasnya cuma tebakan yang akan meleset begitu judul klipnya
 * kebetulan lebih panjang. */
.pratinjau--gulir {
  /* Enam rem: dua baris judul (48px) + keterangan (21px) + jarak (4px)
   * + padding kartu (20px) = 93px, dan tiga piksel lebihnya jadi
   * cadangan kalau perangkat memakai metrik huruf yang sedikit
   * berbeda. */
  --kartu: 6rem;

  /* Bagian atas kartu berikutnya yang mengintip di bawah batas kotak.
   *
   * Ini yang memberi tahu orang bahwa di bawahnya masih ada isi — di
   * layar sentuh tidak ada scrollbar yang menetap, jadi tanpa intipan
   * ini kotaknya cuma terlihat seperti tiga kartu biasa yang kebetulan
   * terpotong rapi. */
  --intip: 1.25rem;

  /* Hitungannya N × (tinggi + jarak), BUKAN (N−1) × jarak. Kartu ke-N+1
   * mulai setelah N jarak: tiga kartu diikuti tiga jarak, bukan dua.
   * Salah satu angka saja, intipannya berhenti di dua belas piksel
   * sementara `--intip` menjanjikan dua puluh. */
  max-height: calc(3 * (var(--kartu) + var(--jarak-baris)) + var(--intip));

  overflow-y: auto;

  /* Roda mouse menggulir kotak ini dulu sampai mentok, lalu lanjut ke
   * halamannya. Itu perilaku bawaan (`overscroll-behavior: auto`), dan
   * di sini memang itu yang diinginkan — gulir yang tidak bisa keluar
   * dari kotaknya justru terasa seperti halaman yang nyangkut. Sengaja
   * tidak ada propertinya di sini, supaya tidak ada yang menambahkan
   * `contain` dengan maksud memperbaiki. */

  /* Scrollbar-nya disembunyikan, dan yang menandai kotak ini masih
   * punya isi adalah `--intip` di atas.
   *
   * Scrollbar yang dibiarkan tampil memakan 8–15px di tepi kanan
   * kotak, dan karena ia ada DI DALAM kotaknya, lebar kartunya ikut
   * menyempit dan tepi kanannya berhenti tidak segaris dengan tombol
   * "Lihat lebih banyak" di bawahnya. Kartu yang sama di halaman lain
   * lalu terlihat sedikit berbeda dari kartu di sini. */
  scrollbar-width: none;
}

.pratinjau--gulir::-webkit-scrollbar {
  display: none;
}

/* Tinggi kartunya dipaku, bukan `min-height`. Kalau boleh tumbuh,
 * batas kotak di atas tetap benar untuk kartu pertama dan mulai
 * meleset di kartu berikutnya.
 *
 * `flex-shrink: 0` wajib, dan ini jebakan yang tidak kelihatan dari
 * hasilnya: di layar sempit daftar ini flex kolom, dan flex item
 * MENYUSUT dulu sebelum kotaknya menggulir. Tanpa baris ini, limabelas
 * kartu itu muat semua di dalam kotak dengan cara mengecil — tidak ada
 * yang bisa digulir, dan batas tingginya cuma memotong kartunya sedikit.
 * Di layar lebar daftarnya grid, dan grid tidak menyusut, jadi gejalanya
 * cuma muncul di HP. */
.pratinjau--gulir > li {
  height: var(--kartu);
  flex-shrink: 0;
}

/* Batas kotaknya mengikuti jumlah BARIS, bukan jumlah kartu: tiga
 * baris di HP, dua di tablet, satu di laptop. */
@media (min-width: 48rem) {
  .pratinjau--gulir {
    max-height: calc(2 * (var(--kartu) + var(--jarak-baris)) + var(--intip));
  }
}

@media (min-width: 64rem) {
  .pratinjau--gulir {
    max-height: calc(var(--kartu) + var(--jarak-baris) + var(--intip));
  }
}

/* Keterangannya dipotong satu baris di bentuk `gulir`, dan itu harga
 * dari tinggi kartu yang dipaku di atas: judul boleh dua baris, tapi
 * begitu keterangannya ikut jadi dua baris, isinya melewati tinggi
 * kartunya — dan di situ teksnya mulai melimpah keluar garis kartu.
 *
 * Yang dipotong cuma di kotak beranda, dan hanya kalau memang panjang.
 * Di halaman klip, keterangan yang sama ditampilkan utuh. */
.pratinjau--gulir .pratinjau__keterangan {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
}

/* Barisnya sendiri (`li`) yang dilebarkan mengisi baris grid, bukan
 * tautannya lewat `height: 100%`. Persentase tinggi terhadap induk yang
 * tingginya belum pasti berhenti di lingkaran: tinggi `li` ditentukan
 * tautannya, sementara tinggi tautannya diminta 100% dari `li`. Grid
 * satu anak di sini memutus lingkaran itu. */
.pratinjau > li {
  display: grid;
}

/* Permukaannya ditulis sendiri, bukan memakai `.kartu`, karena `.kartu`
 * menyertakan `:hover` yang menebalkan garis. Di sini hover-nya sudah
 * punya arti sendiri: baris ini menuju halaman klip, dan yang menandai
 * arahnya adalah tombol putar di atas gambarnya.
 *
 * `color: inherit` menimpa aturan `a` global yang memberi warna aksen ke
 * semua tautan; warna teks di dalam baris ditentukan oleh kelasnya. */
.pratinjau__baris {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.875rem;
  align-items: center;

  padding: 0.625rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  color: inherit;
  text-decoration: none;

  transition: border-color var(--transisi), background var(--transisi);
}

.pratinjau__baris:hover {
  border-color: var(--garis-sedang);
  background: var(--latar-naik-3);
}

/* Lebarnya tetap, bukan ikut teks. Kalau ikut, baris berjudul panjang akan
   punya kotak yang lebih besar dari baris di atasnya, dan daftarnya jadi
   tidak rata. */
.pratinjau__thumb {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 6rem;
  aspect-ratio: 16 / 9;

  overflow: hidden;

  border-radius: var(--radius-sedang);
  background: var(--latar-naik-1);
  border: 1px solid var(--garis-halus);

  font-size: 1rem;
  color: var(--teks-lembut);
}

.pratinjau__gambar {
  width: 100%;
  height: 100%;
  object-fit: cover;

  /* Dibesarkan sedikit saat hover, bukan diskalakan seluruh barisnya:
     gerakan di dalam kotak thumbnail tidak menggeser tata letak
     tetangganya, sedangkan baris yang membesar akan membuat daftarnya
     bergoyang saat kursor bergerak turun. */
  transition: transform 200ms ease;
}

/* Tombol putar, muncul saat kursor mendekat.
 *
 * Ditaruh di dalam thumbnail, bukan di tumpukan terpisah, supaya
 * `overflow: hidden` di induknya yang memotongnya — tanpa itu, ikonnya
 * bisa menonjol keluar kotak gambar. */
.pratinjau__main {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgb(0 0 0 / 0.35);
  color: #fff;
  font-size: 1.5rem;

  opacity: 0;
  transition: opacity var(--transisi);
}

/* Hanya perangkat berkursor. Di layar sentuh tidak ada hover, dan
 * `:hover` di sana tetap menempel setelah diketuk — tombol putarnya
 * akan menyala terus di baris yang barusan dibuka. */
@media (hover: hover) {
  .pratinjau__baris:hover .pratinjau__main {
    opacity: 1;
  }

  .pratinjau__baris:hover .pratinjau__gambar {
    transform: scale(1.06);
  }
}

/* Fokus keyboard memakai penanda yang sama dengan hover, karena
 * orang yang berpindah dengan Tab tidak akan pernah melihat hover. */
.pratinjau__baris:focus-visible .pratinjau__main {
  opacity: 1;
}

/* Lencana durasi menumpuk di atas gambar, jadi posisinya diambil dari
   thumbnail, bukan dari kotak baris. */
.pratinjau__durasi {
  position: absolute;
  right: 0.25rem;
  bottom: 0.25rem;

  padding: 0.0625rem 0.25rem;
  border-radius: var(--radius-kecil);

  background: rgb(0 0 0 / 0.72);

  font-family: ui-monospace, "SF Mono", menlo, monospace;
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  color: #fff;
}

/* `min-width: 0` wajib: tanpa itu judul yang panjang menahan kolom grid
 * dan kotaknya terdorong ke luar baris. */
.pratinjau__isi {
  display: block;
  min-width: 0;
}

.pratinjau__judul {
  font-size: 0.9375rem;
  color: var(--teks-utama);

  /* Dua baris saja. Daftar ini dibaca cepat; judul yang mengambil tiga
     baris membuat barisnya jauh lebih tinggi dari tetangganya, dan
     daftarnya berhenti rata. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

/* Judul ikut berwarna aksen saat barisnya disorot, karena di layar
   sentuh penanda hover tidak pernah muncul — dan tanpa perubahan apa
   pun, barisnya terasa seperti permukaan yang tidak menuju ke mana. */
.pratinjau__baris:hover .pratinjau__judul {
  color: var(--teks-aksen);
}

.pratinjau__keterangan {
  display: block;

  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--teks-lembut);
}

/* --- Gerak --------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  .pratinjau__baris,
  .pratinjau__gambar,
  .pratinjau__main {
    transition: none;
  }
}
</style>