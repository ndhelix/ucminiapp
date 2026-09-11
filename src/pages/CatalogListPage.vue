<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, errorText, localDate } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import { catalogText } from '@/api/catalog';
import type { CatalogDefinition, CatalogRecord } from '@/api/catalog';
import ListPager from '@/components/ListPager.vue';
const route = useRoute(), router = useRouter(), kind = computed(() => String(route.params.kind));
const data = ref<(Page<CatalogRecord> & { Definition: CatalogDefinition }) | null>(null), loading = ref(false), error = ref('');
const search = ref(''), from = ref(''), to = ref(''); let sequence = 0;
async function load() {
  const seq = ++sequence; loading.value = true; error.value = '';
  search.value = String(route.query.q || ''); from.value = String(route.query.from || localDate().slice(0, 8) + '01'); to.value = String(route.query.to || localDate());
  try { const res = await api<Page<CatalogRecord> & { Definition: CatalogDefinition }>('CatalogList', { Kind: kind.value, Page: Number(route.query.page || 1), Search: search.value, From: from.value, To: to.value, ParentId: route.query.parent ? Number(route.query.parent) : null }); if (seq === sequence) data.value = res; }
  catch (e) { if (seq === sequence) error.value = errorText(e); } finally { if (seq === sequence) loading.value = false; }
}
function filter(page = 1) { router.replace({ query: { parent: route.query.parent, q: search.value || undefined, from: data.value?.Definition.DateField ? from.value : undefined, to: data.value?.Definition.DateField ? to.value : undefined, page } }); }
function title(x: CatalogRecord) { const def = data.value!.Definition; const f = def.Fields.find(f => f.Name === def.TitleField); return f ? catalogText(f, x.Values[def.TitleField]) : `№${x.Id}`; }
watch(() => route.query, load, { immediate: true });
</script>
<template>
  <section class="workspace-page"><div class="section-heading"><h1>{{ data?.Definition.Title || 'Раздел CRM' }}</h1><RouterLink v-if="data?.Definition.CanEdit && data.Definition.CanCreate" class="primary-link" :to="{ path: `/catalog/${kind}/new`, query: { parent: route.query.parent } }">Создать</RouterLink></div>
    <p v-if="data?.Definition.Global" class="muted">Общие данные CRM. Изменения затронут все компании.</p>
    <form class="filters" @submit.prevent="filter()"><label>Поиск<input v-model="search" maxlength="100"></label><template v-if="data?.Definition.DateField"><label>С<input v-model="from" type="date" required></label><label>По<input v-model="to" type="date" required :min="from"></label></template><button>Найти</button></form>
    <p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }} <button @click="load">Повторить</button></p>
    <template v-if="data && !loading"><p v-if="!data.Items.length">Записей нет.</p><RouterLink v-for="x in data.Items" :key="x.Id" class="record-card" :to="`/catalog/${kind}/${x.Id}`"><strong>{{ title(x).slice(0, 120) }}</strong><small>№{{ x.Id }}</small><div v-for="f in data.Definition.Fields.filter(f => f.Name !== data!.Definition.TitleField).slice(0, 4)" :key="f.Name" class="preview-text">{{ f.Label }}: {{ catalogText(f, x.Values[f.Name]) }}</div></RouterLink><ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="filter" /></template>
  </section>
</template>
