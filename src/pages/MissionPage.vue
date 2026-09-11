<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { api, workspace, errorText, label, dateText, localDate, requestId } from '@/api/workspace';
import { getCrmClient } from '@/api/crmClient';
import type { Option } from '@/api/workspace';
import type { Mission, MissionComment } from '@/api/missions';
const route = useRoute(), router = useRouter(), isNew = route.path === '/missions/new';
const item = ref<Mission | null>(null), form = ref<Mission | null>(null), comments = ref<MissionComment[]>([]);
const statuses = ref<Option[]>([]), types = ref<Option[]>([]), editing = ref(isNew);
const loading = ref(false), saving = ref(false), error = ref(''), comment = ref(''), file = ref<File | null>(null), fileInput = ref<HTMLInputElement | null>(null);
let operationId = requestId(), commentId = requestId();
const dirty = computed(() => (editing.value && JSON.stringify(form.value) !== JSON.stringify(item.value)) || !!comment.value || !!file.value);
const managers = computed(() => workspace.lookups?.Managers.filter(x => x.Active || x.Id === form.value?.ManagerId) ?? []);
async function load() {
  loading.value = true; error.value = '';
  try {
    const opts = await api<{ Statuses: Option[]; Types: Option[] }>('MissionLookups'); statuses.value = opts.Statuses; types.value = opts.Types;
    if (isNew) item.value = { Id: 0, Name: '', Descr: '', ManagerId: workspace.me!.ManagerId, CreatorId: workspace.me!.ManagerId, StatusId: opts.Statuses[0]?.Id || 1, TypeId: opts.Types[0]?.Id || 1, Priority: 1, Closed: false, Planned: localDate(), Created: '', Revision: '' };
    else { const res = await api<{ Item: Mission; Comments: MissionComment[] }>('MissionDetails', { Id: Number(route.params.id) }); item.value = { ...res.Item, Planned: res.Item.Planned.slice(0, 10) }; comments.value = res.Comments; }
    form.value = { ...item.value! }; operationId = requestId();
  } catch (e) { error.value = errorText(e); } finally { loading.value = false; }
}
async function save() {
  if (saving.value) return; saving.value = true; error.value = '';
  try { const res = await api<{ Id: number }>('SaveMission', { ...form.value, RequestId: operationId }); editing.value = false;
    if (isNew) await router.replace(`/missions/${res.Id}`); else await load();
  } catch (e) { error.value = errorText(e); } finally { saving.value = false; }
}
async function addComment() {
  if (saving.value || !item.value) return; saving.value = true; error.value = '';
  try {
    if (file.value && file.value.size > 10 * 1024 * 1024) throw new Error('Максимальный размер файла — 10 МБ.');
    const body = new FormData(); body.append('Id', String(item.value.Id)); body.append('Text', comment.value); body.append('RequestId', commentId); if (file.value) body.append('File', file.value);
    const { data } = await getCrmClient().post('/MiniApp/AddMissionComment', body, { headers: { 'Content-Type': undefined } });
    if (!data.Success) throw new Error(data.ErrMsg || 'Не удалось добавить комментарий.');
    comment.value = ''; commentId = requestId(); file.value = null; if (fileInput.value) fileInput.value.value = ''; await load();
  } catch (e) { error.value = errorText(e); } finally { saving.value = false; }
}
async function download(x: MissionComment) {
  try { const { data } = await getCrmClient().post('/MiniApp/MissionAttachment', { Id: x.Id }, { responseType: 'blob' });
    const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = x.FileName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch { error.value = 'Не удалось скачать вложение.'; }
}
function cancel() { if (dirty.value && !window.confirm('Отменить изменения?')) return; editing.value = false; form.value = item.value ? { ...item.value } : null; if (isNew) router.push('/missions'); }
onBeforeRouteLeave(() => !dirty.value || window.confirm('Уйти без сохранения?'));
onMounted(load);
</script>
<template>
  <section class="workspace-page"><div class="section-heading"><h1>{{ isNew ? 'Новая задача' : item?.Name || 'Задача' }}</h1><button v-if="item && !editing && workspace.me?.Permissions.EditMissions" @click="editing = true">Изменить</button></div>
    <p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }} <button v-if="!editing" @click="load">Обновить</button></p>
    <form v-if="editing && form" class="editor" @submit.prevent="save"><fieldset :disabled="saving">
      <label>Название<input v-model="form.Name" required maxlength="200"></label><label>Описание<textarea v-model="form.Descr" rows="6" maxlength="20000" /></label>
      <label>Ответственный<select v-model.number="form.ManagerId"><option v-for="x in managers" :key="x.Id" :value="x.Id">{{ x.Name }}</option></select></label>
      <label>Категория<select v-model.number="form.TypeId"><option v-for="x in types" :key="x.Id" :value="x.Id">{{ x.Name }}</option></select></label>
      <label>Статус<select v-model.number="form.StatusId"><option v-for="x in statuses" :key="x.Id" :value="x.Id">{{ x.Name }}</option></select></label>
      <label>Срок<input v-model="form.Planned" type="date" required></label><label>Важность<select v-model.number="form.Priority"><option v-for="x in 5" :key="x" :value="x">{{ x }}</option></select></label>
      <label class="check-label"><input v-model="form.Closed" type="checkbox">Закрыта</label><div class="actions"><button>{{ saving ? 'Сохранение…' : 'Сохранить' }}</button><button type="button" class="secondary" @click="cancel">Отмена</button></div>
    </fieldset></form>
    <template v-if="item && !editing"><div class="detail-section"><p>{{ label(statuses, item.StatusId) }} · {{ item.Closed ? 'Закрыта' : 'Открыта' }}</p><p>Ответственный: {{ label(workspace.lookups?.Managers, item.ManagerId) }}</p><p>Создал: {{ label(workspace.lookups?.Managers, item.CreatorId) }}</p><p>Категория: {{ label(types, item.TypeId) }}</p><p>Срок: {{ item.Planned }} · Важность: {{ item.Priority }}</p><p class="full-text">{{ item.Descr }}</p></div>
      <h2>Комментарии</h2><form v-if="workspace.me?.Permissions.EditMissions" class="editor" @submit.prevent="addComment"><fieldset :disabled="saving"><label>Новый комментарий<textarea v-model="comment" rows="4" maxlength="20000" /></label><label>Вложение до 10 МБ<input ref="fileInput" type="file" accept=".png,.jpg,.jpeg,.pdf,.txt,.docx,.xlsx,.zip" @change="file = ($event.target as HTMLInputElement).files?.[0] || null"></label><button :disabled="!comment.trim() && !file">Добавить комментарий</button></fieldset></form>
      <p v-if="!comments.length">Комментариев нет.</p><p v-if="comments.length === 200" class="muted">Последние 200 комментариев</p>
      <article v-for="x in comments" :key="x.Id" class="detail-section"><strong>{{ x.ManagerName }}</strong> <small>{{ dateText(x.Created) }}</small><p class="full-text">{{ x.Descr }}</p><button v-if="x.FileName" class="secondary" @click="download(x)">Скачать {{ x.FileName }}</button></article>
    </template>
  </section>
</template>
