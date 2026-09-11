<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, workspace, errorText, localDate } from '@/api/workspace';
import SubscriberChart from '@/components/SubscriberChart.vue';
import type { Series } from '@/components/SubscriberChart.vue';
const channels = workspace.me?.CompanyId === 8;
const kind = ref(channels ? 'dynamics' : 'adsources'), from = ref(localDate().slice(0, 8) + '01'), to = ref(localDate()), group = ref('day'), hidePublic = ref(false);
const loading = ref(false), error = ref('');
const dynamics = ref<{ Labels: string[]; Series: Series[] } | null>(null);
interface Transfer { Channel: string; Link: string; LinkName: string; SubscriberCount: number; ClientCount: number; TransferPercent: number; LeftCount: number; IncomeRub: number }
const transfers = ref<{ Items: Transfer[] } | null>(null), sources = ref<{ Items: { Name: string; Count: number }[] } | null>(null), bot = ref<{ BotStarts: number; BuyersCount: number; IncomeSumRub: number | null } | null>(null);
const available = computed(() => channels || workspace.me?.Permissions.IsAdmin);
async function load() {
  if (loading.value || !available.value) return; loading.value = true; error.value = ''; dynamics.value = null; transfers.value = null; sources.value = null; bot.value = null;
  try {
    if (kind.value === 'dynamics') dynamics.value = await api('SubscriberDynamics', { From: from.value, To: to.value, Group: group.value });
    if (kind.value === 'transfers') transfers.value = await api('SubscribersTransferReport', { Datepickfrom: from.value, Datepickto: to.value, HidePublic: hidePublic.value });
    if (kind.value === 'adsources') sources.value = await api('AdsourceStats', { From: from.value, To: to.value });
    if (kind.value === 'bot') bot.value = await api('BotStats');
  } catch (e) { error.value = errorText(e); } finally { loading.value = false; }
}
onMounted(load);
</script>
<template>
  <section class="workspace-page"><h1>Подписчики и аналитика</h1><RouterLink to="/reports">Переходы между тарифами</RouterLink>
    <p v-if="!available">Дополнительные отчёты недоступны для вашей компании или должности.</p>
    <template v-else><form class="filters" @submit.prevent="load"><label>Отчёт<select v-model="kind" :disabled="loading"><option v-if="channels" value="dynamics">Динамика подписчиков</option><option v-if="channels" value="transfers">Переходы из подписчиков</option><option v-if="channels" value="bot">Статистика ASHFXPRO</option><option v-if="workspace.me?.Permissions.IsAdmin" value="adsources">Источники рекламы</option></select></label>
      <template v-if="kind !== 'bot'"><label>С<input v-model="from" type="date" required></label><label>По<input v-model="to" type="date" required :min="from"></label></template>
      <label v-if="kind === 'dynamics'">Группировка<select v-model="group"><option value="day">По дням</option><option value="week">По неделям</option><option value="month">По месяцам</option></select></label>
      <label v-if="kind === 'transfers'" class="check-label"><input v-model="hidePublic" type="checkbox">Скрыть публичные ссылки</label><button :disabled="loading">Показать</button>
    </form><p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <template v-if="dynamics"><p class="muted">Отписки из подписавшихся за выбранный период, с группировкой по дате подписки — как в CRM. Нажмите название линии, чтобы скрыть или показать её.</p><SubscriberChart :labels="dynamics.Labels" :series="dynamics.Series" /></template>
    <template v-if="transfers"><p v-if="!transfers.Items.length">Данных нет.</p><article v-for="x in transfers.Items" :key="`${x.Channel}:${x.Link}`" class="detail-section"><strong>{{ x.Channel }} · {{ x.LinkName }}</strong><p class="full-text">{{ x.Link }}</p><p>Подписались: {{ x.SubscriberCount }} · Из них отписались: {{ x.LeftCount }}</p><p>Клиентов: {{ x.ClientCount }} · Переход: {{ x.TransferPercent }}%</p><p v-if="workspace.me?.Permissions.Finance">Доход: {{ x.IncomeRub }} ₽</p></article></template>
    <template v-if="sources"><p v-if="!sources.Items.length">Клиентов за этот период нет.</p><article v-for="x in sources.Items" :key="x.Name" class="detail-section"><strong>{{ x.Name }}</strong><p>Новых клиентов: {{ x.Count }}</p></article></template>
    <div v-if="bot" class="detail-section"><p class="muted">За всё время, среди доступных вам клиентов компании.</p><p>Клиентов, писавших боту: {{ bot.BotStarts }}</p><p>Покупателей: {{ bot.BuyersCount }}</p><p v-if="bot.IncomeSumRub !== null">Доход клиентов: {{ bot.IncomeSumRub }} ₽</p></div>
    </template>
  </section>
</template>
