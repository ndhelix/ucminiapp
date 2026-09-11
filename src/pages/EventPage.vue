<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { api, workspace, label, dateText, errorText, localTime, requestId } from '@/api/workspace';
import type { EventRecord, ClientRecord, Page } from '@/api/workspace';
const route = useRoute(), router = useRouter();
const isNew = computed(() => route.path === '/events/new');
const item = ref<EventRecord | null>(null), form = ref<EventRecord | null>(null), clientName = ref('');
const loading = ref(false), saving = ref(false), editing = ref(false), error = ref(''), notice = ref('');
const canAssign = ref(false), canChangeStatus = ref(false);
const search = ref(''), candidates = ref<ClientRecord[]>([]), searching = ref(false);
let operationId = requestId();
const dirty = computed(() => editing.value && JSON.stringify(form.value) !== JSON.stringify(item.value
  ? { ...item.value, ExpiryDate: item.value.ExpiryDate?.slice(0, 10) || null } : null));
const managers = computed(() => workspace.lookups?.Managers.filter(m => m.Active || m.Id === form.value?.ManagerId) ?? []);
const statuses = computed(() => workspace.lookups?.EventStatuses.filter(s => isNew.value || canChangeStatus.value || s.Id === item.value?.EventStatusId || s.Id === 4) ?? []);
async function findClients() {
  if (searching.value) return;
  searching.value = true; error.value = '';
  try { candidates.value = (await api<Page<ClientRecord>>('Clients', { Search: search.value, Page: 1 })).Items; }
  catch (e) { error.value = errorText(e); }
  finally { searching.value = false; }
}
function selectClient(c: ClientRecord) { if (form.value) form.value.ClientId = c.Id; clientName.value = c.Name; candidates.value = []; }
async function load() {
  loading.value = true; error.value = ''; item.value = null; form.value = null; clientName.value = ''; candidates.value = [];
  operationId = requestId();
  try {
    if (isNew.value) {
      const clientId = Number(route.query.client) || 0;
      item.value = { Id: 0, ClientId: clientId, ManagerId: workspace.me!.ManagerId, CreatorId: workspace.me!.ManagerId,
        EventTypeId: 0, EventStatusId: 1, ServiceId: null, Planned: localTime(), ExpiryDate: null,
        Comments: '', IncomeRub: workspace.me?.Permissions.Finance ? 0 : null, DurationMin: 30, Revision: '' };
      canAssign.value = true; canChangeStatus.value = true; editing.value = true;
      if (clientId) clientName.value = (await api<{ Item: ClientRecord }>('ClientDetails', { Id: clientId })).Item.Name;
    }
    else {
      const data = await api<{ Item: EventRecord; ClientName: string; CanAssign: boolean; CanChangeStatus: boolean }>('EventDetails', { Id: Number(route.params.id) });
      item.value = data.Item; clientName.value = data.ClientName; canAssign.value = data.CanAssign; canChangeStatus.value = data.CanChangeStatus; editing.value = false;
    }
    form.value = { ...item.value!, ExpiryDate: item.value!.ExpiryDate?.slice(0, 10) || null };
  }
  catch (e) { error.value = errorText(e); }
  finally { loading.value = false; }
}
async function save() {
  if (!form.value || saving.value) return;
  if (!form.value.ClientId) { error.value = 'Выберите клиента.'; return; }
  saving.value = true; error.value = ''; notice.value = '';
  try {
    const result = await api<{ Id: number }>('SaveEvent', { ...form.value, RequestId: operationId });
    editing.value = false; notice.value = 'Событие сохранено.';
    if (isNew.value) await router.replace(`/events/${result.Id}`); else await load();
  }
  catch (e) { error.value = errorText(e); }
  finally { saving.value = false; }
}
function cancel() {
  if (dirty.value && !window.confirm('Отменить несохранённые изменения?')) return;
  editing.value = false; form.value = item.value ? { ...item.value, ExpiryDate: item.value.ExpiryDate?.slice(0, 10) || null } : null;
  if (isNew.value) router.push('/events');
}
onBeforeRouteLeave(() => !dirty.value || window.confirm('Уйти без сохранения изменений?'));
watch(() => route.params.id, load, { immediate: true });
</script>
<template>
  <section class="workspace-page">
    <div class="section-heading"><h1>{{ isNew ? 'Новое событие' : `Событие №${item?.Id || ''}` }}</h1><button v-if="item && !editing && workspace.me?.Permissions.EditEvents" @click="editing = true">Изменить</button></div>
    <p v-if="loading" role="status">Загрузка…</p><p v-if="notice" role="status" class="success-text">{{ notice }}</p>
    <p v-if="error" role="alert" class="error-text">{{ error }} <button v-if="!editing" @click="load">Повторить</button></p>
    <form v-if="form && editing && workspace.me?.Permissions.EditEvents" class="editor" @submit.prevent="save">
      <fieldset :disabled="saving">
        <div v-if="isNew" class="client-picker"><label>Найти клиента<input v-model="search" type="search" maxlength="100" placeholder="Имя, телефон, Telegram ID" @keydown.enter.prevent="findClients"></label><button type="button" :disabled="searching" @click="findClients">{{ searching ? 'Поиск…' : 'Найти' }}</button><button v-for="c in candidates" :key="c.Id" type="button" class="record-card secondary" @click="selectClient(c)">{{ c.Name }} · {{ c.Phone || c.TelegramId }}</button></div>
        <p>Клиент: <strong>{{ clientName || 'Не выбран' }}</strong></p>
        <label>Тип события<select v-model.number="form.EventTypeId" required><option :value="0" disabled>Выберите тип</option><option v-for="t in workspace.lookups?.EventTypes" :key="t.Id" :value="t.Id">{{ t.Name }}</option></select></label>
        <label>Статус<select v-model.number="form.EventStatusId"><option v-for="s in statuses" :key="s.Id" :value="s.Id">{{ s.Name }}</option></select></label>
        <label>Дата и время (время CRM)<input v-model="form.Planned" type="datetime-local" step="1" required></label>
        <label>Длительность, минут<input v-model.number="form.DurationMin" type="number" min="1" max="1440" required></label>
        <label>Ответственный<select v-model.number="form.ManagerId" :disabled="!canAssign"><option :value="0">Не назначен</option><option v-for="m in managers" :key="m.Id" :value="m.Id">{{ m.Name }}</option></select></label>
        <label>Тариф<select v-model="form.ServiceId"><option :value="null">Без тарифа</option><option v-for="s in workspace.lookups?.Services" :key="s.Id" :value="s.Id">{{ s.Name }}</option></select></label>
        <label v-if="workspace.me?.Permissions.Finance">Сумма, ₽<input v-model.number="form.IncomeRub" type="number" step="1" required></label>
        <label>Дата окончания действия<input :value="form.ExpiryDate || ''" type="date" @input="form.ExpiryDate = ($event.target as HTMLInputElement).value || null"></label>
        <label>Комментарий<textarea v-model="form.Comments" rows="7" maxlength="2000" /></label>
        <div class="actions"><button type="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button><button type="button" class="secondary" @click="cancel">Отмена</button></div>
      </fieldset>
    </form>
    <div v-if="item && !editing" class="detail-section">
      <RouterLink :to="`/clients/${item.ClientId}`">{{ clientName }}</RouterLink>
      <h2>{{ label(workspace.lookups?.EventTypes, item.EventTypeId) }}</h2>
      <p>{{ label(workspace.lookups?.EventStatuses, item.EventStatusId) }} · {{ dateText(item.Planned) }}</p>
      <p>Ответственный: {{ label(workspace.lookups?.Managers, item.ManagerId) }}</p>
      <p>Длительность: {{ item.DurationMin }} мин.</p>
      <p v-if="item.ServiceId">Тариф: {{ label(workspace.lookups?.Services, item.ServiceId) }}</p>
      <p v-if="item.IncomeRub != null">Сумма: {{ item.IncomeRub.toLocaleString('ru-RU') }} ₽</p>
      <p v-if="item.ExpiryDate">Действует до: {{ dateText(item.ExpiryDate) }}</p>
      <p v-if="item.Comments" class="full-text">{{ item.Comments }}</p>
    </div>
  </section>
</template>
