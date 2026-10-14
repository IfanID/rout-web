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
  <ul class="pratinjau">
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
/* Jarak antar baris 0.5rem, sama seperti daftar episode. Isinya dibaca
 * cepat dan beruntun, bukan satu per satu, jadi jarak yang terlalu
 * renggang membuat daftar terasa terpisah padahal isinya satu daftar. */
.pratinjau {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

/* Permukaannya ditulis sendiri, bukan memakai `.kartu`, karena `.kartu`
 * menyertakan `:hover` yang menebalkan garis. Di sini hover-nya sudah
 * punya arti sendiri: baris ini menuju halaman klip, dan arahnya sudah
 * jelas dari tanda panah di kanan.
 *
 * `color: inherit` menimpa aturan `a` global yang memberi warna aksen ke
 * semua tautan; warna teks di dalam baris ditentukan oleh kelasnya. */
.pratinjau__baris {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.875rem;
  align-items: center;

  padding: 0.75rem;

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

.pratinjau__keterangan {
  display: block;

  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--teks-lembut);
}
</style>