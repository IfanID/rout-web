<script setup lang="ts">
/* Satu klip Running Man.
 *
 *   /running-man              beranda — klip terbaru dalam kotak yang bisa digulir
 *   /running-man/preview      daftar seluruh klip
 *   /running-man/preview/:id  halaman ini
 *
 * Nama route-nya `running-man-preview-id`, dan `id` di URL memang punya
 * arti: itu id klip dari SBS, bukan nomor urut milik kita.
 *
 * Halaman ini TIDAK bergantung pada daftar untuk memutar. Alamat SBS-nya
 * dibentuk dari id, jadi klip mana pun bisa dibuka — termasuk yang belum
 * pernah dimuat daftarnya. Daftar cuma dipakai untuk dua hal yang memang
 * hanya ada di sana: judul klip, dan klip mana yang ada di sebelahnya.
 *
 * Yang diputar BUKAN video milik kita.
 *
 * Videonya diputar oleh ClipPlayer di halaman ini, bukan dipasang lewat
 * bingkai SBS — sebabnya ada di catatan ClipPlayer.vue. Stream-nya tetap
 * diambil dari server mereka, dan alamatnya kedaluwarsa dalam dua jam,
 * jadi ia diminta ulang setiap kali halaman ini dibuka.
 *
 * Tombol "Buka di SBS" di bawahnya bukan pelengkap. Membuka alamat stream
 * dari sini bisa berhenti bekerja sewaktu-waktu — SBS cukup menutup
 * endpoint `preview`-nya — dan saat itu terjadi, tombol ini yang jadi
 * satu-satunya jalan. Karena itu ia tidak pernah disembunyikan. */

const route = useRoute()
const localePath = useLocalePath()

/* Id dibaca sebagai computed, bukan sekali di awal, karena berpindah dari
 * satu klip ke klip lain itu route yang sama dengan parameter berbeda:
 * komponennya dipakai ulang dan `<script setup>` tidak dijalankan lagi.
 * Semua yang diturunkan dari id ikut jadi computed karena alasan yang
 * sama. */
const id = computed(() => String(route.params.id ?? ''))

/* Id yang jelas bukan id klip ditolak lebih awal. Bentuknya huruf dan
 * angka — `OC482018137`, `22000110564` — jadi itu yang diterima.
 *
 * Selain bentuk itu, tidak ada pemeriksaan keberadaan: apakah klipnya
 * masih ada atau sudah turun, SBS yang menjawab saat ClipPlayer meminta
 * alamat stream-nya. Menebaknya di sini berarti menolak klip yang
 * sebenarnya bisa diputar. */
if (!/^[A-Za-z0-9]{4,}$/.test(id.value)) {
  throw createError({
    statusCode: 404,
    statusMessage: `Klip ${id.value} bukan id yang sah`
  })
}

/* Bagian "Klip lain": lima belas baris dengan susunan yang tetap.
 *
 *   1      klip terbaru
 *   2      klip di atas klip yang ditonton, di urutan arsip
 *   3      klip di bawahnya
 *   4-15   dua belas klip acak
 *
 * Slot 2 dan 3 dicari server lewat `useKlipSekitar`, bukan dititipkan
 * halaman sebelumnya. Dulu dititipkan, dan itu salah begitu orang
 * berpindah klip lewat "Klip lain": daftar yang jadi sumber titipan itu
 * daftar acak, jadi "tetangganya" juga acak — klip 2020 dan 2015 muncul
 * berdampingan dengan klip 2026.
 *
 * Titipan dari daftar tetap dipakai, tapi cuma untuk dua hal: judul klip
 * ini, dan tanggalnya — tanggal itu yang dipakai server untuk mencari
 * posisinya di arsip. Tanpa tanggal (halaman dibuka lewat tautan
 * langsung), tetangganya kosong dan dua slot itu diisi klip acak.
 *
 * Kunci `useKlipAcak` tetap, jadi berpindah klip tidak mengocok ulang
 * bagian acaknya. Kunci `useKlipSekitar` memuat id, jadi tetangganya
 * memang ikut berpindah. */
const titipan = computed(() =>
  klipDiketuk.value?.id === id.value ? klipDiketuk.value : null
)

const sekitar = await useKlipSekitar(
  () => id.value,
  () => titipan.value?.tanggal || ''
)

/** Dua tetangga yang mengisi slot 2 dan 3. Kosong kalau server tidak
 *  menemukannya — halaman yang dibuka lewat tautan langsung tidak punya
 *  tanggal untuk dicari. */
const sisipan = computed(() =>
  [sekitar.value?.sebelum, sekitar.value?.sesudah].filter(
    (satu): satu is Klip => Boolean(satu)
  )
)

const sumber = await useKlipAcak(() => [
  id.value,
  ...sisipan.value.map(satu => satu.id)
])

/** Lima belas baris, disusun dari empat sumber.
 *
 * `slice` di ujungnya yang menjaga jumlahnya: yang dikembalikan server
 * selalu lima belas, lalu dua sisipan menambahinya, jadi kelebihannya
 * dipotong. Dengan begitu jumlahnya sama dari mana pun halaman ini
 * dibuka. */
const klipLain = computed(() => {
  const daftar = sumber.value
  if (!daftar.length) return []

  const terbaru = daftar[0]
  const acak = daftar.slice(1).filter(
    satu => satu.id !== id.value && satu.id !== terbaru.id
  )

  return [terbaru, ...sisipan.value, ...acak].slice(0, HALAMAN_LAIN)
})

/** Klip yang sedang ditonton, untuk judul dan metanya.
 *
 *  Dari titipan kalau ada; kalau tidak, dari daftar yang dimuat di sini.
 *  Judul klip tidak ada di data stream-nya — lihat catatan `klipDiketuk`. */
const klip = computed(
  () =>
    sekitar.value?.klip ??
    titipan.value ??
    sumber.value.find(satu => satu.id === id.value)
)

const judul = computed(() => klip.value?.judul || 'Klip Running Man')

/* Urutan ikut dibawa ke daftar, supaya "Semua klip" mengembalikan orang ke
   urutan yang sedang dibacanya, bukan selalu ke Terbaru. */
const urutan = computed(() => urutanKlip(route.query.urutan))

/* Alamat halaman klip di SBS — untuk tombol "Buka di SBS". */
const tautan = computed(() => tautanKlip(id.value))

/* Format durasi yang sama dengan di `PreviewList.vue`. Bukan dipakai
 * `Intl` di sini: yang diformat adalah durasi, bukan tanggal. */
function durasi(detik: number) {
  const menit = Math.floor(detik / 60)
  const sisa = detik % 60

  return `${String(menit).padStart(2, '0')}:${String(sisa).padStart(2, '0')}`
}

/* Episode dan durasi saja. Tanggal sengaja tidak ikut: halaman klip sudah
   punya keduanya, dan tanggal menambah satu baris tanpa menambah sesuatu
   yang perlu diketahui orang untuk menonton.

   Daftar, bukan kalimat gabungan. Sebelumnya keduanya disatukan dengan
   " · " jadi satu baris abu-abu yang harus diurai; sebagai daftar
   keterangan, tiap bagian punya ikonnya sendiri dan bisa dipindai satu
   per satu — bentuk yang sama dengan kartu acara di halaman detail.

   Yang kosong dibuang dari daftarnya, bukan ditampilkan sebagai butir
   tanpa isi: klip lama dari SBS tidak selalu punya durasi. */
const metaKlip = computed(() => {
  const satu = klip.value
  if (!satu) return []

  return [
    satu.episode && { ikon: 'lucide:tv', nilai: satu.episode },
    satu.detik && { ikon: 'lucide:clock', nilai: durasi(satu.detik) }
  ].filter((butir): butir is { ikon: string; nilai: string } => Boolean(butir))
})
</script>

<template>
  <main class="konten clip">
    <NuxtLink
      :to="localePath({ name: 'running-man-preview', query: { urutan } })"
      class="kembali"
    >
      <Icon name="lucide:arrow-left" class="kembali-ikon" aria-hidden="true" />
      Semua klip
    </NuxtLink>

    <!-- Judul klip, dua baris saja.
     *
     * Judul klip SBS panjang dan sering memuat nama bintang tamunya —
     * di layar lebar satu barisnya bisa lebih dari seratus karakter,
     * dan baris sepanjang itu sulit dibaca. Dipotong di dua baris,
     * karena di bawahnya ada pemutar dan daftar klip yang lebih
     * penting daripada sisa judulnya. -->
    <h1 class="konten__judul clip__judul">{{ judul }}</h1>

    <!-- Keterangan episode dan durasi, memakai daftar `.meta` dari
         main.css — bentuk yang sama dengan kartu acara di halaman
         detail dan kartu profil. -->
    <ul v-if="metaKlip.length" class="meta">
      <li v-for="(satu, n) in metaKlip" :key="n" class="meta__butir">
        <Icon :name="satu.ikon" class="meta__ikon" aria-hidden="true" />
        {{ satu.nilai }}
      </li>
    </ul>

    <!-- Pemutar sendiri, bukan bingkai SBS. Sebabnya ada di catatan
         ClipPlayer.vue: player mereka di dalam bingkai pihak ketiga selalu
         gagal di Chrome karena cookie-nya diblokir.

         `gambar` diteruskan sebagai poster supaya kotaknya tidak hitam
         kosong sebelum videonya siap.

         Lebarnya dikunci di layar lebar, sama seperti player di halaman
         streaming: pada lebar konten penuh (72rem = 1152px), rasio 16:9
         membuat kotaknya setinggi 648px — setengah tinggi monitor untuk
         satu klip yang panjangnya dua menit. -->
    <ClipPlayer
      :id="id"
      :judul="judul"
      :gambar="klip?.gambar"
      class="clip__pemutar"
    />

    <div class="clip__tujuan">
      <a
        :href="tautan"
        class="tombol tombol--sekunder clip__tombol"
        target="_blank"
        rel="noopener"
      >
        Buka di SBS
        <Icon name="lucide:external-link" class="clip__ikon" aria-hidden="true" />
      </a>
    </div>

    <!-- Pindah ke klip lain tanpa kembali ke daftar. Isinya dimuat halaman
         ini sendiri sekali, lima belas baris, sama dari mana pun klipnya
         dibuka — dan tidak bertambah saat digulir, karena ini bukan
         halaman arsip.

         Barisnya memakai komponen yang sama dengan daftar, dan setiap
         ketukan menitipkan klipnya ke halaman berikutnya, jadi judulnya
         tetap benar walau berpindah berkali-kali.

         Disembunyikan kalau tidak ada isinya: kalau SBS sedang tidak bisa
         dihubungi, judul bagian ini tidak perlu muncul di atas ruang
         kosong. -->
    <section v-if="klipLain.length" class="bagian">
      <h2 class="bagian__judul">Klip lain</h2>

      <PreviewList :daftar="klipLain" />
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah tetap
   72px ditambah env(safe-area-inset-bottom). Tanpa ini konten terakhir
   tertutup navbar. Sama seperti di beranda Running Man dan halaman
   daftar klip. */
.clip {
  padding-bottom: 10rem;
}

/* Gaya tautan kembali dipakai bersama lima halaman Running Man, jadi
   aturannya ada di `.kembali` dalam main.css — bukan disalin ke sini. */

/* Judul klip SBS biasanya menyebut bintang tamunya, dan panjangnya
 * sering lebih dari seratus karakter. Dua baris saja, lalu dipotong:
 * di bawahnya ada pemutar dan daftar klip yang lebih penting daripada
 * sisa judulnya.
 *
 * Batas barisnya ditulis pada paragrafnya, bukan di `--lebar-konten`:
 * kartunya boleh selebar halaman, yang berhenti melebar cuma
 * barisnya — sama seperti `.ringkas__teks` di halaman detail. */
.clip__judul {
  max-width: 46rem;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

/* Player dan tombol di bawahnya berbagi satu lebar dan satu pusat,
 * supaya keduanya segaris.
 *
 * `56rem` (896px) adalah batas yang sama dipakai halaman streaming:
 * pada rasio 16:9 tingginya 504px, dan sisa halamannya masih terlihat
 * tanpa menggulir. */
.clip__pemutar {
  display: block;
  margin-top: 1.5rem;
}

@media (min-width: 48rem) {
  .clip__pemutar,
  .clip__tujuan {
    max-width: 56rem;
    margin-inline: auto;
  }
}

/* Satu tombol, tapi tetap di dalam pembungkus yang sama dengan player
 * supaya lebarnya ikut. Di layar sempit ia mengisi lebar itu — target
 * ketuk yang besar tidak ada ruginya di sini.
 *
 * Di layar lebar ia berhenti melebar: tombol selebar 896px untuk empat
 * kata terbaca sebagai bilah, bukan sebagai tombol. */
.clip__tujuan {
  display: flex;
  gap: 0.75rem;

  margin-top: 1rem;
}

.clip__tombol {
  flex: 1 1 10rem;
  justify-content: center;
}

@media (min-width: 48rem) {
  .clip__tombol {
    flex: 0 1 auto;
    min-width: 12rem;
  }
}

.clip__ikon {
  font-size: 1rem;
}

</style>
