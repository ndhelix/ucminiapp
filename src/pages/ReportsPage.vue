<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getCrmClient } from '@/api/crmClient';
import type { MiniAppReportResponse } from '@/api/crmTypes';

const loading = ref( false );
const err = ref<string | null>( null );
const data = ref<MiniAppReportResponse | null>( null );

async function load() {
  loading.value = true;
  err.value = null;
  try {
    const { data: res } = await getCrmClient().post<MiniAppReportResponse>(
      '/MiniApp/EventProgressReport',
      {},
    );
    data.value = res;
    if ( !res.Success )
      err.value = res.ErrMsg || 'Ошибка отчёта';
  }
  catch ( e ) {
    err.value = e instanceof Error ? e.message : String( e );
  }
  finally {
    loading.value = false;
  }
}

onMounted( load );
</script>

<template>
  <div class="rep">
    <p class="rep__intro">
      Прогресс по событиям (как «Отчёт по периоду» в CRM).
    </p>
    <button type="button" class="rep__refresh" :disabled="loading" @click="load">
      Обновить
    </button>
    <p v-if="loading" class="rep__hint">
      Загрузка…
    </p>
    <p v-else-if="err" class="rep__err">
      {{ err }}
    </p>
    <div v-else-if="data?.Items?.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Ответственный</th>
            <th>Рег</th>
            <th>Встр</th>
            <th>Лек</th>
            <th>Прак</th>
            <th>Счёт</th>
            <th>Всего</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in data.Items" :key="idx" :class="{ summary: row.ManagerName === 'Весь офис' }">
            <td>{{ row.ManagerName }}</td>
            <td>{{ row.CountReg }}</td>
            <td>{{ row.CountMeeting }}</td>
            <td>{{ row.CountLection }}</td>
            <td>{{ row.CountPraktik }}</td>
            <td>{{ row.CountBill }}</td>
            <td>{{ row.CountTotal }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="rep__hint">
      Нет данных.
    </p>
  </div>
</template>

<style scoped>
.rep__intro {
  font-size: 0.9rem;
  color: var(--tg-theme-hint-color, #888);
  margin-bottom: 10px;
}

.rep__refresh {
  margin-bottom: 12px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  background: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
}

.rep__refresh:disabled {
  opacity: 0.5;
}

.rep__hint {
  color: var(--tg-theme-hint-color, #888);
}

.rep__err {
  color: var(--tg-theme-destructive-text-color, #c00);
}

.table-wrap {
  overflow-x: auto;
  margin: 0 -8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.table th,
.table td {
  padding: 8px 6px;
  text-align: right;
  border-bottom: 1px solid var(--tg-theme-section-separator-color, #e4e4e4);
}

.table th:first-child,
.table td:first-child {
  text-align: left;
}

.table tr.summary {
  font-weight: 700;
  background: var(--tg-theme-secondary-bg-color, #f4f4f4);
}
</style>
