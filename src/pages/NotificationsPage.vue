<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, dateText, errorText } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
interface Notification { Id: number; Message: string; Created: string; Unread: boolean; ClientId: number; ClientName: string; ChatId: number }
const data = ref<(Page<Notification> & { Unread: number; Through: string | null }) | null>(null), error = ref(''), loading = ref(false);
async function load(page = 1) {
  if (loading.value) return; loading.value = true; error.value = '';
  try { data.value = await api('Notifications', { Page: page }); } catch (e) { error.value = errorText(e); } finally { loading.value = false; }
}
async function mark() {
  if (!data.value?.Through || loading.value) return; loading.value = true; error.value = '';
  try { await api('ReadNotifications', { Through: data.value.Through }); } catch (e) { error.value = errorText(e); return; } finally { loading.value = false; }
  await load(data.value.Page);
}
onMounted(() => load());
</script>
<template>
  <section class="workspace-page"><h1>Уведомления</h1><p class="muted">Сообщения RTTM, как в разделе уведомлений CRM.</p>
    <div class="actions"><button class="secondary" :disabled="loading" @click="load()">Обновить</button><button v-if="data?.Unread && data.Through && data.Page === 1" :disabled="loading" @click="mark">Прочитано до последнего сообщения</button></div>
    <p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <template v-if="data"><p>Непрочитанных: {{ data.Unread }}</p><p v-if="!data.Items.length">Уведомлений нет.</p><article v-for="x in data.Items" :key="x.Id" class="detail-section"><RouterLink :to="`/clients/${x.ClientId}`">{{ x.ClientName || x.ChatId }}</RouterLink><strong v-if="x.Unread"> · Новое</strong><p class="muted">{{ dateText(x.Created) }}</p><p class="full-text">{{ x.Message }}</p></article><ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="load" /></template>
  </section>
</template>
