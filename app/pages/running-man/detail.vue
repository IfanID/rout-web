<script setup lang="ts">
/* Informasi acara Running Man: apa acaranya, kapan tayang, dan
 * angkanya.
 *
 *   /running-man              beranda — kapan tayang
 *   /running-man/detail       halaman ini
 *
 * Yang tidak ada di sini: daftar episode. Itu menjawab pertanyaan
 * lain — "episode mana yang sudah tayang" — dan punya halamannya
 * sendiri di ./episode/index.vue. Dicampur, halaman yang isinya
 * menjelaskan acara terasa seperti halaman arsip.
 *
 * Yang ADA di sini justru data anggota cast — nama Korea, foto,
 * riwayat karier, dan penanda aktif — karena halaman ini satu-satunya
 * yang memakainya. Teksnya bukan di sini, tapi di blok `anggota` pada
 * berkas locale. Alasan lengkapnya ada di blok `--- Data anggota cast`
 * di bawah.
 *
 * Teksnya ditulis apa adanya di template, dalam Bahasa Indonesia,
 * tanpa menambah kunci locale baru — aturan teks dummy di AGENTS.md.
 *
 * Yang tetap ditulis apa adanya adalah judulnya, "Running Man". Nama
 * acara dari Korea Selatan itu bukan brand Rout dan bukan teks yang
 * perlu diterjemahkan, sama seperti di useMiddleSlot.ts.
 *
 * Beralamat `/running-man/detail` dan bernama route
 * `running-man-detail`. Keduanya berbeda: URL membaca nama folder apa
 * adanya, sedangkan nama route menyambung tiap segmen dengan tanda
 * hubung. Folder `running-man/` di atasnya TIDAK berkurung — itulah
 * yang membuat `/running-man/detail` terbentuk.
 *
 * Tetesan navbar di halaman ini diwarisi lewat path, karena semuanya
 * berada di bawah `/running-man/`. Karena itu Running Man tidak
 * memakai kolom `dalam` di useMiddleSlot.ts — lihat catatan fungsi
 * `milik` di BottomNav.vue. */

const { t } = useI18n()

/* Jadwal tayang episode berikutnya, hanya untuk jumlah episodenya.
 *
 * Angka "822 Episode" di bagian statistik dulu ditulis tangan, dan itulah
 * yang membuatnya basi tanpa ada yang memberitahu. Sekarang dihitung dari
 * nomor tayang berikutnya — satu less — dan ikut hilang kalau SBS sedang
 * tidak bisa dihubungi, karena `v-for` di bawah membaca larik yang sudah
 * tidak memuat baris itu.
 *
 * Permintaan ini di-cache server sepuluh menit, jadi halaman detail yang
 * memanggilnya di halaman beranda tidak menambah beban yang berarti. */
const jadwal = await useRunningManJadwal()

const { acara, tentang, episodeTercetak } = useRunningMan(
  computed(() => jadwal.value?.nomor ?? null)
)

/* --- Data anggota cast -----------------------------------------
 *
 * Data dan tipenya sekarang tinggal di `useRunningManAnggota.ts`,
 * karena pencarian juga memakainya. Halaman ini tetap memetakan
 * teks terjemahannya di bawah; nama Korea, foto, dan status tidak
 * ikut diterjemahkan.
 *
 * Sumber tiap field ada di berkas itu, bukan disalin ke sini. Kalau
 * ada anggota baru, satu tempat yang berubah. */
const { daftar: ANGGOTA } = useRunningManAnggota()

/* Daftar anggota cast beserta teksnya dalam bahasa yang sedang dibaca.
 *
 * Sapaan, deskripsi, dan karier semuanya dibaca dari locale, jadi ikut
 * bahasa pemakai. Yang tetap dari blok data di atas hanya nama Korea,
 * foto, dan flag `aktif`.
 *
 * Kenapa daftar disimpan sebagai OBJEK bernomor dan bukan larik:
 * `t()` mengembalikan string, sedangkan larik akan ikut diserialisasi
 * dan tampil sebagai teks. `tm()` memang bisa mengembalikan larik,
 * tapi hanya kalau pesan tidak lewat message compiler — dan di proyek
 * ini i18n memakai message compiler, sehingga `tm()` mengembalikan
 * linked list internal `{ type, start, end, body }`. Kalau objek itu
 * langsung dirender, yang tampil bukan teksnya melainkan JSON-nya.
 *
 * Objek bernomor menutup kedua masalah sekaligus: `t()` tetap
 * dipakai, jadi hasilnya string apa adanya di mode apa pun.
 *
 * Untuk apa `jumlah`: barisnya harus dihitung sebelum dirender, dan
 * jumlahnya bisa berbeda antar bahasa kalau ada terjemahan yang belum
 * lengkap. Yang dirender adalah `n` dari 1 sampai `jumlah`. */
/* Riwayat karier diurutkan dari yang terbaru.
 *
 * Urutan dari SBS tidak perlu menurun. 유재석 dimulai dari 2019, lalu
 * 2018, lalu 2010, lalu kembali lagi ke 2018 — itu urutan yang mereka
 * pakai di halaman mereka, bukan urutan waktu. Ditampilkan 그대로
 * berarti karier terbaca acak.
 *
 * Tahun dibaca dari empat digit pertama baris. Kalau sebuah baris
 * ternyata tidak punya tahun, ia dianggap paling lama dan tidak
 * menggeser yang lain — lebih baik begitu daripada hilang.
 *
 * `Array.prototype.sort` sudah stabil di JS modern, jadi beberapa baris
 * dengan tahun yang sama — `2006 SBS` dan `2006 MBC` pada 유재석 —
 * tetap urutnya seperti aslinya. */
function urutTahun(baris: string[]) {
  const tahun = (s: string) => Number(s.match(/(\d{4})/)?.[1] ?? 0)
  return [...baris].sort((a, b) => tahun(b) - tahun(a))
}

const anggota = ANGGOTA.map(satu => {
  const dasar = `anggota.orang.${satu.kunci}`

  /* Kunci yang hilang menghasilkan string berisi kunci itu sendiri,
   * jadi dibandingkan dengan bentuknya — bukan dengan string kosong,
   * karena string kosong yang sah bisa berarti "sengaja tidak ada". */
  const baca = (bidang: string, nomor: number) => {
    const kunci = `${dasar}.${bidang}.${nomor}`
    const nilai = t(kunci)
    return nilai === kunci ? '' : nilai
  }

  /* Lampiran dipisah karena bentuknya berbeda: deskripsi dan karier
   * ada di locale, sedangkan `karier` di blok data dipakai kalau
   * locale-nya belum diisi — supaya halaman tidak pernah kosong
   * meskipun ada satu bahasa yang belum dikerjakan. */
  const lampiran = (bidang: string, bawaan: string[]) => {
    const hasil: string[] = []
    for (let n = 1; ; n++) {
      const baris = baca(bidang, n)
      if (!baris) break
      hasil.push(baris)
    }
    return hasil.length ? hasil : bawaan
  }

  const sapaanKunci = `${dasar}.sapaan`
  const sapaan = t(sapaanKunci)

  return {
    ...satu,
    sapaan: sapaan === sapaanKunci ? '' : sapaan,
    deskripsi: lampiran('deskripsi', []),
    karier: urutTahun(lampiran('karier', satu.karier))
  }
})
/** Anggota dipisah menjadi dua kelompok: yang masih aktif, dan yang
 *  sudah keluar.
 *
 *  Dipisah dengan datanya sendiri, bukan dengan `v-if` di dalam satu
 *  daftar: begitu yang sudah keluar tidak lagi bercampur dengan yang
 *  masih ada, badge status di tiap baris menjadi pengulangan — tujuh
 *  baris bertulis "Aktif" di bawah judul "Aktif" — dan menghapusnya
 *  menghilangkan satu hal, bukan informasi.
 *
 *  Urutannya mengikuti urutan `ANGGOTA`, jadi penyusunan di blok data
 *  masih menentukan urutan di dalam tiap kelompok.
 *
 *  Kelompok yang kosong DIBUANG, bukan.dirender dengan judul tanpa isi:
 *  kalau suatu saat semua anggota ternyata aktif, halaman tidak akan
 *  menampilkan bagian "Sudah keluar" yang tidak berisi apa pun.
 *
 *  `judul` menyimpan kunci locale, bukan teksnya, supaya `t()` dipanggil
 *  di template dan ikut berubah kalau bahasa berganti. */
/* Tanggal keluar jadi tulisan yang mengikuti bahasa pemakai.
 *
 * `Intl` yang dipakai, bukan daftar nama bulan dan hari yang ditulis
 * sendiri: nama bulan dan hari punya bentuk berbeda di setiap bahasa —
 * `April` di id dan en, tapi `4월` di ko — dan daftar itu harus_notify
 * orang untuk memperbarui setiap kali locale bertambah.
 *
 * Yang ditanyakan ke `Intl` sekaligus tanggal, bulan, tahun, DAN nama
 * hari, karena permintaannya memang semuanya: tanggal saja terasa
 * seperti nomor seri tanpa konteks, dan hari인트inya sudah tersedia
 * gratis di locale yang sama.
 *
 * `T00:00:00` dipakai eksplisit supaya hasilnya dibaca sebagai waktu
 * lokal. Tanpa itu, `new Date('2011-04-27')` dibaca sebagai tengah
 * malam UTC, dan di sebagian zona waktu tanggalnya bergeser sehari ke
 * belakang — 27 April jadi 26 April.
 *
 * Nilai yang cuma `YYYY` dikembalikan apa adanya: tidak ada tanggalnya
 * untuk diformat, dan memformat tahun saja akan menghasilkan bentuk
 * yang berbeda dari yang ditulis di data. */
function formatKeluar(tanggal: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return tanggal

  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${tanggal}T00:00:00`))
}

const kelompokAnggota = computed(() =>
  [
    { kunci: 'aktif', judul: 'anggota.aktif', daftar: anggota.filter(a => a.aktif) },
    {
      kunci: 'keluar',
      judul: 'anggota.keluar',
      daftar: anggota.filter(a => !a.aktif)
    }
  ].filter(satu => satu.daftar.length)
)


const { locale } = useI18n()
/** Satu kotak statistik, untuk bentuk larik yang dibaca `v-for`. */
interface Statistik {
  id: string
  ikon: string
  nilai: string
  /** Kunci locale, bukan teksnya — label ikut bahasa pemakai. */
  label: string
}

/* Angka-angka di bagian statistik.
 *
 * Sempat berada di `useRunningMan.ts` sebagai `STATISTIK_TETAP`, dan
 * angka "7" di sana ditulis tangan. Dua-duanya salah: hanya halaman ini
 * yang menampilkan bagian statistik, dan jumlah anggota harus dihitung
 * dari `ANGGOTA` di berkas ini — bukan diketik ulang di tempat lain,
 * karena begitu daftar cast berubah angkanya diam-diam basi, persis
 * seperti yang pernah terjadi pada "822 episode" sebelum dihapus.
 *
 * Label memakai kunci locale, bukan teks jadi. Label lama ditulis apa
 * adanya di TypeScript, sehingga kotak "Cast tetap" tetap Bahasa
 * Indonesia di halaman berbahasa Inggris dan Korea.
 *
 * "Hari tayang" diambil dari ko.wikipedia: `매주 일요일 저녁 6:10 ~ 8:00`.
 * Jamnya sendiri sudah tampil di kartu acara, jadi yang ditulis di sini
 * cuma hari supaya kotak ini tidak mengulang isi kartu. */
const statistik = computed<Statistik[]>(() => {
  const terakhir = episodeTercetak.value
  const tetap = anggota.filter(satu => satu.aktif).length
  const keluar = anggota.length - tetap

  return [
    /* Baris episode tidak pernah ditulis mati, dan tidak muncul kalau
     * angkanya tidak diketahui — SBS sedang tidak bisa dihubungi. */
    ...(terakhir
      ? [
          {
            id: 'episode',
            ikon: 'lucide:tv',
            nilai: String(terakhir),
            label: 'statistik.episode'
          } as Statistik
        ]
      : []),
    {
      id: 'tetap',
      ikon: 'lucide:users',
      nilai: String(tetap),
      label: 'statistik.tetap'
    },
    {
      id: 'keluar',
      ikon: 'lucide:user-minus',
      nilai: String(keluar),
      label: 'statistik.keluar'
    },
    {
      id: 'hari',
      ikon: 'lucide:calendar-days',
      nilai: t('statistik.minggu'),
      label: 'statistik.hari'
    }
  ]
})

const localePath = useLocalePath()

/** Batas baris karier yang tampil terbuka tanpa diklik.
 *
 *  Sembilan anggota di halaman ini punya tujuh sampai sembilan baris
 *  masing-masing. Semuanya dibuka sekaligus menambah 62 baris daftar
 *  ke halaman yang isinya sebenarnya cuma pengenalan orang. Riwayat
 *  karier memang ada untuk dibaca kalau memang dicari, bukan untuk
 *  dilewati lebih dulu.
 *
 *  Yang sudah pendek tetap terbuka — memaksa orang klik untuk melihat
 *  tiga baris terasa lebih membosankan daripada menampilkannya. */
const BATAS_KARIER = 4

</script>

<template>
  <main class="konten detail">
    <!-- Kembali ke beranda. Satu-satunya tautan di halaman ini.

         Berdiri di atas judul, bukan di bawahnya: tuannya kembali ke
         beranda, jadi posisinya paling dekat dengan tempat orang
         pertama kali melihat halaman ini. -->
    <NuxtLink :to="localePath('running-man')" class="kembali">
      <Icon name="lucide:arrow-left" class="kembali-ikon" aria-hidden="true" />
      Beranda Running Man
    </NuxtLink>

    <!-- ===== Kartu acara ======================================= -->

    <!-- Kartu ini sekaligus jadi heading halaman. Dulu ada `h1`
         "Running Man" di atasnya, tapi isinya mengulang kartu — dan
         subjudulnya menyebut "Jadwal tayang" yang sudah dihapus.
         Satu nama, satu tempat. -->
    <section class="kartu acara">
      <!-- Mark huruf, belum ada poster resmi. `aria-hidden` karena
           nama acara sudah jadi heading beberapa baris di bawah —
           membacakannya sekali lagi hanya menambah kebisingan. -->
      <span class="acara__mark" aria-hidden="true">{{ acara.huruf }}</span>

      <div class="acara__data">
        <!-- Heading halaman. Nama yang dikenal orang dipakai lebih
             dulu, karena itu yang dicari pembaca; nama Korea disimpan
             sebagai baris kecil di bawahnya. -->
        <h1 class="acara__nama">Running Man</h1>
        <p class="acara__nama-asli">{{ acara.namaAsli }}</p>
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

    <!-- ===== Tentang acara ====================================== -->

    <section id="tentang" class="bagian">
      <h2 class="bagian__judul">Tentang acara</h2>

      <!-- Deskripsi resmi SBS, ditulis sebagai paragraf terpisah. Sumbernya
           meta tag halaman program SBS, bukan ringkasan yang ditulis
           sendiri. -->

      <div class="kartu ringkas">
        <p v-for="(paragraf, n) in tentang.ringkas" :key="n" class="ringkas__teks">
          {{ paragraf }}
        </p>
      </div>
    </section>

    <!-- ===== Anggota =========================================== -->

    <section id="anggota" class="bagian">
      <h2 class="bagian__judul">{{ t('anggota.judul') }}</h2>

      <!-- Baris, bukan kartu. Sama seperti daftar di episode/index.vue dan
           streaming.vue: yang di sini satu kelompok orang, dan memberi
           tiap orang permukaan sendiri membuatnya terbaca sebagai
           hal-hal terpisah. Garis rambut memisahkannya tanpa membuat
           tiap baris jadi kotak.

           Baris pertama juga memakai `border-top`, bukan hanya baris
           kedua dan seterusnya. Alasannya sama seperti di streaming:
           di sini baris pertama berada di bawah `<h2>` yang sudah punya
           jarak sendiri, jadi tanpa garis ia menggantung. -->
      <!-- Dua kelompok: yang masih aktif, dan yang sudah keluar. Satu
           markup baris untuk keduanya — diputar di dalam `v-for`
           kelompok, bukan ditulis dua kali.

           Gaya judul kelompoknya sendiri, bukan `.label`; lihat catatan
           di CSS — bentuk `.label` sama persis dengan
           judul bagian, dan dua judul yang identik di halaman yang
           sama tidak menunjukkan hierarki apa pun.

           Badge status per baris DIHAPUS. Sempat ada "Aktif" di tujuh
           baris tepat di bawah judul "Aktif" — pengulangan yang tidak
           menambah informasi, dan di layar sempit badge itulah yang
           memenuhi baris pertama. Sekarang statusnya terbaca dari
           kelompok tempat baris itu berada. -->
      <template v-for="kelompok in kelompokAnggota" :key="kelompok.kunci">
        <h3 class="anggota__kelompok">{{ t(kelompok.judul) }}</h3>

        <ul class="anggota">
          <li
              v-for="(satu, id) in kelompok.daftar"
              :key="id"
              :id="`anggota-${satu.kunci}`"
              class="anggota__baris"
            >
            <!-- Foto bukan dekorasi: orang mengenali cast lewat wajahnya, dan
                 nama Korea saja sulit dibaca orang Indonesia. Alt-nya
                 nama orang itu karena gambar ini memang memportretkan
                 orang tersebut.

                 Ukurannya dikunci lewat `width` dan `height` supaya baris
                 tidak bergeser selagi fotonya belum selesai dimuat — foto
                 dari CDN pihak ketiga tidak selalu tiba secepat teksnya. -->
            <!-- Yang mengisi kotak 3.5rem ini ada dua, bukan satu.
                 `
                 Foto dipakai kalau ada. Kalau tidak ada, yang muncul
                 mark huruf — bentuk dan warnanya sama persis dengan
                 mark di kartu tayang, supaya kotak kosong itu terbaca
                 sebagai keputusan desain, bukan foto yang gagal dimuat.

                 Dua hal yang sengaja tidak dipakai: `src=""`, karena
                 itu meminta halaman itu sendiri dan memunculkan gambar
                 rusak; dan foto dari mana pun yang tidak boleh dipakai
                 ulang. Foto berita milik studio dan press, dan halaman
                 ini bukan menyimpan salinannya melainkan menautkan
                 URL-nya — menautkan foto berhak cipta milik orang lain
                 bukan memakai foto.

                 Photographers punya hak yang sama atas fotonya, dan
                 foto bebas yang tersedia untuk ketiga orang ini cuma
                 satu, dengan kewajiban atribusi.`)
                 Kalau nanti ada file sendiri di `public/anggota/`,
                 cukup isi `foto` di blok data — mark-nya hilang
                 sendiri karena keduanya berbagi kotak yang sama. -->
            <img
              v-if="satu.foto"
              class="anggota__foto"
              :src="satu.foto"
              :alt="satu.latin"
              width="56"
              height="56"
              loading="lazy"
            >

            <span v-else class="anggota__mark" aria-hidden="true">
              {{ satu.latin.charAt(0) }}
            </span>

            <div class="anggota__isi">
              <div class="anggota__kepala">
                <h3 class="anggota__nama">{{ satu.latin }}</h3>

                <!-- Nama Korea di bawah nama latin. Bukan terjemahan:
                     ini bentuk Hangul dari nama orangnya sendiri. Diletakkan
                     di bawah karena pembaca yang tidak bisa baca Korea tetap
                     harus bisa tahu siapa yang sedang dibahas, dan urutan
                     membaca dimulai dari atas. -->
                <p class="anggota__hangul">{{ satu.nama }}</p>

                <!-- Tanggal keluar, hanya untuk yang sudah keluar.
                     Berdiri sendiri, bukan ditempel di belakang nama, supaya
                     baris tanpa foto dan tanpa uraian tetap setinggi satu
                     baris teks — bukan blok kosong yang lebih tinggi dari
                     kartu di atasnya. -->
                <p v-if="satu.keluar" class="anggota__keluar">
                  <Icon name="lucide:log-out" class="anggota__keluar-ikon" aria-hidden="true" />
                  {{ formatKeluar(satu.keluar) }}
                </p>

              </div>

              <!-- Ketiganya sudah jadi string biasa oleh pemetaan di script, jadi
                   templatenya tidak perlu `rt()` maupun pembungkus lain.
                   Penulisan `satu.` wajib di sini: nama variabel lariknya
                   `baris`, bukan `deskripsi` atau `karier`. -->
              <p v-if="satu.sapaan" class="anggota__sapaan">
                <Icon name="lucide:quote" class="anggota__ikon" aria-hidden="true" />
                {{ satu.sapaan }}
              </p>

              <div v-if="satu.deskripsi.length" class="anggota__deskripsi">
                <p v-for="(baris, barisId) in satu.deskripsi" :key="barisId">
                  {{ baris }}
                </p>
              </div>

              <!-- Riwayat karier dilipat per anggota. Sembilan anggota dengan
                   tujuh sampai sembilan baris masing-masing menambah 62 baris
                   ke halaman ini, dan hampir tidak ada yang menelusuri
                   seluruh kar seseorang.

                   `<details>` dipakai, bukan tombol + state Vue: daftar ini
                   cuma dibaca, tidak perlu state, dan `<details>` tetap
                   berfungsi tanpa JavaScript. Yang sudah aktif tidak
                   perlu diklik — daftar pendek tetap terbuka.

                   **Tidak ada jumlah baris di sebelah judul.** Sempat ada,
                   dan justru membingungkan: angka "9" di sebelah "Riwayat
                   karier" dibaca sebagai "ada sembilan baris", padahal yang
                   tertutup justru yang paling panjang — dan angkanya bergerak
                   terus setiap kali daftar ini bertambah. Yang tersisa di
                   sini cuma judul, panah, dan daftar. -->
              <details
                v-if="satu.karier.length"
                class="anggota__karier"
                :open="satu.karier.length <= BATAS_KARIER"
              >
                <summary class="label anggota__karier-judul">
                  {{ t('anggota.karier') }}
                  <Icon
                    name="lucide:chevron-down"
                    class="anggota__karier-panah"
                    aria-hidden="true"
                  />
                </summary>
                <ul class="anggota__karier-daftar">
                  <li v-for="(baris, barisId) in satu.karier" :key="barisId">
                    {{ baris }}
                  </li>
                </ul>
              </details>

              <!-- Atribusi foto. Hanya untuk foto yang bukan milik SBS,
                   karena hanya foto itu yang lisensinya meminta
                   disebutkan. Baris ini tidak dirender untuk foto
                   SBS — tidak ada yang perlu disebut, dan baris kosong
                   hanya membebani baris. -->
              <p v-if="satu.kredit" class="anggota__kredit">
                {{ t('anggota.foto') }}: {{ satu.kredit }}
              </p>

            </div>
          </li>
        </ul>
      </template>

      <!-- SBS belum memperbarui halamannya: 이광수 dan 전소민 masih
           tercantum padahal sudah keluar, dan Ji Ye-eun yang bergabung
           sejak 2024 justru tidak ada di sana. Penanda status di bawah
           mengikuti laporan media Korea, bukan data SBS. Tanpa catatan
           ini orang akan menghitung sendiri lalu menyimpulkan angkanya
           salah. -->
      <p class="anggota__bawah">
        {{ t('anggota.bawah') }}
      </p>
    </section>

    <!-- ===== Statistik ========================================= -->

    <section id="statistik" class="bagian">
      <h2 class="bagian__judul">Statistik</h2>

      <ul class="statistik">
        <!-- Kuncinya `satu.id`, bukan indeks `v-for`: indeks ikut berubah
             kalau urutan barisnya berubah, dan seluruh daftar-statistik ini
             akan dirender ulang. -->
        <li v-for="satu in statistik" :key="satu.id" class="kartu statistik__butir">
          <Icon :name="satu.ikon" class="statistik__ikon" aria-hidden="true" />
          <span class="statistik__nilai">{{ satu.nilai }}</span>
          <span class="statistik__label">{{ t(satu.label) }}</span>
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

/* Gaya tautan kembali dipakai bersama lima halaman Running Man, jadi
 * aturannya ada di `.kembali` dalam main.css — bukan disalin ke sini.
 * Kalau tiap halaman menulis salinannya sendiri, satu halaman yang
 * diperbaiki membuat empat lainnya kelihatan berbeda. */

/* --- Kartu di halaman ini ------------------------------------ */

/* Kartu di halaman ini tidak bisa diklik ke mana pun, tapi `.kartu`
 * dari main.css mengubah warna garis saat hover. Hover itu sinyal
 * "ini punya tujuan", dan di sini tidak ada tujuan.
 *
 * Ditulis sebagai satu selector berumpun, bukan aturan terpisah per
 * kartu. Empat aturan yang isinya sama persis adalah tempat di mana
 * ketiganya akan mulai berbeda sendiri nanti. */
.acara:hover,
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
 * layar yang sebenarnya cukup lebar.
 *
 * Paddingnya `clamp`, bukan angka tetap. Di 360px, 1.75rem per sisi
 * memakan 56px dari kartu yang di dalamnya sudah dikurangi padding
 * halaman — dan kartu ini isinya mark 64px plus dua kalimat pendek,
 * jadi ruang kosongnya yang paling banyak menyumbang lebar yang
 * hilang. */
.acara {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;

  margin-top: 2rem;
  padding: clamp(1.25rem, 4vw, 1.75rem);
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

/* Nama Korea di bawah nama yang dikenal orang. Keterangan, bukan
 * judul, jadi ukurannya satu tingkat di bawah `acara__nama` dan
 * warnanya lebih redup. */
.acara__nama-asli {
  margin-top: 0.125rem;
  font-size: 0.9375rem;
  color: var(--teks-lembut);
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
/* --- Tentang acara -------------------------------------------- */

.ringkas {
  padding: 1.75rem;
}

/* Di layar sempit, kartu ini paling rakus dari kartu yang ada di
 * halaman: 1.75rem per sisi, di luar padding kartu yang sudah ada. Setelah
 * padding konten dikecilkan di layar sempit, ruang yang tersisa
 * masih perlu dikembalikan di sini — kartu inilah yang paling
 * banyak kehilangan lebar. */
@media (max-width: 30rem) {
  .ringkas {
    padding: 1.25rem;
  }
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

/* Jarak antar paragraf ditulis di margin paragraf kedua, bukan di
 * container, supaya jarak terakhir tetap benar saat deskripsi ini
 * berubah jumlah paragrafnya. */
.ringkas__teks + .ringkas__teks {
  margin-top: 0.75rem;
}

/* --- Anggota -------------------------------------------------- */

/* Baris, bukan kartu — sama seperti daftar di episode/index.vue dan
 * streaming.vue.
 *
 * `flex-wrap` supaya di layar sempit foto tetap di kiri dan teks turun
 * ke bawahnya, dan `min-width: 0` pada kolom teks supaya nama Korea
 * yang panjang tidak menahan baris flex dan mendorong foto ke luar.
 *
 * `border-top` ada di SEMUA baris, termasuk yang pertama. Baris pertama
 * berada tepat di bawah `<h2>` yang sudah punya jarak sendiri: tanpa
 * garis itu ia menggantung di bawah judul bagian, tanpa batas yang
 * menjelaskan bahwa daftarnya sudah mulai. Alasan yang sama dipakai di
 * daftar "Stream lain" pada halaman streaming. */
.anggota__baris {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem 1rem;

  padding: 1.125rem 0;
  border-top: 1px solid var(--garis-halus);
}

/* Tautan hasil pencarian menuju baris ini lewat `#anggota-<kunci>`.
 * Header di atas halaman sticky, jadi tanpa jarak gulir baris yang
 * dituju berhenti tepat di bawah header dan namanya tertutup. */
.anggota__baris {
  scroll-margin-top: 6rem;
}

/* Saat dituju lewat tautan, garis atasnya memakai warna aktif supaya
 * orang tahu baris mana yang dimaksud — bukan hanya tiba di tengah
 * daftar yang semua barisnya terlihat sama. */
.anggota__baris:target {
  border-top-color: var(--garis-aktif);
}

.anggota {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Di layar lebar daftar anggota jadi DUA KOLOM.
 *
 * Sembilan baris selebar 1104px hanya berisi foto 56px, satu nama, dan
 * satu-dua baris deskripsi — sisa lebar barisnya ruang kosong, dan
 * baris sepanjang itu paling sulit dibaca justru di bagian yang
 * isinya kalimat.
 *
 * `64rem` dan bukan `48rem`: di tablet, dua kolom membuat deskripsi
 * terjepit jadi tumpukan kata yang tinggi, sementara satu kolom
 * selebar 660px masih nyaman dibaca. Angka ini sama dengan batas
 * kolom ketiga di daftar episode.
 *
 * Garis pemisahnya tidak perlu diatur ulang di sini. Tiap baris sudah
 * punya `border-top` sendiri, dan di grid garis itu memisahkan baris
 * per baris — bukan membentang melintasi dua kolom, karena tiap baris
 * memang sel selebar satu kolom.
 *
 * `align-items: start` supaya seseorang dengan karier sepuluh baris
 * tidak memaksa tetangga di sebelahnya ikut meninggi — tiap baris
 * setinggi isinya. */
@media (min-width: 64rem) {
  .anggota {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
    align-items: start;
  }
}

.anggota__foto {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  object-fit: cover;

  /* Wajah orang berada di separuh atas foto yang lebih tinggi dari
   * lebar, sedangkan `cover` memotong dari tengah. Tanpa baris ini
   * foto sepotret 송중기 kehilangan puncak kepalanya: yang tertinggal
   * hanya dari dahi ke bawah. Seperempat dari tinggi memotong wajah
   * tanpa membuang separuh foto.
   *
   * Foto bersegi milik SBS tidak terpengaruh sama sekali — tidak ada
   * yang terpotong untuk digeser. */
  object-position: center 25%;

  /* Latar di belakang gambar. Selagi foto dari CDN belum selesai dimuat,
   * yang tampil adalah kotak seukuran aslinya dan warnanya tidak
   * mencolok seperti kotak yang rusak. */
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
}

.anggota__isi {
  flex: 1 1 16rem;
  min-width: 0;
}

/* Mark huruf untuk anggota yang fotonya tidak ada.
 *
 * Mengganti `.anggota__foto`, bukan sekadar gambarnya: keduanya punya
 * ukuran, radius, dan border yang sama persis, sehingga kotak yang
 * kosong tetap sebesar kotak yang berisi foto dan barisnya tidak
 * bergeser. Warna hurufnya mengikuti mark di kartu tayang.
 *
 * `flex-shrink: 0` wajib seperti pada foto — tanpa itu, di layar
 * sempit mark ikut tertekan jadi oval. */
.anggota__mark {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  /* `line-height: 1` wajib: tanpa itu huruf mewarisi line-height body
   * dan tidak benar-benar berada di tengah lingkarannya. */
  font-size: 1.25rem;
  line-height: 1;
  color: var(--teks-aksen);
}

/* Nama dan penanda status sebaris. `flex-wrap` dipakai supaya di layar
 * sempit badge turun ke baris sendiri, bukan memaksa nama Korea jadi
 * dua baris yang sempit. */
.anggota__kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.anggota__nama {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--teks-utama);
}

/* Font Korea. Teks di sini seluruhnya bahasa Korea, dan proyek ini belum
 * punya font Korea di tumpukan sistem — tanpa baris ini teksnya bisa
 * tampil sebagai kotak pada perangkat yang tidak punya glyph-nya.
 * Ditambahkan hanya di scope section ini supaya tidak mengubah tipografi
 * seluruh situs. */
.acara__nama-asli,
.ringkas__teks,
.anggota__nama,
.anggota__sapaan,
.anggota__hangul,
.anggota__deskripsi,
.anggota__karier {
  font-family: system-ui, -apple-system, "Apple SD Gothic Neo",
    "Malgun Gothic", "Noto Sans KR", sans-serif;
}

/* Judul kelompok anggota: "Aktif" dan "Sudah keluar".
 *
 * **Bukan `.label` dan bukan `.bagian__judul`.** Keduanya berbentuk sama:
 * 0.8125rem, huruf besar, warna redup. Dipakai untuk judul kelompok,
 * halaman ini punya tiga judul dengan bentuk identik — bagian ini,
 * kelompok aktif, kelompok yang sudah keluar — dan yang terakhir bisa
 * saja tidak kelihatan orang karena sama persis dengan judul di atasnya.
 *
 * Jadi kelompok ini 하나 tingkat lebih kuat: lebih besar, tebal, dan
 * berwarna terang. Hierarki yang terlihat, bukan hanya yang ada di
 * struktur HTML.
 *
 * Huruf besarnya dibuang. `text-transform` ikut memanjangkan bentuk
 * huruf kecil di dua bahasa — `Ü` di "Über" jadi dua tinggi — dan di
 * beberapa bahasa huruf besar jarang dipakai, sementara sebesar ini
 * huruf besar berhenti terasa tegas. */
.anggota__kelompok {
  margin: 1.75rem 0 0.75rem;

  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--teks-utama);
}

/* Kelompok pertama mengikuti `<h2>` bagian yang sudah punya jarak bawah
   sendiri, jadi jarak atasnya tidak perlu sebesar kelompok kedua. */
.bagian__judul + .anggota__kelompok {
  margin-top: 0.5rem;
}

/* Nama Korea. Sengaja kecil dan redup di bawah nama latin: bentuk
 * Hangul adalah keterangan pendukung, bukan nama utamanya. Nama latin
 * yang dibaca lebih dulu. */
.anggota__hangul {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}
/* Sapaan. Tanda kutip di depan ditulis lewat ikon, bukan karakter
 * `"` atau `&ldquo;` — karakter itu ikut ikut diterjemahkan kalau locale
 * menyiapkannya, sementara ikon selalu sama di semua bahasa. */
.anggota__sapaan {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  font-style: italic;
  color: var(--teks-aksen);
}

.anggota__ikon {
  flex-shrink: 0;
  font-size: 0.875rem;
}

/* Jarak antar paragraf deskripsi ditulis di margin paragraf, bukan di
 * container, supaya baris ikut menyusut kalau deskripsinya kosong. */
.anggota__deskripsi {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--teks-sekunder);
}

.anggota__deskripsi p + p {
  margin-top: 0.375rem;
}

/* Karier dipisah dari deskripsi satu garis rambut, supaya jelas dua
 * kelompok informasi yang berbeda dan bukan satu paragraf panjang. */
.anggota__karier {
  margin-top: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--garis-halus);
}

/* Pemicu lipatan. `<summary>` bawaan browser punya segitiga dan
 * penanda daftar sendiri; keduanya dihapus supaya yang tampil cuma
 * ikon panah, dan supaya browser tidak menambahkan gaya bawaan
 * yang berbeda antar mesin. */
.anggota__karier-judul {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  list-style: none;
}

.anggota__karier-judul::-webkit-details-marker {
  display: none;
}

.anggota__karier-judul:hover {
  color: var(--teks-utama);
}

/* Panah berputar ninety derajat saat terbuka. Transisi pendek supaya
 * terasa terkait dengan perubahan, tapi tidak menahan klik
 * berikutnya — gerakan lambat di sini akan terasa seperti lag. */
.anggota__karier-panah {
  font-size: 0.875rem;
  transition: transform 160ms ease;
}

.anggota__karier[open] .anggota__karier-panah {
  transform: rotate(180deg);
}

/* Jarak ke daftar ada di daftar, bukan di pemicunya. Kalau ditulis
 * di `margin-bottom` pemicu, jarak itu tetap ada saat tertutup —
 * lihat `padding-top` di `.anggota__karier` yang sengaja tetap
 * supaya garis pemisah tidak ikut hilang. */
.anggota__karier-daftar {
  margin: 0.375rem 0 0;
  padding: 0;
  list-style: none;

  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--teks-lembut);
}

/* Catatan di bawah daftar. Redup dan rapat supaya terbaca sebagai
 * keterangan, bukan sebagai bagian dari daftar. */
.anggota__bawah {
  font-size: 0.8125rem;
  color: var(--teks-lembut);
}

/* Atribusi foto di bawah isi baris.
 *
 * Paling redup di halaman: ini keterangan teknis untuk pemakaian ulang,
 * bukan bagian dari profil orangnya. Tapi tidak boleh hilang: syarat lisensi Creative Commons meminta siapa fotografernya
 * dan lisensinya, dan baris tanpa itu sama sahnya dengan memakai
 * tanpa izin. */
.anggota__kredit {
  margin-top: 0.625rem;

  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}

/* Tanggal keluar di bawah nama, berlaku untuk semua anggota yang sudah
 * keluar — bukan hanya yang tidak punya profil. Statusnya sudah
 * terbaca dari kelompok tempat baris itu berada, dan tanggalnya
 * berlaku sama untuk siapa pun yang sudah tidak tayang.
 *
 * Ukurannya sama dengan `.anggota__hangul` di sebelahnya. Bedanya cuma
 * warnanya — hangul adalah nama orangnya, sedangkan tanggal ini adalah
 * keterangan, dan keduanya tidak boleh seberat satu sama lain di mata
 * pembaca. */
.anggota__keluar {
  /* Baris penuh di flex, supaya tanggal mulai dari kolom yang sama
   * dengan nama dan tidak ikut تجعل baris ini melebar. */
  flex-basis: 100%;
  margin-top: 0.375rem;

  display: flex;
  align-items: center;
  gap: 0.375rem;

  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--teks-lembut);
}

.anggota__keluar-ikon {
  font-size: 0.875rem;
}

.anggota__bawah {
  margin-top: 0.75rem;
}

/* --- Statistik ------------------------------------------------ */

/* auto-fit, bukan empat kolom tetap. Di layar sempit kolom ketiga
 * menyempit sampai angkanya mulai turun baris, sementara dua kolom
 * masih muat dengan lebar yang sama. Pola ini sama persis dengan
 * yang dipakai di (profile)/profile.vue.
 *
 * Lebarnya dibatasi 36rem, dan itu memperbaiki satu masalah yang baru
 * terlihat di layar lebar: dengan `1fr`, dua angka masing-masing dapat
 * 552px, sehingga satu angka berisi tiga digit duduk di tengah kotak
 * setengah meter. Batas ini setengah `--lebar-konten` (72rem), jadi
 * empat angka pun masih muat tanpa kolom yang lebih sempit dari
 * 7.5rem. */
.statistik {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: 0.75rem;

  max-width: 36rem;

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