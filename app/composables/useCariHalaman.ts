/** Sumber pencarian yang tidak perlu server: halaman dan anggota cast.
 *
 *  Teksnya harus mengikuti bahasa pemakai, jadi dibangun di sisi app
 *  lewat `t()`. Kalau server yang mengirim judul halaman, judul itu akan
 *  terkunci pada satu bahasa — dan pencarian berbahasa Korea akan
 *  menampilkan hasil berbahasa Indonesia.
 *
 *  Menambah halaman nanti cukup menambah satu entri di `HALAMAN` dan
 *  kunci teksnya di tiga berkas locale. Tidak ada logika pencarian yang
 *  perlu disentuh.
 *
 *  Bentuk `KandidatStatis` masih membawa `bidang`, bukan skor. Skornya
 *  dihitung `useCari` dengan fungsi yang sama seperti server, supaya
 *  hasil statis dan hasil klip bisa diurutkan dalam satu aturan. */

import type { HasilCari } from '#shared/types/cari'
import { buatBidang, type BidangCari } from '#shared/utils/cari'

/** Kandidat yang belum punya skor. */
export type KandidatStatis = Omit<HasilCari, 'skor'> & {
  bidang: BidangCari[]
  /** Keterangan yang tampil tapi sengaja tidak bisa dicari. Lihat
   *  `keteranganSisa` di `HasilTampil`. */
  keteranganSisa?: string
}

/** Kata tambahan yang tidak muncul di judul atau keterangan.
 *
 *  Sengaja memuat potongan URL dan istilah yang lazim dipakai orang,
 *  bukan terjemahan penuh: keterangan halaman sudah diterjemahkan, jadi
 *  sinonim yang panjang di sini hanya akan menduplikasi teks locale.
 *
 *  Alias tidak ditampilkan, jadi tidak perlu ikut bahasa. */
interface Halaman {
  id: string
  rute: string
  judul: string
  keterangan: string
  alias: string[]
}

export function useCariHalaman() {
  const { t } = useI18n()
  const { daftar: anggota } = useRunningManAnggota()

  return computed<KandidatStatis[]>(() => {
    /* Judul memakai kunci yang sudah ada kalau memang sudah ada —
     * `nav.beranda`, `pengaturan.judul` — supaya nama halaman tidak
     * punya dua versi yang bisa berbeda. Halaman Running Man yang lebih
     * dalam belum punya judul di navbar, jadi kuncinya baru. */
    const halaman: Halaman[] = [
      {
        id: 'beranda',
        rute: 'index',
        judul: t('nav.beranda'),
        keterangan: t('cari.halaman.beranda'),
        alias: ['home', 'beranda', 'index', 'awal', 'depan']
      },
      {
        id: 'running-man',
        rute: 'running-man',
        judul: 'Running Man',
        keterangan: t('cari.halaman.running_man'),
        alias: ['running man', 'running-man', '런닝맨', 'variety', 'acara']
      },
      {
        id: 'running-man-detail',
        rute: 'running-man-detail',
        judul: t('cari.halaman.detail'),
        keterangan: t('cari.halaman.detail_ket'),
        alias: ['detail', 'tentang', 'about', 'cast', 'anggota', 'member', 'profil acara']
      },
      {
        id: 'running-man-episode',
        rute: 'running-man-episode',
        judul: t('cari.halaman.episode'),
        keterangan: t('cari.halaman.episode_ket'),
        alias: ['episode', 'daftar episode', '에피소드', 'nonton']
      },
      {
        id: 'running-man-streaming',
        rute: 'running-man-episode-streaming',
        judul: t('cari.halaman.streaming'),
        keterangan: t('cari.halaman.streaming_ket'),
        alias: ['streaming', 'nonton', 'watch', 'putar', 'video', 'episode']
      },
      {
        id: 'running-man-preview',
        rute: 'running-man-preview',
        judul: t('cari.halaman.preview'),
        keterangan: t('cari.halaman.preview_ket'),
        alias: ['preview', 'klip', 'clip', 'cuplikan', '예고']
      },
      {
        id: 'pengaturan',
        rute: 'settings',
        judul: t('pengaturan.judul'),
        keterangan: t('cari.halaman.pengaturan'),
        alias: [
          'pengaturan',
          'settings',
          'setting',
          'bahasa',
          'language',
          'slot',
          'tema'
        ]
      },
      {
        id: 'profil',
        rute: 'profile',
        judul: t('nav.profil'),
        keterangan: t('cari.halaman.profil'),
        alias: ['profil', 'profile', 'akun', 'account']
      },
      {
        id: 'aktivitas',
        rute: 'aktivitas',
        judul: t('nav.aktivitas'),
        keterangan: t('cari.halaman.aktivitas'),
        alias: ['aktivitas', 'activity', 'riwayat', 'history', 'notifikasi']
      }
    ]

    const hasilHalaman: KandidatStatis[] = halaman.map(satu => ({
      jenis: 'halaman',
      id: `halaman:${satu.id}`,
      judul: satu.judul,
      keterangan: satu.keterangan,
      rute: satu.rute,
      bidang: [
        buatBidang(satu.judul, 1, true),
        buatBidang(satu.alias.join(' '), 0.8),
        buatBidang(satu.keterangan, 0.6)
      ]
    }))

    /* Nama Latin dan Hangul sama-sama bobot penuh: orang bisa mencari
     * `jihyo` maupun `지효`, dan keduanya nama yang sah.
     *
     * `sapaan` SENGAJA tidak jadi field pencarian. Isinya bukan nama:
     * sebagian memang identitas asli, sebagian kalimat sindiran SBS.
     * Karena seluruh kalimatnya diindeks, setiap kata di dalamnya jadi
     * kata kunci — dan kueri pendek apa pun akan cocok dengan salah
     * satunya. `ma` ditemukan di "**ma**najer", "**na**ma", "ku**ma**",
     * "dra**ma**", "trouble**ma**ker", "me**ma**ksakan": delapan anggota
     * muncul, dan nol yang akibat namanya.
     *
     * Baris kedua hasil tetap menampilkan kalimat itu, tapi lewat
     * `keteranganSisa`, bukan `keterangan`. Jadi yang bisa disorot
     * tetap nama Korea, sedangkan "**ma**najer" di belakangnya tampil
     * tanpa tanda. Kalau tidak dipisah, sorotan akan menunjuk kata
     * yang bukan alasan hasilnya muncul.
     *
     * Pemisahnya sudah membawa " · " di dalamnya, bukan ditambahkan di
     * template — satu baris di sini lebih mudah diperiksa kalau ekornya
     * nanti berubah.
     *
     * Kalau nanti ada nama panggilan yang layak dicari, masukkan lewat
     * daftar alias terpisah, bukan dengan mengindeks ulang `sapaan`. */
    const hasilAnggota: KandidatStatis[] = anggota.map(satu => {
      const kunciSapaan = `anggota.orang.${satu.kunci}.sapaan`
      const sapaan = t(kunciSapaan)
      const sapaanAman = sapaan === kunciSapaan ? '' : sapaan

      return {
        jenis: 'anggota',
        id: `anggota:${satu.kunci}`,
        judul: satu.latin,
        keterangan: satu.nama,
        keteranganSisa: sapaanAman ? ` · ${sapaanAman}` : undefined,
        rute: 'running-man-detail',
        hash: `#anggota-${satu.kunci}`,
        gambar: satu.foto,
        bidang: [buatBidang(satu.latin, 1, true), buatBidang(satu.nama, 1, true)]
      }
    })

    return [...hasilHalaman, ...hasilAnggota]
  })
}
