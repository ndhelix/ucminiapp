<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, workspace, errorText } from '@/api/workspace';
import type { EventListRow, Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
import EventCards from '@/components/EventCards.vue';
const route = useRoute(), router = useRouter();
const search = ref(''), manager = ref(''), type = ref(''), status = ref(''), from = ref(''), to = ref('');
const loading = ref(false), error = ref(''), result = ref<Page<EventListRow> | null>(null);
let sequence = 0;
const str = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : '';
async function load() {
  const serial = ++sequence;
  search.value = str('q'); manager.value = str('manager'); type.value = str('type'); status.value = str('status'); from.value = str('from'); to.value = str('to');
  loading.value = true; error.value = ''; result.value = null;
  try {
    const data = await api<Page<EventListRow>>('Events', { Search: search.value,
      ManagerId: manager.value === '' ? null : Number(manager.value), EventTypeId: type.value ? Number(type.value) : null,
      EventStatusId: status.value ? Number(status.value) : null, From: from.value, To: to.value, Page: Number(route.query.page) || 1 });
    if (serial === sequence) result.value = data;
  }
  catch (e) { if (serial === sequence) error.value = errorText(e); }
  finally { if (serial === sequence) loading.value = false; }
}
function filter(page = 1) {
  const query = { q: search.value || undefined, manager: manager.value || undefined, type: type.value || undefined,
    status: status.value || undefined, from: from.value || undefined, to: to.value || undefined, page: String(page) };
  if (router.resolve({ path: '/events', query }).fullPath === route.fullPath) load();
  else router.replace({ path: '/events', query });
}
watch(() => route.fullPath, load, { immediate: true });
</script>
<template>
  <section class="workspace-page">
    <div class="section-heading"><h1>События</h1><RouterLink v-if="workspace.me?.Permissions.EditEvents" to="/events/new" class="primary-link">Создать</RouterLink></div>
    <form class="filters" @submit.prevent="filter()">
      <label>Поиск<input v-model="search" maxlength="100" placeholder="Клиент или комментарий" type="search"></label>
      <label>С даты<input v-model="from" type="date"></label><label>По дату<input v-model="to" type="date"></label>
      <label>Ответственный<select v-model="manager"><option value="">Все</option><option value="0">Не назначен</option><option v-for="m in workspace.lookups?.Managers" :key="m.Id" :value="String(m.Id)">{{ m.Name }}</option></select></label>
      <label>Тип<select v-model="type"><option value="">Все</option><option v-for="t in workspace.lookups?.EventTypes" :key="t.Id" :value="String(t.Id)">{{ t.Name }}</option></select></label>
      <label>Статус<select v-model="status"><option value="">Все</option><option v-for="s in workspace.lookups?.EventStatuses" :key="s.Id" :value="String(s.Id)">{{ s.Name }}</option></select></label>
      <button :disabled="loading">Применить</button>
    </form>
    <p v-if="error" role="alert" class="error-text">{{ error }} <button @click="load">Повторить</button></p>
    <p v-if="loading" role="status">Загрузка…</p>
    <template v-if="result"><p v-if="!result.Items.length" class="muted">События не найдены.</p><EventCards :items="result.Items" /><ListPager :page="result.Page" :total="result.Total" :loading="loading" @change="filter" /></template>
  </section>
</template>
