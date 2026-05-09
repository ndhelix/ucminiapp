<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCrmClient, apiBase } from '@/api/crmClient';
import type {
  TariffReportResponse,
  TariffReportRow,
  TariffServiceOption,
  TariffTransitionStat,
} from '@/api/crmTypes';
import { openLink } from '@telegram-apps/sdk-vue';

const loading = ref( false );
const err = ref<string | null>( null );
const raw = ref<Record<string, unknown> | null>( null );

const crmOrigin = apiBase();

type RangeKey = 'month' | '30d' | '90d';
const range = ref<RangeKey>( 'month' );
/** Defaults align with CRM TariffReport (Знакомство → любой). */
const serviceFrom = ref( 37 );
const serviceTo = ref( 0 );

function formatDt( d: Date ): string {
  const p = ( n: number ) => String( n ).padStart( 2, '0' );
  return `${d.getFullYear()}-${p( d.getMonth() + 1 )}-${p( d.getDate() )} ${p( d.getHours() )}:${p( d.getMinutes() )}:${p( d.getSeconds() )}`;
}

function buildBody(): Record<string, unknown> {
  const now = new Date();
  let from: Date;
  if ( range.value === 'month' ) {
    from = new Date( now.getFullYear(), now.getMonth(), 1, 0, 0, 0 );
  }
  else if ( range.value === '30d' ) {
    from = new Date( now );
    from.setDate( from.getDate() - 30 );
    from.setHours( 0, 0, 0, 0 );
  }
  else {
    from = new Date( now );
    from.setDate( from.getDate() - 90 );
    from.setHours( 0, 0, 0, 0 );
  }
  const to = new Date( now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59 );
  return {
    Datepickfrom: formatDt( from ),
    Datepickto: formatDt( to ),
    ServiceFrom: serviceFrom.value,
    ServiceTo: serviceTo.value,
  };
}

function num( o: Record<string, unknown>, p: string, c: string ): number {
  const v = o[p] ?? o[c];
  return typeof v === 'number' ? v : Number( v ?? 0 );
}

function str( o: Record<string, unknown>, p: string, c: string ): string {
  const v = o[p] ?? o[c];
  return v == null ? '' : String( v );
}

function normalizeService( x: unknown ): TariffServiceOption {
  const o = x as Record<string, unknown>;
  return { Id: num( o, 'Id', 'id' ), Name: str( o, 'Name', 'name' ) };
}

function normalizeRow( r: unknown ): TariffReportRow {
  const o = r as Record<string, unknown>;
  return {
    ClientId: num( o, 'ClientId', 'clientId' ),
    TelegramId: Number( o.TelegramId ?? o.telegramId ?? 0 ),
    ServiceFromName: str( o, 'ServiceFromName', 'serviceFromName' ),
    ServiceToName: str( o, 'ServiceToName', 'serviceToName' ) || undefined,
    DateFirst: str( o, 'DateFirst', 'dateFirst' ),
    DateSecond: str( o, 'DateSecond', 'dateSecond' ) || undefined,
    DayDiff: o.DayDiff != null || o.dayDiff != null
      ? num( o, 'DayDiff', 'dayDiff' )
      : undefined,
    IncomeRub: o.IncomeRub != null || o.incomeRub != null
      ? num( o, 'IncomeRub', 'incomeRub' )
      : undefined,
    HexColorFrom: str( o, 'HexColorFrom', 'hexColorFrom' ) || undefined,
    HexColorTo: str( o, 'HexColorTo', 'hexColorTo' ) || undefined,
  };
}

function normalizeStat( t: unknown ): TariffTransitionStat | null {
  if ( !t || typeof t !== 'object' )
    return null;
  const o = t as Record<string, unknown>;
  return {
    ServiceFrom: num( o, 'ServiceFrom', 'serviceFrom' ),
    ServiceTo: num( o, 'ServiceTo', 'serviceTo' ),
    ServiceFromSubsCount: num( o, 'ServiceFromSubsCount', 'serviceFromSubsCount' ),
    ServiceToSubsCount: num( o, 'ServiceToSubsCount', 'serviceToSubsCount' ),
    TransitionPersentage: Number( o.TransitionPersentage ?? o.transitionPersentage ?? 0 ),
  };
}

function normalizeReport( res: unknown ): TariffReportResponse {
  const o = res as Record<string, unknown>;
  const itemsRaw = ( o.Items ?? o.items ) as unknown[] | undefined;
  const servRaw = ( o.Services ?? o.services ) as unknown[] | undefined;
  return {
    Success: Boolean( o.Success ?? o.success ),
    ErrMsg: ( o.ErrMsg ?? o.errMsg ) as string | undefined,
    Datepickfrom: ( o.Datepickfrom ?? o.datepickfrom ) as string | undefined,
    Datepickto: ( o.Datepickto ?? o.datepickto ) as string | undefined,
    Services: ( servRaw ?? [] ).map( normalizeService ),
    TransitionStat: normalizeStat( o.TransitionStat ?? o.transitionStat ),
    TotalIncomeRub: num( o, 'TotalIncomeRub', 'totalIncomeRub' ),
    Items: ( itemsRaw ?? [] ).map( normalizeRow ),
  };
}

const report = computed( () => ( raw.value ? normalizeReport( raw.value ) : null ) );

const serviceSelectList = computed( () => report.value?.Services ?? [] );

async function load() {
  loading.value = true;
  err.value = null;
  try {
    const { data: res } = await getCrmClient().post(
      '/MiniApp/TariffReport',
      buildBody(),
    );
    raw.value = res as Record<string, unknown>;
    const n = normalizeReport( res );
    if ( n.Services?.length && n.TransitionStat ) {
      serviceFrom.value = n.TransitionStat.ServiceFrom;
      serviceTo.value = n.TransitionStat.ServiceTo;
    }
    if ( !n.Success )
      err.value = n.ErrMsg || 'Ошибка отчёта';
  }
  catch ( e ) {
    err.value = e instanceof Error ? e.message : String( e );
  }
  finally {
    loading.value = false;
  }
}

function formatInt( n: number ): string {
  return n.toLocaleString( 'ru-RU' );
}

function formatDtRu( iso: string | undefined ): string {
  if ( !iso )
    return '—';
  const d = new Date( iso );
  if ( Number.isNaN( +d ) )
    return iso;
  return d.toLocaleDateString( 'ru-RU' );
}

function openClient( row: TariffReportRow ) {
  if ( !row.ClientId )
    return;
  const url = `${crmOrigin}/Clients/Edit/${row.ClientId}`;
  if ( openLink.isAvailable() )
    openLink( url );
  else
    window.open( url, '_blank', 'noopener,noreferrer' );
}

function openFullReportInBrowser() {
  const url = `${crmOrigin}/Reports/TariffReport`;
  if ( openLink.isAvailable() )
    openLink( url );
  else
    window.open( url, '_blank', 'noopener,noreferrer' );
}

onMounted( load );
</script>

<template>
  <div class="rep">
    <p class="rep__intro">
      Переходы по тарифам (как в CRM:
      <button type="button" class="rep__inline-link" @click="openFullReportInBrowser">
        TariffReport
      </button>).
    </p>

    <div class="rep__filters">
      <label class="rep__lbl">Период</label>
      <select v-model="range" class="rep__select" @change="load">
        <option value="month">
          Текущий месяц
        </option>
        <option value="30d">
          Последние 30 дней
        </option>
        <option value="90d">
          Последние 90 дней
        </option>
      </select>
      <label class="rep__lbl">Тариф «с»</label>
      <select v-model.number="serviceFrom" class="rep__select" @change="load">
        <option
          v-for="s in serviceSelectList"
          :key="'from-' + s.Id"
          :value="s.Id"
        >
          {{ s.Name }}
        </option>
      </select>
      <label class="rep__lbl">Тариф «на»</label>
      <select v-model.number="serviceTo" class="rep__select" @change="load">
        <option
          v-for="s in serviceSelectList"
          :key="'to-' + s.Id"
          :value="s.Id"
        >
          {{ s.Name }}
        </option>
      </select>
      <button type="button" class="rep__refresh" :disabled="loading" @click="load">
        Обновить
      </button>
    </div>

    <p v-if="loading" class="rep__hint">
      Загрузка…
    </p>
    <p v-else-if="err" class="rep__err">
      {{ err }}
    </p>
    <template v-else-if="report?.Items?.length">
      <div v-if="report.TransitionStat" class="rep__totals">
        <span>Переход: <strong>{{ report.TransitionStat.ServiceFromSubsCount }} → {{ report.TransitionStat.ServiceToSubsCount }}</strong></span>
        <span>%: <strong>{{ report.TransitionStat.TransitionPersentage.toFixed(2) }}</strong></span>
        <span>Сумма ₽: <strong>{{ formatInt(report.TotalIncomeRub ?? 0) }}</strong></span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Telegram ID</th>
              <th>Тариф 1</th>
              <th>Дата 1</th>
              <th>Тариф 2</th>
              <th>Дата 2</th>
              <th class="num">
                Дней
              </th>
              <th class="num">
                ₽
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in report.Items"
              :key="idx"
              class="row-click"
              @click="openClient(row)"
            >
              <td>{{ row.TelegramId }}</td>
              <td :style="{ backgroundColor: row.HexColorFrom || 'transparent' }">
                {{ row.ServiceFromName }}
              </td>
              <td>{{ formatDtRu(row.DateFirst) }}</td>
              <td :style="{ backgroundColor: row.HexColorTo || 'transparent' }">
                {{ row.ServiceToName || '—' }}
              </td>
              <td>{{ row.DateSecond ? formatDtRu(row.DateSecond) : '—' }}</td>
              <td class="num">
                {{ row.DayDiff ?? '—' }}
              </td>
              <td class="num">
                {{ row.IncomeRub != null ? formatInt(row.IncomeRub) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="rep__hint rep__hint--small">
        Нажмите строку, чтобы открыть карточку клиента в CRM.
      </p>
    </template>
    <p v-else class="rep__hint">
      Нет данных за выбранный период и фильтры тарифов.
    </p>
  </div>
</template>

<style scoped>
.rep__intro {
  font-size: 0.9rem;
  color: var(--tg-theme-hint-color, #888);
  margin-bottom: 10px;
}

.rep__inline-link {
  display: inline;
  padding: 0;
  border: none;
  background: none;
  color: var(--tg-theme-link-color, #2481cc);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.rep__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.rep__lbl {
  font-size: 0.85rem;
  color: var(--tg-theme-hint-color, #888);
  width: 100%;
}

.rep__select {
  flex: 1;
  min-width: 140px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--tg-theme-section-separator-color, #ccc);
  background: var(--tg-theme-bg-color, #fff);
  color: var(--tg-theme-text-color, #000);
}

.rep__refresh {
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

.rep__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: var(--tg-theme-secondary-bg-color, #f4f4f4);
  font-size: 0.85rem;
}

.rep__hint {
  color: var(--tg-theme-hint-color, #888);
}

.rep__hint--small {
  font-size: 0.8rem;
  margin-top: 8px;
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
  font-size: 0.75rem;
}

.table th,
.table td {
  padding: 6px 4px;
  border-bottom: 1px solid var(--tg-theme-section-separator-color, #e4e4e4);
  vertical-align: top;
}

.table th.num,
.table td.num {
  text-align: right;
  white-space: nowrap;
}

.row-click {
  cursor: pointer;
}

.row-click:active {
  opacity: 0.85;
}
</style>
