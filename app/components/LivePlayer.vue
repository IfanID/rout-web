<script setup lang="ts">
/* Pemutar live YouTube.
 *
 * Bingkainya ada sejak halaman dibuka, bukan menunggu tombol ditekan.
 * Bingkai YouTube menarik script-nya sendiri (sekitar 1 MB), jadi
 * halaman ini sudah membayarnya sejak dibuka — termasuk saat live-nya
 * sedang kosong. Itu yang ditukar dengan tayangannya: orang tidak
 * perlu mencari tombol dulu.
 *
 * Player-nya milik YouTube, di dalam bingkai. Tidak bisa diputar dari
 * sini seperti ClipPlayer yang memakai HLS: alamat streaming YouTube
 * hanya ada di balik API yang butuh kunci, dan live stream tidak punya
 * playlist publik yang bisa dibaca.
 *
 * Dipakai di /running-man, alamatnya dari .env — lihat
 * NUXT_PUBLIC_YOUTUBE_LIVE di nuxt.config.ts.
 *
 * Berbeda dari ClipPlayer yang menanyakan alamatnya ke endpoint SBS
 * saat diputar: alamat player di sini bisa diketahui dari depan, jadi
 * tidak ada alasan menanyakannya lebih dulu. */

const props = withDefaults(defineProps<{
  /** Alamat live dari .env: id video polos atau alamat youtube.com. */
  sumber: string
  /** Nama yang dibacakan pembaca layar, sekaligus judul bingkainya. */
  judul?: string
}>(), {
  judul: 'Tayangan langsung di YouTube'
})

/** Bentuk id video YouTube: 11 karakter huruf, angka, tanda hubung, atau
 *  garis bawah. Tidak ada bentuk lain, jadi pola ini cukup untuk
 *  membedakan id dari kata biasa. */
const BENTUK_ID = /^[\w-]{11}$/

/** Id video dari apa pun yang ditempel ke .env.
 *
 *  Bentuk yang diterima sengaja banyak, karena begitulah bentuk yang
 *  keluar dari tombol Bagikan YouTube: `watch?v=`, `live/`, `shorts/`,
 *  `youtu.be/`, `embed/`, atau id polos `d8OvbUAxaec`. Kalau yang
 *  diminta hanya id, menyalin tautannya jadi langkah manual yang
 *  selalu gagal di saat paling tidak sempat dicek — dan yang gagal di
 *  sini tidak error, hanya bingkai yang tidak pernah memutar apa pun.
 *
 *  `v=` dibaca lebih dulu karena `watch?v=` menaruh id-nya di query,
 *  sedangkan bentuk lain menaruhnya di jalur. Jalur yang diambil adalah
 *  segmen terakhir yang tidak kosong, jadi `/live/<id>` dan
 *  `/live/<id>/` sama-sama benar.
 *
 *  Hasilnya tetap diperiksa dengan BENTUK_ID, karena segmen terakhir
 *  bukan selalu id: `youtube.com/live/` berakhir di kata `live`, dan
 *  kalau dipakai apa adanya menghasilkan bingkai yang memutar video
 *  dengan id `live` — bingkai yang muncul tapi tidak pernah
 *  menjalankan apa pun. Yang lebih buruk dari tidak tampil. */
function ambilId(nilai: string) {
  const teks = nilai.trim()

  /* Tanpa garis miring itu bukan URL, jadi isinya sudah berupa id. */
  if (!teks.includes('/')) return BENTUK_ID.test(teks) ? teks : ''

  try {
    /* Protokol ditambahkan kalau belum ada: menyalin dari kolom
       alamat sering ikut membuang `https://`, dan `new URL` menolak
       alamat tanpa skema — bukan karena isinya salah, tapi karena
       bentuknya. */
    const alamat = new URL(teks.startsWith('http') ? teks : `https://${teks}`)
    const calon = alamat.searchParams.get('v') ?? alamat.pathname.split('/').filter(Boolean).pop() ?? ''

    return BENTUK_ID.test(calon) ? calon : ''
  } catch {
    return ''
  }
}

const id = computed(() => ambilId(props.sumber))

/* `youtube-nocookie`, bukan `youtube.com`: player-nya sama, tapi
 * cookienya tidak ikut dipasang sejak halaman dibuka. Di halaman yang
 * isinya klip dari SBS, itu satu cookie yang tidak perlu ada.
 *
 * `mute=1` bukan pilihan selera: peramban hanya mengizinkan pemutaran
 * otomatis yang tanpa suara, jadi tanpa parameter ini tayangannya tidak
 * mulai sendiri sama sekali. `playsinline` gunanya sama di iPhone,
 * yang kalau tidak akan membuka video penuh layar begitu dimulai.
 * Suaranya dinyalakan orang lewat ikon suara milik player YouTube —
 * makanya catatan kecil di bawah pemutar. */
const alamatPemutar = computed(
  () => `https://www.youtube-nocookie.com/embed/${id.value}?autoplay=1&mute=1&rel=0&playsinline=1`
)

/* Halaman tontonan di YouTube, bukan bingkainya.
 *
 * Ini bukan pelengkap: bingkai bisa gagal karena pemilik channel
 * melarang embed, dan orang yang datang mengira tayangannya rusak.
 * Satu tautan ke aslinya memastikan selalu ada jalan keluar — dan di
 * YouTube juga kelihatan apakah acaranya sedang jalan atau tidak,
 * yang tidak bisa diketahui dari sini.
 *
 * `target` dan `rel` wajib: tanpa `rel="noopener"`, halaman yang dibuka
 * bisa membaca `window.opener` milik halaman ini. */
const tautanNonton = computed(() => `https://www.youtube.com/watch?v=${id.value}`)
</script>

<template>
  <div class="live">
    <div class="live__layar">
      <!-- Bingkainya memang dibiarkan memuat sendiri. Menahannya sampai
           diklik akan menghemat script-nya, tapi itu kebalikan dari yang
           halaman ini butuhkan: orang yang membuka halaman ini sedang
           mencari tayangannya, dan sisanya di bawah tetap bisa dibaca
           tanpa menutup apa pun. -->
      <iframe
        v-if="id"
        class="live__bingkai"
        :src="alamatPemutar"
        :title="judul"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />

      <!-- Alamatnya ada tapi tidak terbaca. Ini jawaban dari .env yang
           salah, dan orang yang mengisinya perlu melihatnya — jadi
           pesannya ditulis, bukan disembunyikan jadi kotak kosong. -->
      <p v-else class="live__pesan" role="status">
        Alamat live-nya belum bisa dibaca.
      </p>
    </div>

    <!-- Baris di bawah player: satu kalimat dan satu tautan. Sengaja
         tidak ikut jadi kepala bagian — judulnya sudah ada di atasnya,
         dan dua baris teks di bawah video membuat video terasa seperti
         salah satu dari beberapa bagian halaman, bukan centerpiece-nya.
         -->
    <div v-if="id" class="live__bawah">
      <p class="live__catatan">
        Mulai tanpa suara. Nyalakan lewat ikon suara di pojok player.
      </p>

      <a
        class="live__buka"
        :href="tautanNonton"
        target="_blank"
        rel="noopener noreferrer"
      >
        Buka di YouTube
        <Icon name="lucide:external-link" class="live__buka-ikon" aria-hidden="true" />
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Permukaannya ditulis sendiri, bukan memakai `.kartu`: yang di dalam
 * kotak ini video, bukan teks, dan padding kartu tidak punya isinya.
 * Yang dipakai dari `.kartu` cuma bentuk sudutnya. */
.live__layar {
  position: relative;

  aspect-ratio: 16 / 9;
  overflow: hidden;

  border-radius: var(--radius-besar);
  background: var(--latar-naik-1);
  border: 1px solid var(--garis-halus);

  /* Satu-satunya tempat di halaman ini yang memakai bayangan. Video
     adalah satu-satunya isi yang benar-benar bergerak, jadi ia juga
     satu-satunya yang terasa punya tinggi — dan bloknya yang paling
     besar, sehingga tanpa bayangan tepinya ikut hilang di layar
     gelap. */
  box-shadow: var(--bayang-panel);
}

/* Bingkai mengisi seluruh kotak, bukan setinggi isinya. Tanpa itu
 * video memakai tinggi bawaannya sendiri dan membiarkan garis bawah
 * kotak yang terisi sepenuhnya — yang terlihat seperti pemutar yang
 * belum selesai dimuat. */
.live__bingkai {
  display: block;

  width: 100%;
  height: 100%;
  border: 0;
}

/* Di tengah-tengah, bukan menempel di bawah. Yang perlu kelihatan di
 * keadaan ini hanya tulisannya: tidak ada video yang harus dijaga
 * ukurannya seperti di ClipPlayer. */
.live__pesan {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  margin: 0;
  padding: 1rem;

  text-align: center;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}

/* Catatan kiri, tautan kanan. `margin-left: auto` pada tautannya yang
 * mendorongnya ke kanan, dan karena `flex-wrap` yang menentukan kapan
 * keduanya turun, tautan yang turun tetap mulai dari kiri — bukan
 * menggantung di kanan baris yang sendirian. */
.live__bawah {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;

  margin-top: 0.75rem;
}

.live__catatan {
  margin: 0;

  font-size: 0.8125rem;
  color: var(--teks-lembut);
}

/* Punya `font-weight` sendiri, bukan mewarisi aturan `a` global yang
 * hanya memberi warna. Yang membuat tautan ini terbaca sebagai
 * perintah — bukan keterangan yang kebetulan berwarna — adalah
 * bobot hurufnya; warnanya sudah jelas dari `a` di main.css. */
.live__buka {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  margin-left: auto;

  font-size: 0.8125rem;
  font-weight: 500;
}

/* Ikon ikut ukuran teksnya, supaya tidak terlihat lebih besar dari
 * kata di sebelahnya. Kelasnya diletakkan di <Icon> itu sendiri,
 * bukan lewat :deep(svg) — @nuxt/icon merender ikon sebagai
 * <span class="iconify">, bukan elemen <svg>. */
.live__buka-ikon {
  font-size: 0.875rem;
}
</style>
