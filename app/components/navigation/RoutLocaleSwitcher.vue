<script setup lang="ts">
const { locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav>
    <NuxtLink
      v-for="locale in locales"
      :key="locale.code"
      :to="switchLocalePath(locale.code)"
    >
      {{ locale.name }}
    </NuxtLink>
  </nav>
</template>