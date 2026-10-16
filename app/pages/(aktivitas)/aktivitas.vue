<script setup lang="ts">
/* Halaman riwayat aktivitas: seluruh daftar peristiwa yang pernah diumumkan
 * ke orang di peramban ini.
 *
 *   /aktivitas              halaman ini
 *
 * Berkasnya `aktivitas.vue` di dalam folder berkurung, bukan
 * `aktivitas/aktivitas.vue` dan bukan `aktivitas.vue` sendirian. Alasannya
 * persis seperti `(profile)/profile.vue`: berkas dan folder tidak boleh
 * bernama sama, karena kalau keduanya berdiri bersama, route di bawah folder
 * itu menjadi CHILD dari route berkas itu — dan child hanya tampil lewat
 * `<router-view>` milik parent. Gejalanya bukan 404 dan bukan peringatan di
 * console, melainkan isi halaman lain yang muncul diam-diam.
 *
 * Halaman ini yang menandai semua aktivitas terbaca. Bukan halaman beranda
 * dan bukan panel lonceng: yang keduanya perlihat cuma ringkasan, dan badge
 * yang langsung hilang begitu rangkumannya terlihat tidak memberi tahu
 * apa-apa. Di sini daftar penuhnya benar-benar terbaca, jadi di sinilah
 * waktunya badge dilepas.
 *
 * Yang disimpan di peramban adalah kunci locale dan parameternya, bukan
 * kalimat jadi — jadi seluruh baris di bawah ikut berubah bahasa mengikuti
 * yang sedang dibaca. Lihat `useAktivitas.ts`.
 *
 * Teksnya lewat `t()`. Yang ditulis apa adanya di sini cuma tidak ada —
 * semua kalimatnya sudah jadi, jadi tidak ada teks sementara yang perlu
 * menunggu teks aslinya. */

const { t, locale } = useI18n()

const { daftar, siap, tandaiSemua, kosongkan } = useAktivitas()

/* Berapa entri yang ada di daftar. Dihitung di sini, bukan ditulis langsung
 * di template, supaya `v-if` dan kalimatnya membaca angka yang sama. */
const RINGKAS = computed(() => daftar.value.length)

const formatWaktu = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
)

function waktu(pada: number) {
  return formatWaktu.value.format(new Date(pada))
}

/* Penandaan dilakukan saat halaman terpasang, bukan saat daftarnya dirender.
 *
 * Kalau ikut dilakukan di `onMounted` blok yang sama dengan pembacaannya,
 * urutannya menjadi "tandai dulu, baru baca" — dan `muat()` di
 * `useAktivitas.ts` akan menulis ulang state dengan isi yang baru di-tandai,
 * mengembalikan semuanya jadi belum terbaca. Dua hal yang satu arahnya
 * tidak boleh dibalik: menandai hanya setelah isinya benar-benar ada. */
onMounted(() => {
  tandaiSemua()
})
</script>

<template>
  <main class="konten aktivitas">
    <h1 class="konten__judul">{{ t('nav.aktivitas') }}</h1>

    <!-- Jumlah entri. disembunyikan kalau daftarnya kosong: judul "0
         aktivitas" di atas keadaan kosong hanya mengulang keadaan itu. -->
    <p v-if="RINGKAS > 0" class="hitung aktivitas__rekap">
      <Icon name="lucide:activity" class="hitung__ikon" aria-hidden="true" />
      <span class="hitung__angka">{{ RINGKAS }}</span>
      {{ t('aktivitas.jumlah') }}
    </p>

    <!-- Daftar dirender hanya setelah `siap`. `localStorage` dibaca di
         `onMounted`, jadi di server daftar selalu kosong — merendarnya
         sebelum isinya ada berarti hasil render server dan browser berbeda,
         dan Vue mencatat error hydration. -->
    <template v-if="siap">
      <ul v-if="daftar.length" class="aktivitas__daftar">
        <li v-for="satu in daftar" :key="satu.id" class="aktivitas__baris">
          <span
            class="aktivitas__titik"
            :class="{ 'aktivitas__titik--baru': !satu.dibaca }"
            aria-hidden="true"
          />

          <span class="aktivitas__isi">
            <span class="aktivitas__pesan">{{ t(satu.kunci, satu.param) }}</span>
            <time class="aktivitas__waktu" :datetime="new Date(satu.pada).toISOString()">
              {{ waktu(satu.pada) }}
            </time>
          </span>
        </li>
      </ul>

      <p v-else class="aktivitas__kosong">
        {{ t('aktivitas.kosong') }}
      </p>

      <!-- Menghapus hanya ditampilkan kalau ada isinya. Tombol hapus untuk
           daftar kosong adalah tombol yang tidak melakukan apa pun. -->
      <button
        v-if="daftar.length"
        type="button"
        class="tombol tombol--sekunder aktivitas__hapus"
        @click="kosongkan"
      >
        {{ t('aktivitas.kosongkan') }}
      </button>
    </template>
  </main>
</template>

<style scoped>
/* Bawaan `.konten` cuma 4rem di bawah, sedangkan navbar bawah tetap 72px
 * ditambah env(safe-area-inset-bottom). Tanpa ini konten terakhir tertutup
 * navbar. Sama seperti di halaman lain yang pakai navbar. */
.aktivitas {
  padding-bottom: 10rem;
}

.aktivitas__rekap {
  margin-top: 1rem;
}

/* --- Daftar ------------------------------------------------------ */

.aktivitas__daftar {
  margin: 2rem 0 0;
  padding: 0;
  list-style: none;
}

.aktivitas__baris {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  padding-block: 0.875rem;
}

.aktivitas__baris + .aktivitas__baris {
  border-top: 1px solid var(--garis-halus);
}

.aktivitas__titik {
  flex-shrink: 0;

  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.5rem;

  background: var(--garis-sedang);
  border-radius: 999px;
}

.aktivitas__titik--baru {
  background: var(--aksen-indikator);
}

/* `min-width: 0` supaya kalimat panjang membungkus, bukan mendorong
 * waktunya ke luar baris. */
.aktivitas__isi {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  min-width: 0;
}

.aktivitas__pesan {
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Waktu tidak pernah jadi informasi utama: pesannya yang dicari, dan
 * waktunya cuma penanda kapan itu terjadi. `tabular-nums` menjaga
 * posisinya tetap di baris-baris yang angkanya berbeda. */
.aktivitas__waktu {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--teks-lembut);
}

.aktivitas__kosong {
  margin-top: 2rem;

  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--teks-lembut);
}

.aktivitas__hapus {
  margin-top: 2rem;
}
</style>