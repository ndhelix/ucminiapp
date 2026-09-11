<script setup lang="ts">
defineProps<{ page: number; total: number; loading: boolean }>();
defineEmits<{ change: [page: number] }>();
</script>
<template>
  <div class="pager">
    <button :disabled="loading || page <= 1" @click="$emit('change', page - 1)">Назад</button>
    <span>{{ page }} / {{ Math.max(1, Math.ceil(total / 30)) }} · {{ total }} записей</span>
    <button :disabled="loading || page * 30 >= total" @click="$emit('change', page + 1)">Далее</button>
  </div>
</template>
