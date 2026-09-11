<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, errorText, dateText, localDate } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
interface Row { Id: number; Created: string; UserLogin: string; ActionType: string; EntityType: string; EntityId: number; EntityName: string; Property: string; OldValue: string; NewValue: string }
const data = ref<Page<Row> | null>(null), error = ref(''), loading = ref(false), from = ref(localDate().slice(0, 8) + '01'), to = ref(localDate()), search = ref('');
async function load(page = 1) { if (loading.value) return; loading.value = true; error.value = ''; try { data.value = await api('AuditLog', { From: from.value, To: to.value, Search: search.value, Page: page }); } catch (e) { error.value = errorText(e); } finally { loading.value = false; } }
function path(x: Row) { const paths: Record<string, string> = { Client: '/clients/', Event: '/events/', Manager: '/catalog/managers/', Mission: '/missions/', Service: '/catalog/services/', Campaign: '/catalog/campaigns/' }; return paths[x.EntityType] ? paths[x.EntityType] + x.EntityId : null; }
onMounted(() => load());
</script>
<template>
  <section class="workspace-page"><h1>Журнал действий</h1><p class="muted">Действия сотрудников текущей компании.</p><form class="filters" @submit.prevent="load()"><label>С<input v-model="from" type="date" required></label><label>По<input v-model="to" type="date" required :min="from"></label><label>Сотрудник или запись<input v-model="search" maxlength="100"></label><button>Найти</button></form><p v-if="error" class="error-text" role="alert">{{ error }}</p><p v-if="loading">Загрузка…</p>
    <template v-if="data && !loading"><p v-if="!data.Items.length">Записей нет.</p><article v-for="x in data.Items" :key="x.Id" class="detail-section"><strong>{{ x.UserLogin }} · {{ x.ActionType }}</strong><p>{{ dateText(x.Created) }}</p><RouterLink v-if="path(x)" :to="path(x)!">{{ x.EntityName || `${x.EntityType} №${x.EntityId}` }}</RouterLink><p v-else class="full-text">{{ x.EntityName }}</p><p v-if="x.Property">{{ x.Property }}</p><p v-if="x.OldValue || x.NewValue" class="full-text">{{ x.OldValue }} → {{ x.NewValue }}</p></article><ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="load" /></template>
  </section>
</template>
