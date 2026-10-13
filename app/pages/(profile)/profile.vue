<script setup lang="ts">
/* Halaman profil.
 *
 * Belum ada kunci `profil.*` di file locale, dan sengaja tidak
 * ditambah sekarang. Alasannya aturan teks dummy di AGENTS.md: teks
 * yang belum punya bentuk final ditulis apa adanya di halaman ini,
 * dalam Bahasa Indonesia. Menaruhnya di locale berarti mengisi tiga
 * file dengan teks yang kemungkinan besar dibongkar lagi.
 *
 * Seluruh data yang ditampilkan di bawah adalah data contoh. Sumbernya
 * nanti: pemanggilan API, atau state lokal kalau profil memang disimpan
 * di perangkat ini.
 *
 * Halaman ini sengaja tidak punya daftar menu dan tidak punya riwayat
 * aktivitas. Keduanya bukan urusan profil: pintasan slot sudah punya
 * tempatnya sendiri di navbar, dan riwayat lengkapnya akan punya halaman
 * sendiri. Dua-duanya pernah ada di sini dan keduanya dihapus karena
 * hanya jadi pintu kedua ke tempat yang sama.
 *
 * Catatan: label "Rout" pada nama pengguna dan pada keterangan "Riwayat
 * aktivitas Rout" di file locale itu disengaja. Nama produk boleh muncul
 * di teks yang dilihat pengguna, dan nama itu memang bagian dari
 * identitas yang sedang ditampilkan. */

/* Data dummy. Semuanya string, bukan angka, supaya format angka bisa
 * diubah tanpa menyentuh template. Kalau nanti berasal dari API, angka
 * cukup diubah jadi tipe aslinya di satu tempat. */
const profil = {
  nama: 'Pengguna Rout',
  handle: '@pengguna',
  peran: 'Peserta',
  sejak: 'Anggota sejak Oktober 2025',
  penyimpanan: 'Tersimpan di perangkat ini'
}

const level = {
  nomor: 3,
  nama: 'Penjelajah',
  /* Persen, sudah bulat. Bar progres memakai nilai ini sebagai lebar,
     jadi tidak ada angka persen yang ditulis dua kali. */
  progres: 62,
  /* Jumlah yang masih kurang, dipakai untuk menyusun kalimat di bawah bar
     progres: "12 lagi respawn untuk naik ke level 4". */
  kurang: 12,
  satuan: 'respawn'
}

const statistik = [
  { id: 'respawn', ikon: 'lucide:rotate-ccw', nilai: '24', label: 'Respawn' },
  { id: 'favorit', ikon: 'lucide:star', nilai: '8', label: 'Favorit' },
  { id: 'tersimpan', ikon: 'lucide:bookmark', nilai: '12', label: 'Tersimpan' },
  { id: 'aktivitas', ikon: 'lucide:activity', nilai: '36', label: 'Aktivitas' }
]
</script>

<template>
  <main class="konten profil">
    <h1 class="konten__judul">Profil</h1>
    <p class="konten__sub">
      Semua yang tersimpan untukmu, dikumpulkan di satu halaman.
    </p>

    <!-- Identitas ------------------------------------------------------------
         Semua yang di dalam kartu ini berubah begitu data profil nyata
         masuk: avatar jadi foto, tombol Ubah profil menyala, dan badge
         peran mengikuti peran sebenarnya. -->
    <section class="kartu identitas">
      <!-- Avatar masih ikon orang, bukan huruf. Huruf butuh inisial nama,
           sedangkan nama di sini masih placeholder — huruf "P" akan
           terbaca seperti identitas yang benar-benar sudah diisi. -->
      <div class="identitas__avatar" aria-hidden="true">
        <Icon name="lucide:user" class="identitas__avatar-ikon" />
      </div>

      <div class="identitas__data">
        <h2 class="identitas__nama">{{ profil.nama }}</h2>
        <p class="identitas__handle">{{ profil.handle }}</p>

        <!-- Peran tidak diberi warna status. "Peserta" itu keterangan,
             bukan status, dan warna harus punya arti, bukan hiasan.
             Warna status baru dipakai kalau isinya memang kondisi:
             aktif, tertunda, atau habis masa berlaku. -->
        <div class="identitas__tanda">
          <span class="badge">{{ profil.peran }}</span>
          <span class="badge badge--sukses">Aktif</span>
        </div>
      </div>

      <!-- Mati karena belum ada tempat menyimpan perubahan. Begitu form
           ubah profil ada, `disabled` ini cukup dihapus. -->
      <button type="button" class="tombol tombol--sekunder identitas__ubah" disabled>
        <Icon name="lucide:pencil" class="identitas__ikon" aria-hidden="true" />
        Ubah profil
      </button>
    </section>

    <!-- Meta: dua keterangan tentang keadaan profil saat ini. Bukan
         pintasan dan bukan menu, sehingga tidak punya baris yang bisa
         diketuk. -->
    <ul class="meta">
      <li class="meta__butir">
        <Icon name="lucide:calendar-days" class="meta__ikon" aria-hidden="true" />
        {{ profil.sejak }}
      </li>
      <li class="meta__butir">
        <Icon name="lucide:smartphone" class="meta__ikon" aria-hidden="true" />
        {{ profil.penyimpanan }}
      </li>
    </ul>

    <!-- Level ---------------------------------------------------------------- -->
    <section class="bagian">
      <h2 class="bagian__judul">Level</h2>

      <div class="kartu level">
        <div class="level__kepala">
          <span class="level__nama">{{ level.nama }}</span>
          <span class="level__nomor">Level {{ level.nomor }}</span>
        </div>

        <!-- Nilai bar, batas atas, dan keterangan ikut ke atribut aria.
             Tanpa itu, pembaca layar hanya tahu angkanya, bukan bahwa angka
             itu kemajuan ke level berikutnya. -->
        <div
          class="level__jalur"
          role="progressbar"
          :aria-valuenow="level.progres"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Kemajuan ke level berikutnya"
        >
          <span class="level__isi" :style="{ '--isi': `${level.progres}%` }" />
        </div>

        <!-- Persentase ditulis juga sebagai teks. Bar progres saja
             menyampaikan persentase hanya lewat panjang, dan panjang tidak
             bisa dibaca — itu yang membuat bar ini perlu angka yang bisa
             ditulis di sampingnya. -->
        <p class="level__ket">
          <span class="level__ket-angka">{{ level.progres }}%</span>
          {{ level.kurang }} lagi {{ level.satuan }} untuk naik ke level
          {{ level.nomor + 1 }}.
        </p>
      </div>
    </section>

    <!-- Statistik ----------------------------------------------------------- -->
    <section class="bagian">
      <h2 class="bagian__judul">Statistik</h2>

      <ul class="statistik">
        <li v-for="s in statistik" :key="s.id" class="kartu statistik__butir">
          <Icon :name="s.ikon" class="statistik__ikon" aria-hidden="true" />
          <span class="statistik__nilai">{{ s.nilai }}</span>
          <span class="statistik__label">{{ s.label }}</span>
        </li>
      </ul>
    </section>

    <!-- Keluar: berdiri sendiri di baris paling bawah, tanpa kartu.
         Tombol yang menghapus sesuatu sebaiknya tidak terlihat sama
         seperti tombol yang memanggil sesuatu. -->
    <section class="bagian">
      <button type="button" class="tombol tombol--sekunder keluar" disabled>
        <Icon name="lucide:log-out" class="keluar__ikon" aria-hidden="true" />
        Keluar dari perangkat ini
      </button>
      <p class="keluar__ket">
        Belum ada sesi yang bisa ditutup. Semua data profil masih
        tersimpan di perangkat ini.
      </p>
    </section>
  </main>
</template>

<style scoped>
/* Bawaan .konten cuma 4rem di bawah, sedangkan navbar bawah
   tetap 72px ditambah env(safe-area-inset-bottom). Tanpa ini
   konten terakhir tertutup navbar. Sama seperti di
   (settings)/settings.vue, (running-man)/running-man.vue, dan
   (search)/search.vue. */
.profil {
  padding-bottom: 10rem;
}

/* --- Kartu yang tidak bisa diklik ----------------------------- */

/* Kartu di halaman ini tidak ada yang bisa diklik ke mana pun, tapi
 * `.kartu` dari main.css mengubah warna garis saat hover. Hover itu
 * sinyal "ini punya tujuan", dan di sini tidak ada tujuan.
 *
 * Ditulis sebagai satu selector berumpun, bukan aturan terpisah per
 * kartu. Tiga aturan yang isinya sama persis adalah tempat di mana
 * ketiganya akan mulai berbeda sendiri nanti. */
.identitas:hover,
.level:hover,
.statistik__butir:hover {
  border-color: var(--garis-halus);
}

/* --- Identitas ------------------------------------------------ */

/* `flex-wrap` dipakai supaya tombol Ubah profil turun ke baris sendiri
 * di layar sempit. Data di samping avatar tetap di baris pertama, jadi
 * saat tombol turun, kolom yang isinya cuma satu kalimat tidak ikut
 * meninggi.
 *
 * `min-width: 0` pada kolom data itu penting: tanpa itu, teks panjang
 * menahan baris flex dan tombol terdorong ke baris bawah maupun di
 * layar yang sebenarnya cukup lebar. */
.identitas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;

  margin-top: 2rem;
  padding: 1.75rem;
}

/* Avatar 4rem, sama dengan mark huruf di halaman Running Man. Bentuknya
 * berbeda — lingkaran bukan persegi membulat — tapi skalanya harus sama,
 * supaya dua halaman punya bobot visual yang sama di baris paling atas
 * masing-masing. */
.identitas__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 4rem;
  height: 4rem;
  border-radius: 999px;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);

  color: var(--teks-lembut);
}

.identitas__avatar-ikon {
  font-size: 1.75rem;
}

.identitas__data {
  min-width: 0;
  flex: 1 1 12rem;
}

.identitas__nama {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--teks-utama);
}

.identitas__handle {
  margin-top: 0.125rem;
  font-size: 0.875rem;
  color: var(--teks-lembut);
}

.identitas__tanda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.identitas__ikon {
  font-size: 1rem;
}

/* Dorong ke kanan kalau ada ruang. Kalau tidak ada, tombol turun ke baris
 * sendiri dan `margin-left: auto` tidak berlaku karena barisnya sendiri
 * yang jadi satu blok penuh. */
.identitas__ubah {
  margin-left: auto;
}

/* --- Level ---------------------------------------------------- */

.level {
  padding: 1.5rem;
}

.level__kepala {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.level__nama {
  font-weight: 600;
  color: var(--teks-utama);
}

/* Angka level memakai warna aksen supaya menyatu dengan angka statistik.
 * Keduanya angka, bukan label, jadi tidak ikut setelan teks label. */
.level__nomor {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--teks-aksen);
  font-variant-numeric: tabular-nums;
}

/* Jejak dan isian dibedakan oleh dua hal sekaligus: warna dan tinggi.
 * Kalau hanya warna, keduanya tetap bisa tertukar saat kontras layar
 * turun. */
.level__jalur {
  height: 0.5rem;
  margin-top: 1rem;

  background: var(--garis-sedang);
  border-radius: 999px;
  overflow: hidden;
}

.level__isi {
  display: block;
  height: 100%;
  width: var(--isi, 0%);
  border-radius: inherit;

  background: var(--aksen-utama);
  transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.level__ket {
  margin-top: 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

/* Persentase. Aksen dan tabular karena ini angka yang harus sejajar
 * dengan bar progres di atasnya dan tidak boleh bergeser sendiri. */
.level__ket-angka {
  font-weight: 500;
  color: var(--teks-aksen);
  font-variant-numeric: tabular-nums;
}

/* --- Statistik ------------------------------------------------ */

/* auto-fit, bukan empat kolom tetap. Di layar sempit kolom ketiga menyempit
 * sampai angkanya mulai turun baris, sementara dua kolom masih muat dengan
 * lebar yang sama. Pola ini sama persis dengan yang dipakai di
 * (running-man)/(detail)/detail.vue. */
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
  /* Angka yang berubah-ubah tidak boleh geser lebarnya sendiri, sehingga
     rata kiri kolom yang sebelahnya ikut bergerak. */
  font-variant-numeric: tabular-nums;
}

.statistik__label {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--teks-sekunder);
}

/* --- Keluar --------------------------------------------------- */

/* Lebar penuh: ini tindakan terakhir di halaman, bukan pilihan di antara
 * beberapa lain. Tombol yang lebar penuh jelas dibaca sebagai pemisah
 * bagian, bukan tombol biasa. */
.keluar {
  width: 100%;
  justify-content: center;

  color: var(--galat);
}

.keluar__ikon {
  font-size: 1rem;
}

/* Hover dikunci untuk keadaan mati.
 *
 * `:hover` tetap berlaku pada tombol yang `disabled` — browser tidak
 * berhenti memoles elemen yang tidak bisa diklik. Akibatnya tombol ini
 * akan berubah warna saat kursor lewat di atasnya, dan itu persis
 * sinyal yang seharusnya tidak ada di tombol yang belum bisa dipakai.
 * CSS tidak punya `:not(:disabled)` bawaan untuk hal seperti ini, jadi
 * `:enabled` yang dipakai. */
.keluar:enabled:hover {
  border-color: var(--galat);
  background: var(--galat-latar);
}

.keluar__ket {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--teks-lembut);
}

/* --- Gerak ---------------------------------------------------- */

/* Halaman ini tidak punya gerak yang wajib diputar. Transisi di atas hanya
 * memberi tahu apa yang berubah, jadi matikan kalau pemakai meminta. */
@media (prefers-reduced-motion: reduce) {
  .level__isi {
    transition: none;
  }
}
</style>