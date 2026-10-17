/** Uji aturan pencarian yang dipakai server dan browser.
 *
 *  Yang diuji bukan tampilan, melainkan keputusan yang sulit dilihat
 *  mata: token mana yang dianggap cocok, skor mana yang menang, dan
 *  keadaan mana yang muncul saat hasil belum lengkap.
 *
 *  Jalankan dengan `npm test` (Node 26 sudah menjalankan TypeScript
 *  tanpa proses build tambahan). */

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  bandingKandidat,
  buatBidang,
  normalisasi,
  siapkanKueri,
  skorBidang,
  sorotan,
  terlaluPendek,
  tentukanKeadaan
} from '../shared/utils/cari.ts'

test('normalisasi menyamakan huruf besar, tanda hubung, dan diakritik', () => {
  assert.equal(normalisasi('  Song Ji-hyo  '), 'song ji hyo')
  assert.equal(normalisasi('Ji-hyo'), normalisasi('Ji Hyo'))
  assert.equal(normalisasi('Café'), 'cafe')
  assert.equal(normalisasi('지효'), '지효')
})

test('token dipecah dan dibuang duplikatnya', () => {
  const siap = siapkanKueri('Running  running MAN')

  assert.deepEqual(siap.token, ['running', 'man'])
  assert.equal(siap.qUtuh, 'runningman')
})

test('skor mengutamakan kecocokan yang lebih utuh', () => {
  const bidang = [buatBidang('Running Man')]

  const sama = skorBidang(siapkanKueri('running man'), bidang)
  const awalan = skorBidang(siapkanKueri('running'), bidang)
  const potongan = skorBidang(siapkanKueri('unning'), bidang)

  assert.ok(sama !== null && awalan !== null && potongan !== null)
  assert.ok(sama > awalan)
  assert.ok(awalan > potongan)
})

test('semua token wajib cocok, bukan salah satu', () => {
  const bidang = [buatBidang('Running Man clip')]

  assert.notEqual(skorBidang(siapkanKueri('running man'), bidang), null)
  assert.equal(skorBidang(siapkanKueri('running episode'), bidang), null)
})

test('nama tanpa spasi tetap menemukan bentuk bertanda hubung', () => {
  const bidang = [buatBidang('Song Ji-hyo', 1, true)]

  const berspasi = skorBidang(siapkanKueri('ji hyo'), bidang)
  const rapat = skorBidang(siapkanKueri('jihyo'), bidang)

  assert.ok(berspasi !== null)
  assert.ok(rapat !== null)
})

test('huruf Latin tunggal dianggap terlalu pendek, angka dan Hangul tidak', () => {
  assert.equal(terlaluPendek('a'), true)
  assert.equal(terlaluPendek('ab'), false)
  assert.equal(terlaluPendek('7'), false)
  assert.equal(terlaluPendek('효'), false)
})

test('sorotan memotong teks asli, bukan teks normalisasi', () => {
  const potongan = sorotan('Song Ji-hyo di Running Man', 'ji-hyo')

  assert.deepEqual(
    potongan.map(satu => satu.teks).join(''),
    'Song Ji-hyo di Running Man'
  )
  assert.ok(potongan.some(satu => satu.cocok && satu.teks === 'Ji'))
  assert.ok(potongan.some(satu => satu.cocok && satu.teks === 'hyo'))
})

test('sorotan tidak memaksa cocok kalau diakritiknya berbeda', () => {
  const potongan = sorotan('Café', 'cafe')

  assert.deepEqual(potongan, [{ teks: 'Café', cocok: false }])
})

test('keadaan awal menang tanpa kueri', () => {
  const hasil = tentukanKeadaan({
    kueri: '   ',
    jumlahHasil: 0,
    memuat: true,
    galat: true,
    indeks: 'kosong',
    terindeks: 0,
    online: false
  })

  assert.equal(hasil.fase, 'awal')
  assert.equal(hasil.offline, true)
})

test('satu huruf Latin berhenti sebelum memanggil server', () => {
  const hasil = tentukanKeadaan({
    kueri: 'a',
    jumlahHasil: 0,
    memuat: false,
    galat: false,
    indeks: 'lengkap',
    terindeks: 8000,
    online: true
  })

  assert.equal(hasil.fase, 'pendek')
})

test('hasil tetap tampil walau indeks baru sebagian', () => {
  const hasil = tentukanKeadaan({
    kueri: 'jihyo',
    jumlahHasil: 1,
    memuat: true,
    galat: false,
    indeks: 'sebagian',
    terindeks: 1000,
    online: true
  })

  assert.equal(hasil.fase, 'hasil')
  assert.equal(hasil.sementara, true)
  assert.equal(hasil.memperbarui, true)
})

test('nol hasil selama indeks sebagian belum final', () => {
  const hasil = tentukanKeadaan({
    kueri: 'episode 500',
    jumlahHasil: 0,
    memuat: false,
    galat: false,
    indeks: 'sebagian',
    terindeks: 1000,
    online: true
  })

  assert.equal(hasil.fase, 'kosong')
  assert.equal(hasil.sementara, true)
})

test('nol hasil setelah indeks lengkap baru final', () => {
  const hasil = tentukanKeadaan({
    kueri: 'tidak ada',
    jumlahHasil: 0,
    memuat: false,
    galat: false,
    indeks: 'lengkap',
    terindeks: 8000,
    online: true
  })

  assert.equal(hasil.fase, 'kosong')
  assert.equal(hasil.sementara, false)
})

test('kegagalan tanpa hasil menjadi keadaan galat', () => {
  const hasil = tentukanKeadaan({
    kueri: 'running',
    jumlahHasil: 0,
    memuat: false,
    galat: true,
    indeks: 'gagal',
    terindeks: 0,
    online: true
  })

  assert.equal(hasil.fase, 'galat')
  assert.equal(hasil.indeksGagal, true)
})

test('urutan hasil stabil untuk pemotongan halaman', () => {
  const hasil = [
    { skor: 100, tanggal: '2020-01-01', id: 'b' },
    { skor: 200, tanggal: '2019-01-01', id: 'a' },
    { skor: 100, tanggal: '2021-01-01', id: 'c' },
    { skor: 100, tanggal: '2021-01-01', id: 'a' }
  ].sort(bandingKandidat)

  assert.deepEqual(
    hasil.map(satu => satu.id),
    ['a', 'a', 'c', 'b']
  )
})
