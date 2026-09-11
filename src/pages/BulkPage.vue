<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { api, errorText, dateText, requestId } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
interface Target { Id: number; Name: string; TelegramId: number; Bot: string | null }
interface Batch { Id: number; MessageText: string; Created: string; Total: number; Delivered: number; Failed: number; Pending: number }
const idsText = ref(''), text = ref(''), error = ref(''), notice = ref(''), working = ref(false);
const preview = ref<{ Targets: Target[]; Count: number; Skipped: number; PreviewHash: string } | null>(null), history = ref<Page<Batch> | null>(null);
const details = ref<{ Id: number; Recipients: { ClientId: number; Sent: boolean; Failed: boolean; Error: string | null }[] } | null>(null);
let operationId = requestId();
watch([idsText, text], () => { preview.value = null; operationId = requestId(); });
function body() { const tokens = idsText.value.trim().split(/[\s,;]+/).filter(Boolean); if (!tokens.length || tokens.some(x => !/^\d+$/.test(x) || Number(x) < 1)) throw new Error('Введите ID клиентов через пробел или запятую.'); return { ClientIds: [...new Set(tokens.map(Number))], Text: text.value }; }
async function load(page = 1) { try { history.value = await api('BulkHistory', { Page: page }); } catch (e) { error.value = errorText(e); } }
async function prepare() { if (working.value) return; working.value = true; error.value = ''; try { preview.value = await api('PreviewBulk', body()); } catch (e) { error.value = errorText(e); } finally { working.value = false; } }
async function send() {
  if (working.value || !preview.value || !window.confirm(`Запустить рассылку ${preview.value.Count} клиентам?`)) return;
  working.value = true; error.value = '';
  try { const res = await api<{ Id: number }>('SendBulk', { ...body(), PreviewHash: preview.value.PreviewHash, RequestId: operationId }); idsText.value = ''; text.value = ''; preview.value = null; notice.value = `Рассылка №${res.Id} поставлена в очередь.`; await load(); }
  catch (e) { error.value = errorText(e); } finally { working.value = false; }
}
async function detail(id: number) { try { details.value = { Id: id, ...(await api<{ Recipients: NonNullable<typeof details.value>['Recipients'] }>('BulkHistory', { Id: id })) }; } catch (e) { error.value = errorText(e); } }
onBeforeRouteLeave(() => !text.value || window.confirm('Уйти без отправки сообщения?'));
onMounted(() => load());
</script>
<template>
  <section class="workspace-page"><h1>Массовые рассылки</h1><p class="muted">Сначала ASHFXPRO, иначе RTTM. Один бот на клиента. Получатели проверяются перед запуском.</p>
    <form class="editor" @submit.prevent="prepare"><fieldset :disabled="working"><label>ID клиентов (до 500)<textarea v-model="idsText" rows="3" required placeholder="123, 456, 789" /></label><label>Текст сообщения<textarea v-model="text" rows="6" maxlength="3000" required /></label><button>Проверить получателей</button></fieldset></form>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p>
    <section v-if="preview" class="detail-section"><h2>Предварительный просмотр</h2><p class="full-text">{{ text }}</p><p>Будет отправлено: {{ preview.Count }} · Пропущено: {{ preview.Skipped }}</p><details><summary>Получатели</summary><p v-for="x in preview.Targets" :key="x.Id"><RouterLink :to="`/clients/${x.Id}`">{{ x.Name || x.TelegramId || x.Id }}</RouterLink> — {{ x.Bot || 'Нет активного бота' }}</p></details><button :disabled="working || !preview.Count" @click="send">Запустить рассылку</button></section>
    <div class="section-heading"><h2>История</h2><button class="secondary" @click="load()">Обновить статусы</button></div>
    <template v-if="history"><p v-if="!history.Items.length">Рассылок нет.</p><article v-for="x in history.Items" :key="x.Id" class="detail-section"><strong>№{{ x.Id }} · {{ dateText(x.Created) }}</strong><p class="full-text">{{ x.MessageText }}</p><p>Всего: {{ x.Total }} · Доставлено: {{ x.Delivered }} · В очереди: {{ x.Pending }} · Ошибки: {{ x.Failed }}</p><button class="secondary" @click="detail(x.Id)">Статусы клиентов</button></article><ListPager :page="history.Page" :total="history.Total" :loading="working" @change="load" /></template>
    <section v-if="details" class="detail-section"><h2>Рассылка №{{ details.Id }}</h2><p v-for="x in details.Recipients" :key="x.ClientId"><RouterLink :to="`/clients/${x.ClientId}`">Клиент №{{ x.ClientId }}</RouterLink> — {{ x.Failed ? x.Error || 'Ошибка' : x.Sent ? 'Доставлено' : 'В очереди' }}</p><button class="secondary" @click="details = null">Закрыть</button></section>
  </section>
</template>
