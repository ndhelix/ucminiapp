<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { api, dateText, errorText, requestId } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
const props = defineProps<{ clientId: number; ashActive: boolean }>();
interface Message { Key: string; Created: string; Text: string; Outgoing: boolean; Status: string }
const opened = ref(false), bot = ref(props.ashActive ? 'ASHFXPRO' : 'RTTM'), page = ref(1);
const data = ref<(Page<Message> & { CanSend: boolean }) | null>(null), text = ref(''), loading = ref(false), sending = ref(false), error = ref(''), notice = ref('');
let sequence = 0; let operationId = requestId();
async function load(silent = false) {
  const seq = ++sequence; if (!silent) { loading.value = true; error.value = ''; }
  try { const res = await api<Page<Message> & { CanSend: boolean }>('ClientDialog', { ClientId: props.clientId, Bot: bot.value, Page: page.value }); if (seq === sequence) data.value = res; }
  catch (e) { if (seq === sequence) error.value = errorText(e); }
  finally { if (seq === sequence) loading.value = false; }
}
async function send() {
  if (sending.value || !text.value.trim()) return; sending.value = true; error.value = ''; notice.value = '';
  try { await api('SendClientMessage', { ClientId: props.clientId, Bot: bot.value, Text: text.value, RequestId: operationId }); operationId = requestId(); text.value = ''; notice.value = 'Сообщение поставлено в очередь отправки.'; page.value = 1; await load(); }
  catch (e) { error.value = errorText(e); }
  finally { sending.value = false; }
}
watch([opened, bot, page], () => { if (opened.value) void load(); });
const timer = setInterval(() => { if (opened.value && !document.hidden && !loading.value && !sending.value) void load(true); }, 15000);
onBeforeUnmount(() => { sequence++; clearInterval(timer); });
</script>
<template>
  <section class="detail-section"><button class="secondary" :aria-expanded="opened" @click="opened = !opened">Переписка с клиентом {{ opened ? '−' : '+' }}</button>
    <template v-if="opened"><p class="muted">Последние 500 сообщений, новые сверху. Статус обновляется каждые 15 секунд.</p><label>Бот<select v-model="bot" :disabled="sending" @change="page = 1"><option>ASHFXPRO</option><option>RTTM</option></select></label>
      <p v-if="error" class="error-text" role="alert">{{ error }} <button @click="load()">Повторить</button></p><p v-if="notice" role="status">{{ notice }}</p><p v-if="loading">Загрузка…</p>
      <form v-if="data?.CanSend" class="editor" @submit.prevent="send"><label>Сообщение<textarea v-model="text" rows="4" maxlength="3000" required :disabled="sending" /></label><button :disabled="sending || !text.trim()">{{ sending ? 'Отправка…' : 'Отправить' }}</button></form>
      <p v-else-if="data" class="muted">Отправка недоступна: проверьте активность бота у клиента и свои права.</p>
      <template v-if="data"><p v-if="!data.Items.length">Сообщений нет.</p><article v-for="x in data.Items" :key="x.Key" class="dialog-message" :class="{ outgoing: x.Outgoing }"><small>{{ x.Outgoing ? 'Исходящее' : 'Входящее' }} · {{ dateText(x.Created) }}</small><p class="full-text">{{ x.Text }}</p><small>{{ x.Status }}</small></article><ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="page = $event" /></template>
    </template>
  </section>
</template>
<style scoped>
.dialog-message { padding: 12px; border: 1px solid var(--tg-theme-section-separator-color, #ddd); border-radius: 12px; margin-top: 10px; }
.outgoing { border-left: 4px solid var(--tg-theme-button-color, #2481cc); }
</style>
