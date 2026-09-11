<script setup lang="ts">
import { workspace } from '@/api/workspace';
</script>
<template>
  <section class="workspace-page"><h1>Разделы CRM</h1><div class="record-list">
    <RouterLink class="record-card" to="/catalog">Остальные разделы CRM</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.Notifications" class="record-card" to="/notifications">Уведомления</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.Payments" class="record-card" to="/payments">Платежи от клиентов</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.Reports" class="record-card" to="/reports">Переходы между тарифами</RouterLink>
    <RouterLink v-if="workspace.me?.Permissions.Reports" class="record-card" to="/analytics">Подписчики и аналитика</RouterLink>
  </div></section>
</template>
