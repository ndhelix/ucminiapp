<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, errorText, workspace } from '@/api/workspace';
import type { CatalogDefinition } from '@/api/catalog';
const items = ref<CatalogDefinition[]>([]), error = ref(''), loading = ref(false);
async function load() { loading.value = true; error.value = ''; try { items.value = (await api<{ Items: CatalogDefinition[] }>('CatalogSections')).Items; } catch (e) { error.value = errorText(e); } finally { loading.value = false; } }
onMounted(load);
</script>
<template>
  <section class="workspace-page"><h1>Остальные разделы CRM</h1><p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }} <button @click="load">Повторить</button></p>
    <RouterLink v-for="x in items" :key="x.Kind" class="record-card" :to="`/catalog/${x.Kind}`"><strong>{{ x.Title }}</strong><small v-if="x.Global">Общий справочник CRM</small></RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.Messages && workspace.me?.CompanyId === 8" class="record-card" to="/bulk">Массовые рассылки</RouterLink>
    <RouterLink class="record-card" to="/exams">Пройти тест · Мои результаты</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.IsAdmin" class="record-card" to="/bot-stream">Последние сообщения ботов</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.IsAdmin" class="record-card" to="/audit">Журнал действий</RouterLink>
  </section>
</template>
