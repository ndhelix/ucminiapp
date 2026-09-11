<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, dateText, errorText, localDate } from '@/api/workspace';
import type { Page } from '@/api/workspace';
import ListPager from '@/components/ListPager.vue';
interface Payment { Kind: string; Id: number; Created: string; ClientId: number | null; ClientName: string; TelegramId: number | null; Rub: number | null; Tokens: number | null; Status: string; Description: string; ExternalId: string | null; PaidAt: string | null }
const route = useRoute(), router = useRouter();
const from = ref(''), to = ref(''), kind = ref(''), client = ref('');
const names: Record<string, string> = { payment: 'Оплата', refund: 'Возврат', spend: 'Списание токенов', ledger: 'Движение токенов' };
const data = ref<(Page<Payment> & { Totals: { Income: number; Refunds: number } }) | null>(null), loading = ref(false), error = ref(''); let sequence = 0;
async function load() {
  const seq = ++sequence; loading.value = true; error.value = '';
  from.value = String(route.query.from || localDate().slice(0, 8) + '01'); to.value = String(route.query.to || localDate()); kind.value = String(route.query.kind || ''); client.value = String(route.query.client || '');
  try { const res = await api<Page<Payment> & { Totals: { Income: number; Refunds: number } }>('Payments', { From: from.value, To: to.value, Kind: kind.value, ClientId: client.value ? Number(client.value) : null, Page: Number(route.query.page || 1) }); if (seq === sequence) data.value = res; }
  catch (e) { if (seq === sequence) error.value = errorText(e); } finally { if (seq === sequence) loading.value = false; }
}
function filter(page = 1) { router.replace({ query: { from: from.value, to: to.value, kind: kind.value || undefined, client: client.value || undefined, page } }); }
watch(() => route.query, load, { immediate: true });
</script>
<template>
  <section class="workspace-page"><h1>Платежи от клиентов</h1><form class="filters" @submit.prevent="filter()"><label>С<input v-model="from" type="date" required></label><label>По<input v-model="to" type="date" required></label><label>ID клиента<input v-model="client" type="number" min="1" step="1" placeholder="Все клиенты"></label><label>Операции<select v-model="kind"><option value="">Платежи, возвраты и списания</option><option v-for="(name, key) in names" :key="key" :value="key">{{ name }}</option></select></label><button>Применить</button></form>
    <p v-if="error" class="error-text" role="alert">{{ error }} <button @click="load">Повторить</button></p><p v-if="loading">Загрузка…</p>
    <template v-if="data && !loading"><p v-if="!kind || kind === 'payment' || kind === 'refund'">Успешные оплаты: {{ data.Totals.Income.toLocaleString('ru-RU') }} ₽ · Возвраты: {{ data.Totals.Refunds.toLocaleString('ru-RU') }} ₽</p><p v-if="kind === 'ledger'" class="muted">Полный журнал токенов: начисления, покупки, списания, возвраты и корректировки.</p><p v-if="!data.Items.length">Операций за этот период нет.</p>
      <article v-for="x in data.Items" :key="`${x.Kind}:${x.Id}`" class="detail-section"><strong>{{ names[x.Kind] }} №{{ x.Id }}</strong><p><RouterLink v-if="x.ClientId" :to="`/clients/${x.ClientId}`">{{ x.ClientName || x.TelegramId || `Клиент №${x.ClientId}` }}</RouterLink><span v-else>Клиент не привязан</span></p><p>{{ dateText(x.Created) }} · {{ x.Status }}</p><p><span v-if="x.Rub !== null">{{ x.Rub.toLocaleString('ru-RU') }} ₽ </span><span v-if="x.Tokens !== null"> · {{ x.Tokens }} токенов</span></p><p v-if="x.PaidAt">Оплачен: {{ dateText(x.PaidAt) }}</p><p v-if="x.Description" class="full-text">{{ x.Description }}</p><small v-if="x.ExternalId" class="full-text">YooKassa: {{ x.ExternalId }}</small></article>
      <ListPager :page="data.Page" :total="data.Total" :loading="loading" @change="filter" />
    </template>
  </section>
</template>
