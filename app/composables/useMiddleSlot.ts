/** Daftar pintasan untuk slot tengah navbar: satu item yang boleh
 *  diganti pemakai lewat halaman Pengaturan. Empat item lainnya
 *  di navbar tetap.
 *
 *  Ikon, label, dan keterangan disimpan sebagai satu paket. Kalau
 *  ikon bisa diganti tanpa label, pemakai bisa berakhir dengan
 *  lonceng berlabel "Pesanan".
 *
 *  Yang disimpan ke localStorage adalah `id`, bukan nama ikon.
 *  Kalau nanti ikon untuk `agenda` diganti, pilihan lama orang
 *  masih ketemu. Kalau yang disimpan nama ikon, pilihannya
 *  menggantung lalu diam-diam balik ke bawaan.
 */

/** Slot bawaan: mark huruf R.

 *  Id-nya memakai nama acaranya, bukan "rout". Nama produk tidak
 *  boleh dipakai sebagai identifier — lihat bagian Identitas di
 *  AGENTS.md. "rout" di sini akan bentrok dengan Rout yang
 *  sebenarnya, dan kunci localStorage-nya ikut membawa nama itu
 *  ke penyimpanan browser. */
const BAWAAN = 'running-man'

/** Kunci state, bukan kunci penyimpanan.
 *
 *  State hilang saat server direstart, dan itu wajar: isinya cuma
 *  hasil bacaan dari localStorage yang dimuat ulang di onMounted.
 *
 *  Sengaja tidak memakai nilai yang sama dengan KUNCI_SIMPAN di
 *  bawah. Kalau keduanya sama, mengubah satu ikut mengubah yang
 *  lain — pilihan yang sudah tersimpan tidak pernah ditemukan
 *  lagi, dan navbar diam-diam balik ke bawaan tanpa ada yang
 *  menyadarinya. */
const KUNCI_STATE = 'slot-tengah'

/** Kunci localStorage. Harus awet, karena isinya pilihan orang,
 *  bukan cache. Mengubah nilainya sama dengan membuang pilihan
 *  semua orang sekaligus.
 *
 *  Sengaja tidak memakai nama produk sebagai awalan, dan nilainya
 *  juga tidak sama dengan KUNCI_STATE di atas. */
const KUNCI_SIMPAN = 'slot-tengah:pilihan'

/** Penanda agar efek browser hanya dipasang sekali.
 *
 *  Composable ini dipanggil dari navbar dan dari halaman
 *  Pengaturan. Tanpa penanda ini, setiap panggilan menambah
 *  onMounted dan watch baru — pembacaannya idempoten dan
 *  penulisan menulis ulang nilai yang sama, jadi tidak merusak,
 *  tapi jumlahnya tumbuh tanpa ada yang menyadarinya.
 *
 *  Yang memasang efek siapa pun yang memanggil lebih dulu. Di
 *  app.vue, NuxtPage dirender sebelum BottomNav, jadi di halaman
 *  Pengaturan yang menang adalah halamannya. Tidak masalah: hook
 *  tetap terpasang ke instance yang sedang disusun, dan hook
 *  tersebut sudah menyala sebelum pengguna sempat bereaksi. */
let sudahTerpasang = false

/** Kolom `ikon`, `huruf`, dan `ke` selalu ditulis di semua entri,
 *  walau isinya kosong. Kalau salah satu hanya ada di sebagian
 *  entri, PINATASAN diperlakukan sebagai union dari dua bentuk
 *  objek, dan akses kolom itu di sisi yang tidak memilikinya
 *  berhenti jadi error tipe — bukan sekadar undefined saat
 *  runtime.
 *
 *  `ke` kosong berarti pintasan itu belum punya halaman, jadi item
 *  tengah di navbar dirender sebagai tombol mati. Saat ini hanya
 *  Running Man yang sudah punya halaman, di
 *  app/pages/(running-man)/running-man.vue.
 *
 *  `as const` bukan gaya penulisan. Tanpa itu `label` melebar jadi
 *  `string` dan pemanggilan `t()` ditolak, karena `t` dikunci ke
 *  kunci yang benar-benar ada di file locale.
 *
 *  `terjemah` hanya menyangkut `label`. `ket` selalu diterjemahkan,
 *  apa pun nilai `terjemah`: keterangan itu kalimat penjelasan,
 *  bukan brand. Orang yang membaca versi Korea tetap perlu tahu
 *  apa arti mark "R" itu, walaupun namanya sendiri tidak
 *  diterjemahkan. */
const PINATASAN = [
  // Mark huruf R. Bukan nama ikon, jadi butuh jalur render sendiri
  // dan tidak boleh ikut diterjemahkan.
  { id: 'running-man', ikon: '', huruf: 'R', label: 'Running Man', terjemah: false, ket: 'slot.running_man', ke: 'running-man' },
  { id: 'favorit', ikon: 'lucide:star', huruf: '', label: 'nav.favorit', terjemah: true, ket: 'slot.favorit', ke: '' },
  { id: 'tersimpan', ikon: 'lucide:bookmark', huruf: '', label: 'nav.tersimpan', terjemah: true, ket: 'slot.tersimpan', ke: '' },
  { id: 'aktivitas', ikon: 'lucide:activity', huruf: '', label: 'nav.aktivitas', terjemah: true, ket: 'slot.aktivitas', ke: '' }
] as const

export type Shortcut = (typeof PINATASAN)[number]

export function useMiddleSlot() {
  const { t } = useI18n()

  const terpilihId = useState<string>(KUNCI_STATE, () => BAWAAN)

  /** Id yang masih ada di daftar. Id basi dari versi lama ikut
   *  ditolak, bukan disimpan lalu dibiarkan menggantung. */
  function ada(id: string) {
    return PINATASAN.some(p => p.id === id)
  }

  function pilih(id: string) {
    if (ada(id)) terpilihId.value = id
  }

  if (import.meta.client && !sudahTerpasang) {
    sudahTerpasang = true

    /* Server selalu merender bawaan; pilihan yang tersimpan baru
       dibaca di browser. Navbar jadi berkedip sekali saat muat
       pertama. Pola yang sama sudah dipakai Header.vue untuk teks
       acaknya, dan di sini tidak bisa dihindari karena
       localStorage hanya ada di browser. */
    onMounted(() => {
      const tersimpan = localStorage.getItem(KUNCI_SIMPAN)
      if (tersimpan && ada(tersimpan)) terpilihId.value = tersimpan
    })

    watch(terpilihId, nilai => localStorage.setItem(KUNCI_SIMPAN, nilai))
  }

  const pintasan = computed<Shortcut>(
    () => PINATASAN.find(p => p.id === terpilihId.value) ?? PINATASAN[0]
  )

  /* "Running Man" itu nama acara dari Korea Selatan, bukan kunci
     terjemahan dan bukan brand Rout. Kalau dikirim ke `t()` apa
     adanya, vue-i18n tidak menemukannya dan mengembalikan teks itu
     sendiri — tampilan kebetulan benar, tapi setiap muat halaman
     memunculkan peringatan "translation missing" di console.

     Yang memutuskan adalah `terjemah`, bukan mengintip apakah
     string-nya diawali "nav.". */
  function labelUntuk(p: Shortcut) {
    return p.terjemah ? t(p.label) : p.label
  }

  /** Keterangan selalu diterjemahkan, lihat catatan di PINATASAN. */
  function ketUntuk(p: Shortcut) {
    return t(p.ket)
  }

  return {
    terpilihId,
    pintasan,
    label: computed(() => labelUntuk(pintasan.value)),
    ket: computed(() => ketUntuk(pintasan.value)),
    pilih,
    daftar: PINATASAN,
    labelUntuk,
    ketUntuk
  }
}