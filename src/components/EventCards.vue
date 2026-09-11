<script setup lang="ts">
import type { EventListRow } from '@/api/workspace';
import { workspace, label, dateText } from '@/api/workspace';
defineProps<{ items: EventListRow[] }>();
</script>
<template>
  <RouterLink v-for="row in items" :key="row.Event.Id" :to="`/events/${row.Event.Id}`" class="record-card">
    <strong>{{ label(workspace.lookups?.EventTypes, row.Event.EventTypeId) }} · {{ row.ClientName }}</strong>
    <span>{{ dateText(row.Event.Planned) }} · {{ label(workspace.lookups?.EventStatuses, row.Event.EventStatusId) }}</span>
    <span class="muted">{{ label(workspace.lookups?.Managers, row.Event.ManagerId) }}</span>
    <span v-if="row.Event.Comments" class="preview-text">{{ row.Event.Comments }}</span>
    <span v-if="row.Event.IncomeRub != null">{{ row.Event.IncomeRub.toLocaleString('ru-RU') }} ₽</span>
  </RouterLink>
</template>
