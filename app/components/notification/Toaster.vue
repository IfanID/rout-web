<script setup lang="ts">
const { daftar, hapus, ikon } = useNotifications()

/** Toast dihapus saat bar progresnya selesai.
 *
 * Sengaja memakai event animation, bukan setTimeout terpisah. Bar itu
 * sudah berjalan dengan durasi yang sama dengan waktu hidup toast, dan
 * ikut berhenti saat kursor di atasnya — jadi tidak mungkin meleset.
 */
function saatBarSelesai(item: { id: number }) {
  hapus(item.id)
}
</script>

<template>
  <div
    class="tumpukan"
    role="status"
    aria-live="polite"
    aria-label="Notifikasi"
  >
    <TransitionGroup name="toast">
      <div
        v-for="item in daftar"
        :key="item.id"
        class="toast"
        :class="`toast--${item.type}`"
      >
        <span class="toast__ikon">
          <Icon :name="ikon(item.type)" />
        </span>

        <span class="toast__pesan">{{ item.pesan }}</span>

        <button
          type="button"
          class="toast__tutup"
          :aria-label="`Tutup notifikasi: ${item.pesan}`"
          @click="hapus(item.id)"
        >
          <Icon name="lucide:x" />
        </button>

        <span
          class="toast__progres"
          :style="{ animationDuration: `${item.durasi}ms` }"
          @animationend="() => saatBarSelesai(item)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tumpukan {
  position: fixed;
  /* Di bawah header yang sticky. Header sekarang sekitar 1.6rem,
     jadi 2.25rem memberi jarak yang cukup. */
  top: 2.25rem;
  right: 1.25rem;
  z-index: 50;

  display: flex;
  flex-direction: column;
  gap: 0.875rem;

  width: min(22rem, calc(100vw - 2.5rem));
  pointer-events: none;
}

.toast {
  position: relative;
  overflow: hidden;

  display: flex;
  align-items: center;
  gap: 0.75rem;

  padding: 0.75rem 1rem;

  background: var(--latar-naik-3);
  border: 1px solid var(--garis-sedang);
  border-radius: var(--radius-besar);

  pointer-events: auto;

  will-change: transform;
}

.toast__ikon {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  font-size: 0.8125rem;
}

.toast__pesan {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--teks-utama);
}

.toast__tutup {
  flex-shrink: 0;
  display: grid;
  place-items: center;

  width: 1.25rem;
  height: 1.25rem;
  padding: 0;

  background: transparent;
  border: 0;
  border-radius: 999px;

  font-size: 0.75rem;
  color: var(--teks-lembut);
  cursor: pointer;
  transition: color var(--transisi);
}

.toast__tutup:hover {
  color: var(--teks-utama);
}

/* Bar progres sekaligus alat pengatur waktu toast.
   Sepenuhnya CSS, jadi tidak ada timer JavaScript yang menulis ulang
   state tiap frame. Itu penyebab gerakan yang tersendat-sendat. */
.toast__progres {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 2px;

  transform-origin: left;
  animation-name: susut;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* Kursor di atas: bar berhenti, jadi toast juga ikut tertahan. */
.toast:hover .toast__progres {
  animation-play-state: paused;
}

@keyframes susut {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Warna per jenis, semua diturunkan dari token palet. */

.toast--sukses { border-color: color-mix(in srgb, var(--sukses) 40%, transparent); }
.toast--sukses .toast__ikon { background: var(--sukses-latar); color: var(--sukses); }
.toast--sukses .toast__progres { background: var(--sukses); }

.toast--gagal { border-color: color-mix(in srgb, var(--galat) 40%, transparent); }
.toast--gagal .toast__ikon { background: var(--galat-latar); color: var(--galat); }
.toast--gagal .toast__progres { background: var(--galat); }

.toast--info { border-color: color-mix(in srgb, var(--aksen-utama) 40%, transparent); }
.toast--info .toast__ikon { background: var(--aksen-latar); color: var(--teks-aksen); }
.toast--info .toast__progres { background: var(--aksen-utama); }

.toast--peringatan { border-color: color-mix(in srgb, var(--peringatan) 40%, transparent); }
.toast--peringatan .toast__ikon { background: var(--peringatan-latar); color: var(--peringatan); }
.toast--peringatan .toast__progres { background: var(--peringatan); }

/* Gerak. Durasi 320ms dengan easing yang melambat di akhir,
   supaya gerakannya mendarat halus dan bukan berhenti mendadak. */

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(110%) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(110%) scale(0.96);
}

/* Toast yang keluar dilepas dari flow supaya sisa toast bisa
   naik ke tempatnya tanpa ikut melebar. */
.toast-leave-active {
  position: absolute;
  inset-inline: 0;
}
</style>