<template>
  <main class="pusat">
    <div class="pusat__isi">
      <h1 class="pusat__judul">{{ t('hero.judul') }}</h1>
      <p class="pusat__tagline">{{ t('hero.tagline') }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
.pusat {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 1.75rem);
  /* Ruang untuk navigasi bawah supaya konten tidak tertutup. */
  padding: 2rem 1.5rem 10rem;
  text-align: center;
}

.pusat__isi {
  max-width: 34rem;
}

.pusat__judul {
  font-size: clamp(2rem, 6vw, 3rem);
  letter-spacing: -0.03em;
  color: var(--teks-utama);
}

.pusat__tagline {
  margin-top: 0.875rem;
  font-size: 1.0625rem;
  color: var(--teks-sekunder);
}
</style>