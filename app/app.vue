<script setup lang="ts">
// Memasang <html lang>, link hreflang, dan canonical untuk tiap locale.
const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})

// Notifikasi episode Running Man yang baru tayang.
//
// Di sini, sekali saja, supaya berlaku di halaman mana pun — bukan hanya di
// halaman Running Man. Toaster di bawah sudah global, dan pemanggilnya harus
// setara; kalau pemanggilnya hidup di satu halaman, toast bisa naik dari
// halaman yang tidak pernah memasangnya. Lihat useEpisodeBaru.ts.
useEpisodeBaru()
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <template v-for="link in head.link" :key="link.id">
        <component :is="'link'" v-bind="link" />
      </template>
    </Head>
    <Body>
      <NavigationHeader />
      <NuxtPage />
      <NavigationBottomNav />
      <NotificationToaster />
    </Body>
  </Html>
</template>