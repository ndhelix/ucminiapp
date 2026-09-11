<script setup lang="ts">
import { ref, watch } from 'vue';
import { api, dateText, errorText } from '@/api/workspace';
const props = defineProps<{ clientId: number }>();
interface Billing {
  Balance: number; InquiryBalance: number;
  Subscriptions: { Id: number; ServiceCode: string; Started: string; ExpiresAt: string | null }[];
  Payments: { Id: number; Status: string; AmountRub: number; Created: string; PaidAt: string | null }[];
  Operations: { Id: number; Direction: string; Amount: number; Description: string; Created: string }[];
}
const data = ref<Billing | null>(null), error = ref(''), loading = ref(false);
async function load() {
  error.value = ''; loading.value = true; data.value = null;
  try { data.value = await api<Billing>('ClientBilling', { Id: props.clientId }); }
  catch (e) { error.value = errorText(e); }
  finally { loading.value = false; }
}
watch(() => props.clientId, load, { immediate: true });
</script>
<template>
  <section class="detail-section">
    <h2>Балансы и платежи</h2>
    <p v-if="loading">Загрузка…</p>
    <p v-if="error" role="alert" class="error-text">{{ error }} <button @click="load">Повторить</button></p>
    <template v-if="data">
      <div class="balance-row"><strong>{{ data.Balance.toLocaleString('ru-RU') }} токенов</strong><strong>{{ data.InquiryBalance.toLocaleString('ru-RU') }} запросов</strong></div>
      <details v-if="data.Subscriptions.length"><summary>Подписки (последние 100)</summary><div v-for="s in data.Subscriptions" :key="s.Id" class="history-row"><strong>{{ s.ServiceCode }}</strong><span>С {{ dateText(s.Started) }} · {{ s.ExpiresAt ? `до ${dateText(s.ExpiresAt)}` : 'бессрочно' }}</span></div></details>
      <details v-if="data.Payments.length"><summary>Платежи (последние 50)</summary><div v-for="p in data.Payments" :key="p.Id" class="history-row"><strong>{{ p.AmountRub }} ₽ · {{ p.Status }}</strong><span>{{ dateText(p.Created) }}<template v-if="p.PaidAt"> · Оплачен {{ dateText(p.PaidAt) }}</template></span></div></details>
      <details v-if="data.Operations.length"><summary>Движение токенов (последние 50)</summary><div v-for="o in data.Operations" :key="o.Id" class="history-row"><strong>{{ o.Direction === 'C' ? '+' : '−' }}{{ o.Amount }} токенов</strong><span>{{ dateText(o.Created) }} · {{ o.Description }}</span></div></details>
    </template>
  </section>
</template>
