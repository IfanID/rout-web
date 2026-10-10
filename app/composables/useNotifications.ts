export type NotificationType = 'sukses' | 'gagal' | 'info' | 'peringatan'

export interface Notification {
  id: number
  type: NotificationType
  pesan: string
  /** Durasi hidup dalam milidetik. Dipakai untuk animasi bar progres. */
  durasi: number
}

const DURASI_DEFAULT = 3000
const BATAS_MAKS = 3

const PETA_IKON: Record<NotificationType, string> = {
  sukses: 'lucide:check',
  gagal: 'lucide:x',
  info: 'lucide:info',
  peringatan: 'lucide:alert-triangle'
}

/** Counter module-level. Unik tanpa perlu crypto, cukup untuk id toast. */
let penghitung = 0

export function useNotifications() {
  const daftar = useState<Notification[]>('notifikasi-daftar', () => [])

  function tambah(type: NotificationType, pesan: string, durasi = DURASI_DEFAULT) {
    const id = ++penghitung

    // Yang baru di depan, yang lama keluar duluan.
    daftar.value = [
      { id, type, pesan, durasi },
      ...daftar.value
    ].slice(0, BATAS_MAKS)

    return id
  }

  function hapus(id: number) {
    daftar.value = daftar.value.filter(n => n.id !== id)
  }

  function bersihkan() {
    daftar.value = []
  }

  function ikon(type: NotificationType) {
    return PETA_IKON[type]
  }

  const notify = {
    sukses: (pesan: string, durasi?: number) => tambah('sukses', pesan, durasi),
    gagal: (pesan: string, durasi?: number) => tambah('gagal', pesan, durasi),
    info: (pesan: string, durasi?: number) => tambah('info', pesan, durasi),
    peringatan: (pesan: string, durasi?: number) => tambah('peringatan', pesan, durasi)
  }

  return {
    daftar,
    notify,
    hapus,
    bersihkan,
    ikon,
    durasiDefault: DURASI_DEFAULT,
    batasMaks: BATAS_MAKS
  }
}