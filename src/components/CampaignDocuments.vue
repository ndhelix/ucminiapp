<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, errorText, requestId } from '@/api/workspace';
import { getCrmClient } from '@/api/crmClient';
const props = defineProps<{ campaignId: number; canEdit: boolean }>();
const docs = ref<{ Id: number; Name: string; Size: number }[]>([]), error = ref(''), working = ref(false), file = ref<File | null>(null), input = ref<HTMLInputElement | null>(null);
let key = requestId();
async function load() { try { docs.value = (await api<{ Items: typeof docs.value }>('CampaignDocuments', { Id: props.campaignId })).Items; } catch (e) { error.value = errorText(e); } }
async function upload() { if (!file.value || working.value) return; working.value = true; error.value = ''; try { if (file.value.size > 10 * 1024 * 1024) throw new Error('Максимальный размер — 10 МБ.'); const body = new FormData(); body.append('Id', String(props.campaignId)); body.append('File', file.value); body.append('RequestId', key); const { data } = await getCrmClient().post('/MiniApp/UploadCampaignDocument', body, { headers: { 'Content-Type': undefined } }); if (!data.Success) throw new Error(data.ErrMsg); file.value = null; key = requestId(); if (input.value) input.value.value = ''; await load(); } catch (e) { error.value = errorText(e); } finally { working.value = false; } }
async function download(id: number, name: string) { try { const { data } = await getCrmClient().post('/MiniApp/DownloadCampaignDocument', { Id: id }, { responseType: 'blob' }); const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); } catch { error.value = 'Не удалось скачать документ.'; } }
onMounted(load);
</script>
<template>
  <section class="detail-section"><h2>Документы кампании</h2><p v-if="error" class="error-text" role="alert">{{ error }}</p><form v-if="canEdit" class="editor" @submit.prevent="upload"><label>Файл до 10 МБ<input ref="input" type="file" accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip" :disabled="working" @change="file = ($event.target as HTMLInputElement).files?.[0] || null; key = requestId()"></label><button :disabled="working || !file">Загрузить документ</button></form><p v-for="x in docs" :key="x.Id"><button class="secondary" @click="download(x.Id, x.Name)">{{ x.Name }} · {{ Math.ceil(x.Size / 1024) }} КБ</button></p><p v-if="!docs.length" class="muted">Документов нет.</p></section>
</template>
