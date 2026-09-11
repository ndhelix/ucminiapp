<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { api, errorText, requestId, workspace, loadWorkspace } from '@/api/workspace';
import CampaignDocuments from '@/components/CampaignDocuments.vue';
import { catalogText } from '@/api/catalog';
import type { CatalogDefinition, CatalogRecord } from '@/api/catalog';
const route = useRoute(), router = useRouter(), kind = String(route.params.kind), isNew = route.params.id === 'new';
const definition = ref<CatalogDefinition | null>(null), item = ref<CatalogRecord | null>(null), form = ref<CatalogRecord | null>(null), editing = ref(isNew), loading = ref(false), saving = ref(false), error = ref(''), notice = ref('');
const login = ref(''), password = ref(''); let operationId = requestId();
const dirty = computed(() => (editing.value && JSON.stringify(item.value) !== JSON.stringify(form.value)) || !!password.value);
async function load() {
  loading.value = true; error.value = '';
  try { const data = await api<{ Definition: CatalogDefinition; Item: CatalogRecord }>('CatalogDetails', { Kind: kind, Id: isNew ? 0 : Number(route.params.id), ParentId: route.query.parent ? Number(route.query.parent) : null }); definition.value = data.Definition; item.value = data.Item; form.value = JSON.parse(JSON.stringify(data.Item)); login.value = String(data.Item.Values.Login || ''); operationId = requestId(); }
  catch (e) { error.value = errorText(e); } finally { loading.value = false; }
}
async function save() {
  if (!form.value || saving.value) return; saving.value = true; error.value = '';
  try { const data = await api<{ Id: number }>('SaveCatalog', { Kind: kind, ...form.value, RequestId: operationId }); editing.value = false; notice.value = 'Изменения сохранены.'; await loadWorkspace(); if (isNew) await router.replace(`/catalog/${kind}/${data.Id}`); else await load(); }
  catch (e) { error.value = errorText(e); } finally { saving.value = false; }
}
function cancel() { if (dirty.value && !window.confirm('Отменить изменения?')) return; editing.value = false; form.value = item.value ? JSON.parse(JSON.stringify(item.value)) : null; if (isNew) router.push(`/catalog/${kind}`); }
async function remove() {
  if (saving.value || !item.value || !window.confirm('Удалить эту запись? Это действие нельзя отменить.')) return;
  saving.value = true; error.value = '';
  try { await api('DeleteCatalog', { Kind: kind, Id: item.value.Id, Revision: item.value.Revision, RequestId: requestId() }); await loadWorkspace(); await router.replace(`/catalog/${kind}`); }
  catch (e) { error.value = errorText(e); } finally { saving.value = false; }
}
async function account() {
  if (saving.value || !item.value || !window.confirm('Сохранить пароль для этого сотрудника?')) return;
  saving.value = true; error.value = '';
  try { await api('EmployeeAccount', { Id: item.value.Id, Login: login.value, Password: password.value }); password.value = ''; notice.value = 'Учётная запись обновлена.'; await load(); }
  catch (e) { error.value = errorText(e); } finally { saving.value = false; }
}
onBeforeRouteLeave(() => !dirty.value || window.confirm('Уйти без сохранения?'));
onMounted(load);
</script>
<template>
  <section class="workspace-page"><div class="section-heading"><h1>{{ definition?.Title || 'Запись CRM' }} {{ isNew ? '· Новая запись' : `№${route.params.id}` }}</h1><button v-if="definition?.CanEdit && item && !editing" @click="editing = true">Изменить</button></div>
    <p v-if="loading">Загрузка…</p><p v-if="notice" role="status">{{ notice }}</p><p v-if="error" class="error-text" role="alert">{{ error }} <button v-if="!editing" @click="load">Обновить</button></p>
    <p v-if="definition?.Global" class="muted">Общий справочник для всех компаний.</p>
    <form v-if="form && definition && editing" class="editor" @submit.prevent="save"><fieldset :disabled="saving"><label v-for="f in definition.Fields" :key="f.Name" :class="{ 'check-label': f.Type === 'bool' }">
      <template v-if="f.Type === 'bool'"><input v-model="form.Values[f.Name]" type="checkbox" :disabled="f.ReadOnly">{{ f.Label }}</template>
      <template v-else>{{ f.Label }}<select v-if="f.Options" v-model="form.Values[f.Name]" :aria-label="f.Label" :disabled="f.ReadOnly" :required="f.Required"><option v-for="x in f.Options" :key="x.Id" :value="x.Id">{{ x.Name }}</option></select>
        <textarea v-else-if="f.Type === 'textarea'" :value="String(form.Values[f.Name] ?? '')" @input="form.Values[f.Name] = ($event.target as HTMLTextAreaElement).value" rows="5" :required="f.Required" :maxlength="f.MaxLength" :readonly="f.ReadOnly" />
        <input v-else v-model="form.Values[f.Name]" :type="f.Type === 'decimal' ? 'number' : f.Type === 'telegram' ? 'text' : f.Type" :inputmode="f.Type === 'telegram' ? 'numeric' : undefined" :step="f.Type === 'decimal' ? '0.01' : '1'" :required="f.Required" :maxlength="f.MaxLength" :readonly="f.ReadOnly">
      </template>
    </label><div class="actions"><button>Сохранить</button><button type="button" class="secondary" @click="cancel">Отмена</button></div></fieldset></form>
    <template v-if="item && definition && !editing"><div v-for="f in definition.Fields" :key="f.Name" class="detail-section"><strong>{{ f.Label }}</strong><p class="full-text">{{ catalogText(f, item.Values[f.Name]) }}</p></div>
      <CampaignDocuments v-if="kind === 'campaigns'" :campaign-id="item.Id" :can-edit="definition.CanEdit" />
      <RouterLink v-if="definition.ChildKind" class="primary-link" :to="{ path: `/catalog/${definition.ChildKind}`, query: { parent: item.Id } }">{{ definition.ChildKind === 'questions' ? 'Вопросы теста' : 'Варианты ответа' }}</RouterLink>
      <details v-if="kind === 'managers' && workspace.me?.Permissions.IsAdmin"><summary>Учётная запись CRM</summary><form class="editor" @submit.prevent="account"><label>Логин<input v-model="login" required maxlength="20" pattern="[a-zA-Z0-9]+" :readonly="!!item.Values.Login"></label><label>Новый пароль<input v-model="password" type="password" minlength="8" maxlength="128" required autocomplete="new-password"></label><button :disabled="saving">Сохранить пароль</button></form></details>
      <div class="actions"><button v-if="definition.CanDelete && workspace.me?.Permissions.IsAdmin" class="secondary" :disabled="saving" @click="remove">Удалить</button><RouterLink :to="`/catalog/${kind}`">К списку</RouterLink></div>
    </template>
  </section>
</template>
