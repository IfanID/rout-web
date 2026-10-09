<script setup lang="ts">
// Memasang <html lang>, link hreflang, dan canonical untuk tiap locale.
const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <template v-for="link in head.link" :key="link.id">
        <component :is="'link'" v-bind="link" />
      </template>
    </Head>
    <Body>
      <NuxtPage />
    </Body>
  </Html>
</template>