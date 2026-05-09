<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getCrmClient } from '@/api/crmClient';
import type { MiniAppCalendarResponse, MiniAppCalendarSlot } from '@/api/crmTypes';

const loading = ref( false );
const err = ref<string | null>( null );
const data = ref<MiniAppCalendarResponse | null>( null );

const slotsByDay = ref<{ label: string; items: MiniAppCalendarSlot[] }[]>( [] );

function groupSlots( slots: MiniAppCalendarSlot[] | undefined ) {
  if ( !slots?.length ) {
    slotsByDay.value = [];
    return;
  }
  const map = new Map<string, MiniAppCalendarSlot[]>();
  for ( const s of slots ) {
    const d = new Date( s.Start );
    const key = d.toDateString();
    if ( !map.has( key ) )
      map.set( key, [] );
    map.get( key )!.push( s );
  }
  slotsByDay.value = [ ...map.entries() ].map( ( [ k, items ] ) => ( {
    label: new Date( k ).toLocaleDateString( 'ru-RU', { weekday: 'short', day: 'numeric', month: 'long' } ),
    items: items.sort( ( a, b ) => +new Date( a.Start ) - +new Date( b.Start ) ),
  } ) );
}

async function load( body: Record<string, unknown> = {} ) {
  loading.value = true;
  err.value = null;
  try {
    const { data: res } = await getCrmClient().post<MiniAppCalendarResponse>( '/MiniApp/Calendar', body );
    data.value = res;
    if ( !res.Success ) {
      err.value = res.ErrMsg || 'Ошибка календаря';
      return;
    }
    groupSlots( res.Slots );
  }
  catch ( e ) {
    err.value = e instanceof Error ? e.message : String( e );
  }
  finally {
    loading.value = false;
  }
}

function prevMonth() {
  load( {
    datepickfrom: data.value?.datepickfrom,
    datepickto: data.value?.datepickto,
    gotoprev: true,
  } );
}

function nextMonth() {
  load( {
    datepickfrom: data.value?.datepickfrom,
    datepickto: data.value?.datepickto,
    gotonext: true,
  } );
}

onMounted( () => load( {} ) );
</script>

<template>
  <div class="cal">
    <div class="cal__toolbar">
      <button type="button" class="cal__btn" :disabled="loading" @click="prevMonth">
        ←
      </button>
      <div class="cal__range">
        <template v-if="data?.datepickfrom">
          {{
            new Date(data.datepickfrom).toLocaleDateString('ru-RU', {
              month: 'long',
              year: 'numeric',
            })
          }}
        </template>
        <template v-else>
          Календарь
        </template>
      </div>
      <button type="button" class="cal__btn" :disabled="loading" @click="nextMonth">
        →
      </button>
    </div>

    <p v-if="loading" class="cal__hint">
      Загрузка…
    </p>
    <p v-else-if="err" class="cal__err">
      {{ err }}
    </p>

    <section v-if="data?.Totals" class="totals">
      <div class="totals__line">
        <span>Итого доходы</span>
        <strong>{{ data.Totals.TotalIncomeRub?.toLocaleString('ru-RU') }} ₽</strong>
      </div>
      <div class="totals__line totals__line--muted">
        {{ data.Totals.SummaryRow }}
      </div>
      <div v-if="data.CompanyCode" class="totals__code">
        {{ data.CompanyCode }}
      </div>
    </section>

    <section v-for="block in slotsByDay" :key="block.label" class="day">
      <h2 class="day__title">
        {{ block.label }}
      </h2>
      <article
        v-for="slot in block.items"
        :key="slot.Kind + slot.Id + slot.Start"
        class="slot"
        :style="{ borderLeftColor: slot.ManagerColorHex || '#ccc' }"
      >
        <div class="slot__time">
          {{
            new Date(slot.Start).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </div>
        <div class="slot__body">
          <div class="slot__badge">
            {{ slot.Kind === 'campaign' ? 'Кампания' : 'Событие' }}
          </div>
          <div class="slot__title">
            {{ slot.Title }}
          </div>
          <pre class="slot__descr">{{ slot.Description }}</pre>
        </div>
      </article>
    </section>

    <p v-if="!loading && !err && !slotsByDay.length" class="cal__hint">
      Нет записей в этом периоде.
    </p>
  </div>
</template>

<style scoped>
.cal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.cal__btn {
  min-width: 44px;
  min-height: 44px;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  background: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
}

.cal__btn:disabled {
  opacity: 0.5;
}

.cal__range {
  font-weight: 700;
  text-transform: capitalize;
}

.cal__hint {
  color: var(--tg-theme-hint-color, #888);
}

.cal__err {
  color: var(--tg-theme-destructive-text-color, #c00);
}

.totals {
  padding: 12px;
  border-radius: 10px;
  background: var(--tg-theme-secondary-bg-color, #f6f6f6);
  margin-bottom: 16px;
}

.totals__line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.totals__line--muted {
  font-size: 0.85rem;
  color: var(--tg-theme-hint-color, #666);
  flex-wrap: wrap;
}

.totals__code {
  font-size: 0.8rem;
  margin-top: 4px;
  color: var(--tg-theme-hint-color, #888);
}

.day__title {
  font-size: 1rem;
  margin: 16px 0 8px;
}

.slot {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
  background: var(--tg-theme-bg-color, #fff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.slot__time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  min-width: 52px;
}

.slot__badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--tg-theme-hint-color, #888);
}

.slot__title {
  font-weight: 600;
}

.slot__descr {
  margin: 4px 0 0;
  font-family: inherit;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
