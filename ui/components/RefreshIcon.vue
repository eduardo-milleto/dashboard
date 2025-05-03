<script setup>
const props = defineProps(['refreshing'])
</script>

<template>
  <ProgressSpinner v-if="refreshing" style="width: 1rem; height: 1rem" stroke-width="4"/>
</template>

<style scoped lang="scss">
.refresh-icon {
  color: color-mix(in srgb, var(--primary-color), transparent 50%);
}

</style>
