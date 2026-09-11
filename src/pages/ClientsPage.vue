<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, workspace, label, errorText } from '@/api/workspace';
import type { ClientRecord, Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';

const route = useRoute(), router = useRouter();
const search = ref(''), manager = ref(''), adsource = ref(''), bot = ref('');
const loading = ref(false), error = ref('');
const result = ref<Page<ClientRecord> | null>(null);
let sequence = 0;
function queryString(key: string) { return typeof route.query[key] === 'string' ? route.query[key] as string : ''; }
async function load() {
  const serial = ++sequence;
  search.value = queryString('q'); manager.value = queryString('manager');
  adsource.value = queryString('adsource'); bot.value = queryString('bot');
  loading.value = true; error.value = ''; result.value = null;
  try {
    const data = await api<Page<ClientRecord>>('Clients', {
      Search: search.value, ManagerId: manager.value === '' ? null : Number(manager.value),
      AdsourceId: adsource.value === '' ? null : Number(adsource.value), Bot: bot.value,
      Page: Number(route.query.page) || 1,
    });
    if (serial === sequence) result.value = data;
  }
  catch (e) { if (serial === sequence) error.value = errorText(e); }
  finally { if (serial === sequence) loading.value = false; }
}
function filter(page = 1) {
  const query = { q: search.value || undefined, manager: manager.value || undefined,
    adsource: adsource.value || undefined, bot: bot.value || undefined, page: String(page) };
  if (router.resolve({ path: '/clients', query }).fullPath === route.fullPath) load();
  else router.replace({ path: '/clients', query });
}
watch(() => route.fullPath, load, { immediate: true });
</script>
<template>
  <section class="workspace-page">
    <div class="section-heading"><h1>Клиенты</h1><RouterLink v-if="workspace.me?.Permissions.EditClients" class="primary-link" to="/clients/new">Создать</RouterLink></div>
    <form class="filters" @submit.prevent="filter()">
      <label>Поиск<input v-model="search" maxlength="100" placeholder="Имя, телефон, Telegram ID" type="search"></label>
      <label>Менеджер<select v-model="manager"><option value="">Все доступные</option><option value="0">Не назначен</option><option v-for="m in workspace.lookups?.Managers" :key="m.Id" :value="String(m.Id)">{{ m.Name }}</option></select></label>
      <label>Источник<select v-model="adsource"><option value="">Все</option><option v-for="s in workspace.lookups?.Adsources" :key="s.Id" :value="String(s.Id)">{{ s.Name }}</option></select></label>
      <label>Активность ботов<select v-model="bot"><option value="">Любая</option><option value="any">RTTM или ASHFXPRO</option><option value="rttm">RTTM</option><option value="ash">ASHFXPRO</option><option value="none">Ни один</option></select></label>
      <button type="submit" :disabled="loading">Найти</button>
    </form>
    <p v-if="error" role="alert" class="error-text">{{ error }} <button @click="load">Повторить</button></p>
    <p v-if="loading" role="status">Загрузка…</p>
    <template v-if="result">
      <p v-if="!result.Items.length" class="muted">Клиенты не найдены.</p>
      <RouterLink v-for="c in result.Items" :key="c.Id" :to="`/clients/${c.Id}`" class="record-card">
        <strong>{{ c.Name || c.TelegramId || `Клиент №${c.Id}` }}</strong>
        <span>{{ c.Phone || c.Telegram || c.TelegramId || 'Контакт не указан' }}</span>
        <span class="muted">{{ label(workspace.lookups?.Managers, c.ManagerId) }} · {{ label(workspace.lookups?.Adsources, c.AdsourceId) }}</span>
        <span v-if="c.RttmBotActive || c.AshfxproBotActive">{{ c.RttmBotActive ? 'RTTM' : '' }} {{ c.AshfxproBotActive ? 'ASHFXPRO' : '' }}</span>
      </RouterLink>
      <ListPager :page="result.Page" :total="result.Total" :loading="loading" @change="filter" />
    </template>
  </section>
</template>
