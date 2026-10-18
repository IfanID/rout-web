/** Mengunci gulir halaman selama ada dialog pencarian yang terbuka.
 *
 *  `<dialog>` yang dibuka dengan `showModal()` membuat isi halaman lain
 *  menjadi `inert`: tidak bisa diklik, tidak bisa difokus. Yang TIDAK
 *  dilakup adalah gulir — peramban tidak memasang `overflow: hidden`
 *  untuk kita. Roda atau geser di atas dialog tetap memindahkan
 *  halaman di belakangnya, dan gerakannya kelihatan di balik tirai
 *  sementara teks halaman ikut bergeser di belakang panel yang sedang
 *  dibaca.
 *
 *  `overscroll-behavior: contain` di `.grup__isi` sebenarnya sudah
 *  menutup sebagian kasus: kalau daftar panjang dan sudah sampai
 *  ujungnya, gulirannya tidak diteruskan ke dokumen. Tapi itu hanya
 *  berlaku kalau `.grup__isi` memang punya sesuatu untuk digulir.
 *  Kalau isinya muat, ia bukan wadah gulir sama sekali, dan gesturnya
 *  langsung jatuh ke dokumen. Itu sebabnya popup-nya kadang bisa
 *  digerakkan di belakang dan kadang tidak — tergantung berapa banyak
 *  isi dialognya, bukan tergantung perilakunya.
 *
 *  `SearchOverlay` lebih terbuka lagi: `.cari__layar` tidak punya
 *  wadah gulir sama sekali. Panelnya pendek — kepala, kolom, pesan —
 *  jadi hampir tidak pernah punya yang perlu digulir, dan setiap roda
 *  di atasnya jatuh ke dokumen.
 *
 *  Dipakai di `app.vue` satu kali, bukan di masing-masing dialog.
 *  Dua alasan. Yang pertama, ini berlaku untuk panel dan untuk popup
 *  sekaligus, dan keduanya membaca state dari `useSearchOverlay` yang
 *  sama — jadi satu watcher sudah menutup keduanya dan tidak bisa lupa
 *  untuk yang satu. Yang kedua, kalau dipasang per dialog, tiap
 *  dialog akan melepas kunci ketika state-nya berubah, dan ada saat
 *  keduanya menutup hampir bersamaan lalu salah satu melepas dulu.
 *
 *  Nilai sebelumnya disimpan lalu dikembalikan, bukan ditulis kosong.
 *  Elemen html bisa saja sudah punya `overflow` dari aturan lain, dan
 *  menimpanya dengan kosong akan menghapus itu tanpa ada yang
 *  memberitahu.
 *
 *  Batasnya: ini menutup peramban desktop. Di iOS Safari,
 *  `overflow: hidden` pada elemen html tidak mengunci halaman — di
 *  sana masih perlu `position: fixed` plus menyimpan dan mengembalikan
 *  posisi scroll, dan itu belum dikerjakan di sini. Belum ada laporan
 *  bahwa masalahnya muncul di sana, jadi jangan menambahkannya tanpa
 *  bukti.
 */

export function useKunciGulir() {
  const { terbuka, kelompokTerbuka } = useSearchOverlay()

  /* Server tidak punya `document`, dan tidak butuh mengunci apa pun —
     tidak ada yang bisa digulir sebelum HTML-nya dirender. */
  if (import.meta.server) return

  const html = document.documentElement

  /* Kosong belum tentu berarti "tidak ada nilai sebelumnya". Kalau
     elemen html memang sudah dikunci aturan lain sebelum dialog ini
     dibuka, nilai itu harus dikembalikan utuh. */
  let sebelumnya = ''

  watch(
    () => terbuka.value || kelompokTerbuka.value !== null,
    terkunci => {
      if (terkunci) {
        sebelumnya = html.style.overflow
        html.style.overflow = 'hidden'
        return
      }

      html.style.overflow = sebelumnya
    }
  )
}