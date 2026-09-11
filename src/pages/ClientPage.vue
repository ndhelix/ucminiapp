<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { api, workspace, errorText, dateText, label, requestId } from '@/api/workspace';
import type { ClientRecord, EventListRow, Page } from '@/api/workspace';
import ClientDialog from '@/components/ClientDialog.vue';
import ClientBilling from '@/components/ClientBilling.vue';
import EventCards from '@/components/EventCards.vue';
import ListPager from '@/components/ListPager.vue';
const route = useRoute(), router = useRouter();
const isNew = computed(() => route.path === '/clients/new');
const client = ref<ClientRecord | null>(null), form = ref<ClientRecord | null>(null);
const loading = ref(false), saving = ref(false), editing = ref(false), error = ref(''), notice = ref('');
const events = ref<Page<EventListRow> | null>(null), eventsLoading = ref(false), eventsError = ref('');
const channels = ref<{ Id: number; Name: string }[]>([]);
let operationId = requestId();
const dirty = computed(() => editing.value && JSON.stringify(form.value) !== JSON.stringify(client.value));
const managers = computed(() => workspace.lookups?.Managers.filter(m => m.Active || m.Id === form.value?.ManagerId) ?? []);
async function loadEvents(page = 1) {
  eventsError.value = ''; eventsLoading.value = true;
  try { events.value = await api<Page<EventListRow>>('Events', { ClientId: Number(route.params.id), Page: page }); }
  catch (e) { eventsError.value = errorText(e); }
  finally { eventsLoading.value = false; }
}
async function load() {
  loading.value = true; error.value = ''; client.value = null; form.value = null; events.value = null; channels.value = [];
  operationId = requestId();
  try {
    if (isNew.value) {
      client.value = { Id: 0, Name: '', Firstname: '', Lastname: '', Patronymic: '', Phone: '', Email: '', Telegram: '', TelegramId: null,
        ManagerId: workspace.me!.ManagerId, AdsourceId: 0, ClientTypeId: 1, Comments: '', Created: '', SubscribedTill: null,
        RttmBotActive: false, AshfxproBotActive: false, Revision: '' };
      editing.value = true;
    }
    else {
      const res = await api<{ Item: ClientRecord; Channels: { Id: number; Name: string }[] }>('ClientDetails', { Id: Number(route.params.id) });
      client.value = res.Item; channels.value = res.Channels; editing.value = false;
      void loadEvents();
    }
    form.value = { ...client.value! };
  }
  catch (e) { error.value = errorText(e); }
  finally { loading.value = false; }
}
async function save() {
  if (!form.value || saving.value) return;
  saving.value = true; error.value = ''; notice.value = '';
  try {
    const data = await api<{ Id: number }>('SaveClient', { ...form.value, RequestId: operationId,
      TelegramId: form.value.TelegramId === null || String(form.value.TelegramId) === '' ? null : Number(form.value.TelegramId) });
    editing.value = false; notice.value = 'Изменения сохранены.';
    if (isNew.value) await router.replace(`/clients/${data.Id}`);
    else await load();
  }
  catch (e) { error.value = errorText(e); }
  finally { saving.value = false; }
}
function cancel() {
  if (dirty.value && !window.confirm('Отменить несохранённые изменения?')) return;
  form.value = client.value ? { ...client.value } : null; editing.value = false;
  if (isNew.value) router.push('/clients');
}
onBeforeRouteLeave(() => !dirty.value || window.confirm('Уйти без сохранения изменений?'));
watch(() => route.params.id, load, { immediate: true });
</script>
<template>
  <section class="workspace-page">
    <div class="section-heading"><h1>{{ isNew ? 'Новый клиент' : client?.Name || 'Клиент' }}</h1><button v-if="client && !editing && workspace.me?.Permissions.EditClients" @click="editing = true">Изменить</button></div>
    <p v-if="loading" role="status">Загрузка…</p>
    <p v-if="notice" role="status" class="success-text">{{ notice }}</p>
    <p v-if="error" role="alert" class="error-text">{{ error }} <button v-if="!editing" @click="load">Повторить</button></p>
    <form v-if="form && editing && workspace.me?.Permissions.EditClients" class="editor" @submit.prevent="save">
      <fieldset :disabled="saving">
        <label>Имя<input v-model="form.Firstname" required maxlength="50" autocomplete="given-name"></label>
        <label>Фамилия<input v-model="form.Lastname" maxlength="50" autocomplete="family-name"></label>
        <label>Отчество<input v-model="form.Patronymic" maxlength="50"></label>
        <label>Телефон<input v-model="form.Phone" type="tel" maxlength="50" autocomplete="tel"></label>
        <label>Email<input v-model="form.Email" type="email" maxlength="50"></label>
        <label>Telegram username<input v-model="form.Telegram" maxlength="100" placeholder="Без @"></label>
        <label>Telegram ID<input v-model="form.TelegramId" inputmode="numeric" pattern="[0-9]*"></label>
        <label>Менеджер<select v-model.number="form.ManagerId" :disabled="!workspace.me?.Permissions.AssignClients"><option :value="0">Не назначен</option><option v-for="m in managers" :key="m.Id" :value="m.Id">{{ m.Name }}</option></select></label>
        <label>Источник рекламы<select v-model.number="form.AdsourceId"><option :value="0">Не указан</option><option v-for="s in workspace.lookups?.Adsources" :key="s.Id" :value="s.Id">{{ s.Name }}</option></select></label>
        <label>Тип клиента<select v-model.number="form.ClientTypeId"><option :value="1">Клиент</option><option :value="2">Подписчик</option></select></label>
        <label>Комментарии<textarea v-model="form.Comments" rows="6" maxlength="2000" /></label>
        <div class="actions"><button type="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button><button type="button" class="secondary" @click="cancel">Отмена</button></div>
      </fieldset>
    </form>
    <template v-if="client && !editing">
      <div class="detail-section">
        <p v-if="client.Phone"><a :href="`tel:${client.Phone}`">{{ client.Phone }}</a></p>
        <p v-if="client.Email"><a :href="`mailto:${client.Email}`">{{ client.Email }}</a></p>
        <p v-if="client.Telegram">Telegram: @{{ client.Telegram }}</p><p v-if="client.TelegramId">Telegram ID: {{ client.TelegramId }}</p>
        <p>Менеджер: {{ label(workspace.lookups?.Managers, client.ManagerId) }}</p>
        <p>Источник: {{ label(workspace.lookups?.Adsources, client.AdsourceId) }}</p>
        <p>Создан: {{ dateText(client.Created) }}</p>
        <p>RTTM: {{ client.RttmBotActive ? 'активен' : 'не активен' }} · ASHFXPRO: {{ client.AshfxproBotActive ? 'активен' : 'не активен' }}</p>
        <p v-if="client.SubscribedTill">Подписан до: {{ dateText(client.SubscribedTill) }}</p>
        <p v-if="channels.length">Каналы: {{ channels.map(x => x.Name).join(', ') }}</p>
        <p v-if="client.Comments" class="full-text">{{ client.Comments }}</p>
      </div>
      <ClientDialog v-if="workspace.me?.CompanyId === 8 && client.ClientTypeId === 2 && client.TelegramId" :client-id="client.Id" :ash-active="client.AshfxproBotActive" />
      <ClientBilling v-if="workspace.me?.Permissions.Finance" :client-id="client.Id" />
      <section class="detail-section">
        <div class="section-heading"><h2>События</h2><RouterLink v-if="workspace.me?.Permissions.EditEvents" :to="{ path: '/events/new', query: { client: client.Id } }" class="primary-link">Добавить</RouterLink></div>
        <p v-if="eventsLoading">Загрузка…</p><p v-if="eventsError" class="error-text">{{ eventsError }} <button @click="loadEvents()">Повторить</button></p>
        <template v-if="events"><p v-if="!events.Items.length" class="muted">Событий пока нет.</p><EventCards :items="events.Items" /><ListPager :page="events.Page" :total="events.Total" :loading="eventsLoading" @change="loadEvents" /></template>
      </section>
    </template>
  </section>
</template>
