/** Hitung mundur ke jam tayang episode berikutnya.
 *
 *  Tiga bagian, dan pemisahan itu disengaja: dua yang pertama murni —
 *  masukannya waktu, keluarannya teks — sehingga aturannya bisa diuji
 *  tanpa peramban. Yang ketiga yang memasang penanda waktu.
 *
 *  **Kenapa jam tayangnya dikirim sebagai jam KOREA.** Sumbernya halaman
 *  program SBS, dan di sana jadwalnya tertulis dalam waktu Korea. Waktu
 *  Indonesia untuk kartu dihitung di halaman dari `SELISIH_WIB`, bukan
 *  disimpan lagi di sini — satu fakta, satu tempat.
 *
 *  **Kenapa menghitung mundur ke waktu Korea, bukan waktu Indonesia.**
 *  Hasilnya sama saja: yang dihitung cuma satu titik waktu. Yang dipakai
 *  waktu Korea karena itu bentuk aslinya, dan `+09:00` di alamat ISO
 *  membuat zona waktunya terbaca di kodenya sendiri — tidak ada angka
 *  sembilan yang harus diingat-ingat. */

import type { MaybeRefOrGetter, Ref } from 'vue'

/** Dua digit, untuk jam dan menit di alamat ISO. */
function duaAngka(nilai: number): string {
  return String(nilai).padStart(2, '0')
}

/** Berapa milidetik lagi sampai jam tayang.
 *
 *  Negatif berarti jam tayangnya sudah lewat.
 *
 *  `tanggal` tanggal tayang dalam bentuk `YYYY-MM-DD` menurut waktu
 *  Korea — bentuk yang sama dengan yang dikirim endpoint jadwal. */
export function sisaKeTayang(
  tanggal: string,
  jam: number,
  menit: number,
  sekarang: number
): number {
  const tayang = Date.parse(`${tanggal}T${duaAngka(jam)}:${duaAngka(menit)}:00+09:00`)

  /* Tanggalnya tidak terbaca: dikembalikan `NaN`, dan pemanggilnya yang
   * memutuskan untuk tidak menampilkan apa-apa. Mengembalikan nol akan
   * terbaca sebagai "sedang tayang", dan itu pernyataan yang salah. */
  if (Number.isNaN(tayang)) return Number.NaN

  return tayang - sekarang
}

/** Fase hitung mundur, dan angkanya kalau masih menghitung.
 *
 *  Empat keadaan, dan yang terakhir sengaja tanpa teks:
 *
 *  - `hitung`     — belum waktunya. "3 hari 5 jam" menghitung ke depan.
 *  - `tayang`     — jam tayangnya baru lewat kurang dari dua jam. Episode
 *                   terakhir panjangnya 101 menit, jadi dua jam cukup
 *                   untuk menutup satu tayangan dengan sedikit cadangan.
 *  - `hari-ini`   — tayangannya sudah lewat, tapi harinya belum. Sampai
 *                   di sini yang bisa dikatakan cuma "seharusnya tayang
 *                   hari ini"; apakah benar tayang, SBS yang menjawab
 *                   lewat daftar 다시보기 — dan selama episodenya belum
 *                   muncul di sana, tanggal di kartu memang belum
 *                   bergeser.
 *  - `lewat`      — harinya sudah lewat sementara episodenya tidak muncul
 *                   juga. Ini terjadi pada halaman yang dibiarkan terbuka
 *                   semalam: tanggal di kartunya masih kemarin karena
 *                   datanya baru diambil ulang 10 menit sekali. Yang
 *                   ditampilkan: tidak ada. Menghitung mundur ke tanggal
 *                   yang sudah lewat bukan hitung mundur, dan menulis
 *                   "tayang hari ini" untuk kemarin itu salah. */
export type FaseHitungMundur = 'hitung' | 'tayang' | 'hari-ini' | 'lewat'

export interface HitungMundur {
  fase: FaseHitungMundur
  /** Angka sisa waktunya, misalnya "3 hari 5 jam". Kosong di luar fase `hitung`. */
  teks: string
}

/** Dua jam, lihat catatan `tayang` di atas. */
const JENDELA_TAYANG = 2 * 3600 * 1000

/** Tanggal hari ini menurut waktu Korea, `YYYY-MM-DD`.
 *
 *  Dipakai `Intl` dengan nama zona `Asia/Seoul`, bukan penambahan sembilan
 *  jam. Hasilnya sama — Korea tidak memakai waktu musim panas — tapi
 *  angka sembilan yang ditulis di kode harus diingat artinya, sedangkan
 *  `Asia/Seoul` menjelaskan dirinya sendiri. */
function hariIniKST(sekarang: number): string {
  const bagian = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(sekarang))

  const ambil = (jenis: string) => bagian.find(satu => satu.type === jenis)?.value ?? ''

  return `${ambil('year')}-${ambil('month')}-${ambil('day')}`
}

/** Satuan dari yang paling besar, berhenti di dua yang terbesar. */
function satuan(ms: number) {
  const detik = Math.floor(ms / 1000)

  const hari = Math.floor(detik / 86400)
  const jam = Math.floor((detik % 86400) / 3600)
  const menit = Math.floor((detik % 3600) / 60)
  const sisaDetik = detik % 60

  /* Dua satuan saja, dan yang kedua cuma kalau yang pertama belum cukup
   * menggambarkan sisanya. "2 hari 0 jam" tidak lebih jelas dari "2 hari",
   * dan "0 menit 40 detik" justru yang paling jelas saat tinggal sebentar
   * lagi. */
  if (hari > 0) return jam > 0 ? `${hari} hari ${jam} jam` : `${hari} hari`
  if (jam > 0) return menit > 0 ? `${jam} jam ${menit} menit` : `${jam} jam`
  if (menit > 0) return `${menit} menit ${sisaDetik} detik`

  return `${sisaDetik} detik`
}

/** Keadaan hitung mundur pada satu titik waktu. */
export function faseHitungMundur(
  tanggal: string,
  jam: number,
  menit: number,
  sekarang: number
): HitungMundur {
  const sisa = sisaKeTayang(tanggal, jam, menit, sekarang)

  /* Tanggalnya tidak terbaca, atau harinya sudah lewat. Dua-duanya
   * berakhir sama: tidak ada yang ditampilkan. */
  if (Number.isNaN(sisa) || tanggal < hariIniKST(sekarang)) {
    return { fase: 'lewat', teks: '' }
  }

  if (sisa > 0) return { fase: 'hitung', teks: satuan(sisa) }

  if (sisa > -JENDELA_TAYANG) return { fase: 'tayang', teks: '' }

  return { fase: 'hari-ini', teks: '' }
}

/** Hitung mundurnya, diperbarui sendiri setiap detik.
 *
 *  Mengembalikan `null` sebelum dipasang di browser, dan itu disengaja:
 *  hitung mundur yang dirender server akan sudah basi begitu halamannya
 *  sampai di peramban — dan karena angkanya berubah setiap detik, render
 *  pertama di browser tidak akan sama dengan kiriman servernya, yang
 *  memunculkan peringatan hydration di console.
 *
 *  Yang menghitung ulang hanya komponen hitung mundurnya sendiri, bukan
 *  halamannya. Kalau state ini ditaruh di halaman beranda, seluruh beranda
 *  ikut dirender ulang setiap detik — termasuk limabelas kartu klipnya. */
export function useHitungMundur(
  tanggal: MaybeRefOrGetter<string>,
  jam: MaybeRefOrGetter<number>,
  menit: MaybeRefOrGetter<number>
): Ref<HitungMundur | null> {
  const keadaan = ref<HitungMundur | null>(null)

  let penanda: ReturnType<typeof setInterval> | null = null

  const perbarui = () => {
    keadaan.value = faseHitungMundur(toValue(tanggal), toValue(jam), toValue(menit), Date.now())
  }

  onMounted(() => {
    perbarui()

    /* Satu detik, bukan satu menit: angka detiknya ikut tampil begitu
     * sisanya tinggal sebentar lagi, dan penanda yang berganti-ganti
     * menurut jauhnya sisa waktu jauh lebih ribet daripada satu detik
     * yang selalu sama. */
    penanda = setInterval(perbarui, 1000)
  })

  onBeforeUnmount(() => {
    if (penanda) clearInterval(penanda)
  })

  return keadaan
}
