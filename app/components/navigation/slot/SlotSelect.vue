<script setup lang="ts">
const { t } = useI18n()

const { terpilihId, pilih, daftar, labelUntuk, ketUntuk } = useMiddleSlot()

const menu = ref<HTMLDialogElement | null>(null)
const terbuka = ref(false)

function buka() {
  menu.value?.showModal()
  terbuka.value = true
}

function tutup() {
  menu.value?.close()
}

/* Escape sudah ditangani <dialog> sendiri, jadi yang perlu
   hanyalah menyinkronkan penanda saat jendela ditutup lewat
   tombol tutup, klik di luar, atau Escape. */
function saatTutup() {
  terbuka.value = false
}

/* Dialog ini memenuhi layar, jadi klik yang mendarat di elemen
   dialog itu sendiri berarti pengguna menekan area luar
   panel. Yang di dalam panel selalu punya target lain. */
function saatKlik(e: MouseEvent) {
  if (e.target === menu.value) tutup()
}

function pilihLaluTutup(id: string) {
  pilih(id)
  tutup()
}

const terpilih = computed(() =>
  daftar.find(p => p.id === terpilihId.value) ?? daftar[0]
)
</script>

<template>
  <div class="slot">
    <button
      type="button"
      class="slot__pemicu"
      :aria-expanded="terbuka"
      aria-haspopup="dialog"
      @click="buka"
    >
      <NavigationSlotMark
        class="slot__mark"
        :ikon="terpilih.ikon"
        :huruf="terpilih.huruf"
      />
      <!-- Pemicu sengaja hanya menampilkan nama, bukan
           keterangan. Keterangan itu sudah ada di dalam menunya,
           dan memakainya lagi di sini menambah tinggi baris
           supaya trigger tidak lagi muat satu baris. -->
      <span class="slot__nama">{{ labelUntuk(terpilih) }}</span>
      <Icon name="lucide:chevron-down" class="slot__panah" />
    </button>

    <dialog
      ref="menu"
      class="slot__layar"
      @click="saatKlik"
      @close="saatTutup"
    >
      <div class="slot__panel" role="group" :aria-label="t('pengaturan.pilih_slot')">
        <header class="slot__kepala">
          <h3 class="slot__judul">{{ t('pengaturan.pilih_slot') }}</h3>
          <button
            type="button"
            class="slot__tutup"
            :aria-label="t('pengaturan.tutup')"
            @click="tutup"
          >
            <Icon name="lucide:x" />
          </button>
        </header>

        <ul class="slot__daftar">
          <li v-for="p in daftar" :key="p.id">
            <button
              type="button"
              class="slot__opsi"
              :class="{ 'slot__opsi--terpilih': p.id === terpilihId }"
              :aria-pressed="p.id === terpilihId"
              @click="pilihLaluTutup(p.id)"
            >
              <!-- Cabang ikon vs huruf sengaja sama persis dengan di
                   BottomNav.vue. Kalau berbeda, pilihan di sini tidak
                   lagi kelihatan seperti yang akan muncul di navbar. -->
              <NavigationSlotMark
                class="slot__mark"
                :ikon="p.ikon"
                :huruf="p.huruf"
              />
              <span class="slot__nama">{{ labelUntuk(p) }}</span>
              <span class="slot__ket">{{ ketUntuk(p) }}</span>
              <Icon
                v-if="p.id === terpilihId"
                name="lucide:check"
                class="slot__centang"
              />
            </button>
          </li>
        </ul>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.slot {
  position: relative;
}

/* Pemicu ------------------------------------------------------------ */

.slot__pemicu {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-sedang);
  cursor: pointer;
  transition: border-color var(--transisi), background var(--transisi);
}

.slot__pemicu:hover {
  border-color: var(--aksen-utama);
}

/* Nama pada pemicu dan pada kartu di menu memakai aturan yang
   sama, jadi nama yang sama selalu tampil dengan ukuran yang
   sama. */
.slot__nama {
  font-weight: 600;
  color: var(--teks-utama);
}

.slot__panah {
  font-size: 1.125rem;
  color: var(--teks-lembut);
  margin-left: auto;
  flex-shrink: 0;
  transition: transform var(--transisi);
}

.slot__pemicu[aria-expanded='true'] .slot__panah {
  transform: rotate(180deg);
}

/* Layar -------------------------------------------------------------- */

/* Dialog memenuhi layar supaya target klik di luar panel selalu
   menimpa elemen dialog itu sendiri. Tanpa itu, area di sekitar
   panel tidak bisa dideteksi. */
.slot__layar {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  padding: 0;
  border: 0;
  background: transparent;
}

.slot__layar[open] {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.slot__layar::backdrop {
  background: rgb(0 0 0 / 60%);
}

/* Lebarnya dilebarkan dari 28rem ke 34rem karena isi per kartu
   ikut dibagi dua. Pada lebar lama, tiap kartu cuma sekitar 13rem
   dan keterangan jadi dua kali lebih sering terpotong. */
.slot__panel {
  width: min(34rem, 100%);
  max-height: min(38rem, 85vh);
  display: flex;
  flex-direction: column;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);
  box-shadow: 0 24px 64px rgb(0 0 0 / 50%);
  overflow: hidden;
}

.slot__kepala {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--garis-halus);
}

.slot__judul {
  font-size: 0.9375rem;
  color: var(--teks-utama);
}

.slot__tutup {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-sedang);
  color: var(--teks-sekunder);
  cursor: pointer;
  transition: color var(--transisi), border-color var(--transisi);
}

.slot__tutup:hover {
  color: var(--teks-utama);
  border-color: var(--garis-sedang);
}

/* Grid 2 kolom, bukan daftar baris.

   Sembilan opsi yang bentuknya sama-sama persis membuat menu ini
   terbaca sebagai tembok teks. Grid memecah pengulangan itu:
   ritme visualnya berubah, dan kartu jadi jauh lebih pendek dari
   baris, jadi panel tidak setinggi sebelumnya. */

.slot__daftar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;

  margin: 0;
  padding: 0.75rem;
  list-style: none;
  overflow-y: auto;
}

/* Opsi ---------------------------------------------------------------- */

.slot__opsi {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;

  width: 100%;
  padding: 0.875rem 0.75rem;
  text-align: center;
  background: none;

  /* Jangkar untuk centang di sudut. Tanpa ini, `position: absolute`
     pada .slot__centang akan mencari jangkar di luar panel dan
     centang akan terbang ke pojok layar. */
  position: relative;

  /* Border ada sejak awal, bukan hanya saat terpilih. Kalau hanya
     muncul saat terpilih, kartu terlihat melompat keluar begitu
     dipilih dan isi panel ikut bergeser. */
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-sedang);
  cursor: pointer;

  transition: background var(--transisi), border-color var(--transisi);
}

.slot__opsi:hover {
  background: var(--latar-sorot);
  border-color: var(--garis-sedang);
}

.slot__opsi--terpilih {
  background: var(--aksen-latar);
  border-color: var(--aksen-utama);
}

/* Warna mark berlaku untuk pemicu dan untuk kartu di menu.
   Aturannya sengaja tidak dipersempit ke .slot__opsi, karena
   pemicu di halaman Pengaturan juga memakai .slot__mark. */
.slot__mark {
  color: var(--teks-sekunder);
}

/* Mark di kartu dibuat sedikit lebih besar daripada di navbar,
   supaya ikon jadi titik berat kartu dan tidak tenggelam di
   antara nama dan keterangan. Override lewat --lebar-item, bukan
   lewat prop, karena SlotMark memang mengambil ukurannya dari
   variabel itu. */
.slot__opsi .slot__mark {
  --lebar-item: 1.75rem;
}

.slot__opsi .slot__nama {
  font-size: 0.875rem;
}

/* Keterangan dipangkas dua baris.

   Panjangnya keterangan berbeda-beda; yang terpanjang hampir dua
   kali kepanjangan yang terpendek. Tanpa pemangkasan, satu kartu
   menentukan tinggi seluruh barisnya dan baris lain jadi banyak
   ruang kosong. Dibatasi dua baris, semua kartu seragam. */
.slot__opsi .slot__ket {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--teks-sekunder);
}

/* Centang pindah ke sudut. Di tengah-tengah layout kolom, ia akan
   menambah satu baris dan membuat kartu terpilih terlihat satu
   tingkat lebih penuh dibanding yang lain. */
.slot__centang {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  font-size: 0.875rem;
  color: var(--teks-aksen);
}
</style>