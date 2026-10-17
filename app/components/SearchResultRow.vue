<script setup lang="ts">
import type { HasilTampil } from '~/composables/useCari'

/** Satu baris hasil pencarian.
 *
 *  Dipakai daftar campuran dan halaman kelompok. Keduanya harus terlihat
 *  sama — kalau markup-nya ditulis dua kali, suatu saat sorotan atau
 *  ukuran thumbnail hanya diperbaiki di salah satunya. */
const props = defineProps<{
  hasil: HasilTampil
}>()

const localePath = useLocalePath()

/** Tautan hasil SELALU lewat `localePath` dengan objek.
 *
 *  Argumen kedua `localePath` adalah bahasa, bukan params. Kesalahan itu
 *  pernah dua kali menghasilkan `<a>` tanpa `href` di halaman klip. */
const tautan = computed(() =>
  localePath({
    name: props.hasil.rute,
    params: props.hasil.params,
    query: props.hasil.query,
    hash: props.hasil.hash
  })
)

const IKON: Record<string, string> = {
  halaman: 'lucide:file-text',
  anggota: 'lucide:users',
  episode: 'lucide:clapperboard',
  klip: 'lucide:film'
}

function ikon(jenis: string): string {
  return IKON[jenis] ?? 'lucide:file-text'
}
</script>

<template>
  <li class="cari__butir">
    <NuxtLink :to="tautan" class="cari__baris">
      <span class="cari__media" :class="`cari__media--${hasil.jenis}`">
        <img
          v-if="hasil.jenis === 'klip' && hasil.gambar"
          :src="hasil.gambar"
          alt=""
          width="96"
          height="54"
          loading="lazy"
          decoding="async"
        >
        <img
          v-else-if="hasil.jenis === 'anggota' && hasil.gambar"
          :src="hasil.gambar"
          :alt="hasil.judul"
          width="44"
          height="44"
          loading="lazy"
          decoding="async"
        >
        <span v-else-if="hasil.jenis === 'episode'" class="cari__lencana">
          {{ hasil.lencana }}
        </span>
        <span v-else-if="hasil.jenis === 'anggota'" class="cari__lencana">
          {{ hasil.judul.charAt(0) }}
        </span>
        <Icon
          v-else
          :name="ikon(hasil.jenis)"
          class="cari__media-ikon"
          aria-hidden="true"
        />
      </span>

      <span class="cari__isi">
        <span class="cari__judul">
          <template v-for="(bagian, n) in hasil.sorot" :key="n">
            <mark v-if="bagian.cocok">{{ bagian.teks }}</mark>
            <template v-else>{{ bagian.teks }}</template>
          </template>
        </span>

        <!-- `keterangan` disorot, `keteranganSisa` tidak pernah. Pemisahan itu
             bukan tampilan: ekornya sengaja tidak bisa dicari, jadi kalau
             ikut disorot ia akan menunjuk kata yang bukan alasan baris ini
             muncul. Untuk anggota cast ekornya adalah kalimat `sapaan`;
             nama Koreanya sendiri ada di `keterangan` dan tetap disorot. -->
        <span v-if="hasil.keterangan" class="cari__ket">
          <template v-if="hasil.sorotKeterangan.length">
            <template v-for="(bagian, n) in hasil.sorotKeterangan" :key="n">
              <mark v-if="bagian.cocok">{{ bagian.teks }}</mark>
              <template v-else>{{ bagian.teks }}</template>
            </template>
          </template>
          <template v-else>{{ hasil.keterangan }}</template>
          <template v-if="hasil.keteranganSisa">{{ hasil.keteranganSisa }}</template>
        </span>
      </span>

      <Icon name="lucide:chevron-right" class="cari__panah" aria-hidden="true" />
    </NuxtLink>
  </li>
</template>

<style scoped>
/* Permukaannya sendiri, bukan `.kartu`: kartu dipakai untuk satu blok
   yang dibaca, sedangkan baris ini tautan yang harus terbaca sebagai
   satu kelompok saat digulir. */
.cari__baris {
  display: flex;
  align-items: center;
  gap: 0.875rem;

  padding: 0.75rem 0.875rem;

  background: var(--latar-naik-2);
  border: 1px solid var(--garis-halus);
  border-radius: var(--radius-besar);

  color: inherit;
  text-decoration: none;
  transition: border-color var(--transisi), background var(--transisi);
}

.cari__baris:hover {
  border-color: var(--garis-aktif);
  background: var(--latar-naik-3);
}

.cari__baris:focus-visible {
  outline: 2px solid var(--aksen-utama);
  outline-offset: 2px;
}

.cari__media {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  background: var(--aksen-latar);
  border-radius: var(--radius-sedang);
  color: var(--teks-aksen);
}

.cari__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Klip: 16:9, karena thumbnail-nya memang 16:9. Ukuran 5.5rem cukup
   untuk mengenali adegan tanpa mendorong judul ke kanan. */
.cari__media--klip {
  width: 5.5rem;
  aspect-ratio: 16 / 9;
}

.cari__media--anggota {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
}

.cari__media--halaman,
.cari__media--episode {
  width: 2.75rem;
  height: 2.75rem;
}

.cari__media-ikon {
  font-size: 1.25rem;
}

/* Huruf sebagai pengganti foto. Warnanya aksen, bukan abu-abu: ini
   mark, sama seperti mark huruf di kartu beranda. */
.cari__lencana {
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cari__isi {
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  min-width: 0;
}

.cari__judul {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--teks-utama);
}

/* Sorotan memakai warna aksen yang sudah ada, bukan warna baru. Latar
   tipis supaya teksnya tetap terbaca, bukan blok pekat. */
.cari__judul mark,
.cari__ket mark {
  padding: 0 0.0625rem;

  background: var(--aksen-latar);
  border-radius: 2px;
  color: var(--teks-aksen);
}

.cari__ket {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--teks-sekunder);
}

.cari__panah {
  flex-shrink: 0;
  margin-left: auto;

  color: var(--teks-lembut);
  font-size: 1rem;
}

@media (min-width: 48rem) {
  .cari__media--klip {
    width: 7rem;
  }
}
</style>
