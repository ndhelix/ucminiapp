<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, workspace, errorText, label, dateText } from '@/api/workspace';
import type { Page, Option } from '@/api/workspace';
import type { Mission } from '@/api/missions';
import ListPager from '@/components/ListPager.vue';
const route = useRoute(), router = useRouter();
const scope = ref('mine'), search = ref(''), status = ref('');
const data = ref<Page<Mission> | null>(null), statuses = ref<Option[]>([]);
const loading = ref(false), error = ref(''); let sequence = 0;
async function load() {
  const seq = ++sequence; loading.value = true; error.value = '';
  scope.value = String(route.query.scope || 'mine'); search.value = String(route.query.q || ''); status.value = String(route.query.status || '');
  try {
    const [result, lookups] = await Promise.all([api<Page<Mission>>('Missions', { Scope: scope.value, Search: search.value, StatusId: status.value ? Number(status.value) : null, Page: Number(route.query.page || 1) }), api<{ Statuses: Option[] }>('MissionLookups')]);
    if (seq === sequence) { data.value = result; statuses.value = lookups.Statuses; }
  } catch (e) { if (seq === sequence) error.value = errorText(e); }
  finally { if (seq === sequence) loading.value = false; }
}
function filter(page = 1) { router.replace({ query: { scope: scope.value, q: search.value || undefined, status: status.value || undefined, page } }); }
watch(() => route.query, load, { immediate: true });
</script>
<template>
  <section class="workspace-page">
    <div class="section-heading"><h1>Задачи</h1><RouterLink v-if="workspace.me?.Permissions.EditMissions" class="primary-link" to="/missions/new">Создать</RouterLink></div>
    <form class="filters" @submit.prevent="filter()"><label>Показать<select v-model="scope"><option value="mine">Мои</option><option value="created">Созданные мной</option><option value="overdue">Просроченные</option><option value="all">Все задачи компании</option></select></label>
      <label>Поиск<input v-model="search" maxlength="100"></label><label>Статус<select v-model="status"><option value="">Все</option><option v-for="s in statuses" :key="s.Id" :value="String(s.Id)">{{ s.Name }}</option></select></label><button>Применить</button></form>
    <p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }} <button @click="load">Повторить</button></p>
    <template v-if="data && !loading"><p v-if="!data.Items.length">Задач нет.</p><div class="record-list"><RouterLink v-for="x in data.Items" :key="x.Id" :to="`/missions/${x.Id}`" class="record-card">
      <strong>{{ x.Name || `Задача №${x.Id}` }}</strong><p>{{ label(statuses, x.StatusId) }} · {{ x.Closed ? 'Закрыта' : 'Открыта' }}</p><p>{{ label(workspace.lookups?.Managers, x.ManagerId) }}</p><p>Срок: {{ dateText(x.Planned).split(',')[0] }}</p>
    </RouterLink></div><ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="filter" /></template>
  </section>
</template>
