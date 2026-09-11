<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, errorText, dateText } from '@/api/workspace';
interface Message { Key: string; ClientId: number; ClientName: string; ChatId: number; Text: string; Source: string; Status: string; Created: string }
const rows = ref<Message[]>([]), error = ref(''), loading = ref(false);
async function load() { loading.value = true; error.value = ''; try { rows.value = (await api<{ Items: Message[] }>('BotStream')).Items; } catch (e) { error.value = errorText(e); } finally { loading.value = false; } }
onMounted(load);
</script>
<template><section class="workspace-page"><div class="section-heading"><h1>Последние сообщения ботов</h1><button :disabled="loading" @click="load">Обновить</button></div><p class="muted">Последние 200 сообщений клиентов текущей компании.</p><p v-if="loading">Загрузка…</p><p v-if="error" class="error-text" role="alert">{{ error }}</p><article v-for="x in rows" :key="x.Key" class="detail-section"><RouterLink :to="`/clients/${x.ClientId}`">{{ x.ClientName || x.ChatId }}</RouterLink><p>{{ x.Source }} · {{ dateText(x.Created) }} · {{ x.Status }}</p><p class="full-text">{{ x.Text }}</p></article></section></template>
