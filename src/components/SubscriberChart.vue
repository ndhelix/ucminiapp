<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue';

export interface Series { Name: string; Channel: string; Dashed: boolean; Values: number[] }
const props = defineProps<{ labels: string[]; series: Series[] }>();
const hidden = ref<string[]>([]);
const shown = computed(() => props.series.filter(x => !hidden.value.includes(x.Name)));
const channels = computed(() => [...new Set(props.series.map(x => x.Channel))]);
const colors = ['#91c86b', '#f28b62', '#71c7dc', '#c39aed'];
const color = (s: Series) => colors[Math.max(0, channels.value.indexOf(s.Channel)) % colors.length];
const formatNumber = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? value.toLocaleString('ru-RU') : '—';
const hasData = computed(() => props.labels.length > 0 && props.series.some(s => s.Values.some(Number.isFinite)));

const frame = ref<HTMLDivElement | null>(null);
const width = ref(600);
const height = computed(() => width.value < 480 ? 260 : 320);
const left = 54, right = 20, top = 22, bottom = 42;
const plotWidth = computed(() => Math.max(1, width.value - left - right));
const plotBottom = computed(() => height.value - bottom);
// Round the scale to integer steps, including all-zero and single-period reports.
const step = computed(() => {
  const peak = shown.value.reduce((max, s) => s.Values.reduce((vmax, v) => Number.isFinite(v) ? Math.max(vmax, v) : vmax, max), 0);
  const rough = Math.max(1, peak / 4);
  const power = 10 ** Math.floor(Math.log10(rough));
  return ([1, 2, 5, 10].find(n => n * power >= rough) || 10) * power;
});
const max = computed(() => step.value * 4);
const px = (i: number) => left + (props.labels.length === 1 ? plotWidth.value / 2 : i * plotWidth.value / Math.max(1, props.labels.length - 1));
const py = (v: number) => plotBottom.value - v * (plotBottom.value - top) / max.value;
const points = (s: Series) => s.Values.slice(0, props.labels.length).map((v, i) => Number.isFinite(v) ? `${px(i)},${py(v)}` : '').filter(Boolean).join(' ');
const xTicks = computed(() => {
  const count = Math.min(props.labels.length, width.value < 480 ? 2 : 5);
  return [...new Set(Array.from({ length: count }, (_, i) => Math.round(i * (props.labels.length - 1) / Math.max(1, count - 1))))];
});
const axisNumber = (v: number) => v >= 1000000 ? `${+(v / 1000000).toFixed(1)}м` : v >= 10000 ? `${+(v / 1000).toFixed(1)}к` : String(v);

const selected = ref<number | null>(null);
const inputMode = ref<'mouse' | 'touch' | 'keyboard'>('mouse');
const active = computed(() => selected.value !== null && selected.value < props.labels.length && shown.value.length > 0 ? selected.value : null);
const floating = computed(() => width.value >= 640 && inputMode.value === 'mouse');
const tooltipStyle = computed(() => {
  if (!floating.value || active.value === null) return undefined;
  const x = px(active.value), tooltipWidth = 286;
  return { left: `${Math.max(8, Math.min(width.value - tooltipWidth - 8, x > width.value / 2 ? x - tooltipWidth - 18 : x + 18))}px`, top: '12px' };
});
const id = useId(), helpId = `${id}-help`, tooltipId = `${id}-tooltip`;

function toggle(name: string) {
  hidden.value = hidden.value.includes(name) ? hidden.value.filter(x => x !== name) : [...hidden.value, name];
}
function selectAt(event: PointerEvent) {
  if (!hasData.value || !shown.value.length) return;
  const bounds = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
  const x = (event.clientX - bounds.left) * width.value / bounds.width;
  inputMode.value = event.pointerType === 'touch' ? 'touch' : 'mouse';
  selected.value = Math.max(0, Math.min(props.labels.length - 1, Math.round((x - left) / plotWidth.value * (props.labels.length - 1))));
}
function leave(event: PointerEvent) { if (event.pointerType === 'mouse' && floating.value) selected.value = null; }
function keydown(event: KeyboardEvent) {
  if (!hasData.value || !shown.value.length) return;
  const current = selected.value ?? 0, last = props.labels.length - 1;
  const keys: Record<string, number | null> = { ArrowLeft: Math.max(0, current - 1), ArrowRight: Math.min(last, current + 1), Home: 0, End: last, Escape: null };
  if (!(event.key in keys)) return;
  event.preventDefault(); inputMode.value = 'keyboard'; selected.value = keys[event.key];
}

let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  if (!frame.value) return;
  const resize = () => { if (frame.value) width.value = Math.max(240, frame.value.clientWidth); };
  resize(); resizeObserver = new ResizeObserver(resize); resizeObserver.observe(frame.value);
});
onUnmounted(() => resizeObserver?.disconnect());
watch(() => [props.labels, props.series], () => {
  selected.value = null;
  hidden.value = hidden.value.filter(name => props.series.some(s => s.Name === name));
});
</script>

<template>
  <section class="subscriber-chart" aria-label="График динамики подписчиков">
    <header class="chart-header">
      <div><p class="chart-eyebrow">Подписчики</p><h2>Динамика каналов</h2></div>
      <span class="chart-count">Линии <b>{{ shown.length }}</b> / {{ series.length }}</span>
    </header>
    <div class="chart-subheader">
      <span class="chart-period">{{ labels[0] || 'Нет периода' }}<template v-if="labels.length > 1"> — {{ labels[labels.length - 1] }}</template></span>
      <div class="chart-key"><span><i />Подписки</span><span><i class="dashed" />Отписки</span></div>
    </div>
    <div ref="frame" class="chart-frame" @pointerleave="leave">
      <template v-if="hasData">
        <svg class="chart-plot" :viewBox="`0 0 ${width} ${height}`" :height="height" tabindex="0" role="group"
          aria-label="Динамика подписчиков. Стрелками влево и вправо выберите период. Escape закрывает значения."
          :aria-describedby="active === null ? helpId : tooltipId" @pointermove="selectAt" @pointerdown="selectAt" @keydown="keydown">
          <title>Подписки и отписки по периодам</title>
          <g class="chart-grid" aria-hidden="true">
            <g v-for="n in [0, 1, 2, 3, 4]" :key="n">
              <line :x1="left" :x2="width - right" :y1="py(step * n)" :y2="py(step * n)" />
              <text :x="left - 10" :y="py(step * n) + 4" text-anchor="end">{{ axisNumber(step * n) }}</text>
            </g>
            <g v-for="i in xTicks" :key="i">
              <line :x1="px(i)" :x2="px(i)" :y1="top" :y2="plotBottom" class="chart-grid__vertical" />
              <text :x="px(i)" :y="height - 15" :text-anchor="labels.length === 1 ? 'middle' : i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'">{{ labels[i] }}</text>
            </g>
          </g>
          <g v-for="s in shown" :key="s.Name" aria-hidden="true">
            <polyline :points="points(s)" fill="none" :stroke="color(s)" :stroke-width="s.Dashed ? 2 : 2.6" :stroke-dasharray="s.Dashed ? '7 5' : undefined" stroke-linejoin="round" stroke-linecap="round" />
            <circle v-if="labels.length === 1 && Number.isFinite(s.Values[0])" :cx="px(0)" :cy="py(s.Values[0])" r="4" :fill="color(s)" />
          </g>
          <g v-if="active !== null" class="chart-cursor" aria-hidden="true">
            <line :x1="px(active)" :x2="px(active)" :y1="top" :y2="plotBottom" />
            <template v-for="s in shown" :key="s.Name">
              <circle v-if="Number.isFinite(s.Values[active])" :cx="px(active)" :cy="py(s.Values[active])" r="4.5" :fill="color(s)" />
            </template>
          </g>
          <rect :x="left" :y="top" :width="plotWidth" :height="plotBottom - top" fill="transparent" />
        </svg>
        <p v-if="!shown.length" class="chart-empty chart-empty--overlay">Все линии скрыты.<br>Выберите линию ниже или нажмите «Показать все».</p>
      </template>
      <p v-else class="chart-empty">Нет данных за выбранный период.</p>
      <div v-if="active !== null && hasData" :id="tooltipId" class="chart-tooltip" :class="{ 'chart-tooltip--floating': floating }" :style="tooltipStyle" role="tooltip" :aria-live="inputMode === 'keyboard' ? 'polite' : 'off'">
        <div class="chart-tooltip__heading"><strong>{{ labels[active] }}</strong><span>За период</span></div>
        <div v-for="s in shown" :key="s.Name" class="chart-tooltip__row">
          <span class="line-swatch" :class="{ dashed: s.Dashed }" :style="{ color: color(s) }" />
          <span>{{ s.Name }}</span><b>{{ formatNumber(s.Values[active]) }}</b>
        </div>
      </div>
    </div>
    <p :id="helpId" class="chart-hint">Наведите курсор или коснитесь графика, чтобы увидеть значения.</p>
    <div class="chart-controls">
      <span>Показать линии</span>
      <div><button type="button" class="chart-button" :disabled="!hidden.length" @click="hidden = []">Показать все</button><button type="button" class="chart-button" :disabled="!shown.length" @click="hidden = series.map(s => s.Name)">Скрыть все</button></div>
    </div>
    <div class="chart-legend" aria-label="Видимость линий">
      <button v-for="s in series" :key="s.Name" type="button" class="chart-legend__item" :class="{ 'chart-legend__item--hidden': hidden.includes(s.Name) }" :aria-pressed="!hidden.includes(s.Name)" :aria-label="s.Name" @click="toggle(s.Name)">
        <span class="line-swatch" :class="{ dashed: s.Dashed }" :style="{ color: color(s) }" />
        <span class="chart-legend__name">{{ s.Channel }}<small>{{ s.Dashed ? 'Отписки' : 'Подписки' }}</small></span>
        <span class="chart-legend__check" aria-hidden="true">{{ hidden.includes(s.Name) ? '+' : '✓' }}</span>
      </button>
    </div>
    <details class="chart-values"><summary>Значения по периодам</summary>
      <p v-if="!shown.length" class="chart-hint">Выберите линии, чтобы показать значения.</p>
      <div v-for="(day, i) in labels" :key="i" class="chart-values__period"><strong>{{ day }}</strong><p v-for="s in shown" :key="s.Name">{{ s.Name }}: <b>{{ formatNumber(s.Values[i]) }}</b></p></div>
    </details>
  </section>
</template>

<style scoped>
.subscriber-chart {
  margin: 20px 0; padding: 20px; min-width: 0; box-sizing: border-box;
  color: #e7e3da; background: linear-gradient(135deg, #232a2d, #151b1f 70%);
  border: 1px solid #465052; border-top: 3px solid #b94a3b; border-radius: 3px;
  box-shadow: 0 10px 28px #00000020, inset 0 0 0 1px #ffffff03; color-scheme: dark;
}
.chart-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.chart-eyebrow { margin: 0 0 5px; color: #c39277; text-transform: uppercase; letter-spacing: .18em; font-size: 10px; font-weight: 700; }
.subscriber-chart h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 25px; font-weight: 400; letter-spacing: .02em; line-height: 1.2; }
.chart-count { flex-shrink: 0; padding: 6px 8px; border: 1px solid #454b49; font-size: 11px; color: #a8b2b4; white-space: nowrap; }
.chart-count b { color: #e5c694; font-size: 14px; margin-left: 4px; }
.chart-subheader { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin: 14px 0 6px; font-size: 11px; color: #a8b2b4; }
.chart-period { font-variant-numeric: tabular-nums; }
.chart-key { display: flex; gap: 14px; }
.chart-key span { display: flex; align-items: center; gap: 6px; }
.chart-key i, .line-swatch { display: inline-block; width: 22px; flex: 0 0 22px; border-top: 2px solid; }
.dashed { border-top-style: dashed !important; }
.chart-frame { position: relative; min-width: 0; }
.chart-plot { display: block; width: 100%; touch-action: pan-y; cursor: crosshair; }
.chart-grid line { stroke: #667371; stroke-opacity: .23; }
.chart-grid .chart-grid__vertical { stroke-opacity: .1; }
.chart-grid text { fill: #a1b0b4; font-family: monospace; font-size: 10px; }
.chart-cursor { pointer-events: none; }
.chart-cursor line { stroke: #dcd5c5; stroke-width: 1; stroke-dasharray: 3 4; opacity: .7; }
.chart-cursor circle { stroke: #182024; stroke-width: 2; }
.chart-tooltip { padding: 12px; box-sizing: border-box; background: #10171c; border: 1px solid #72604b; border-top: 2px solid #ce9c66; margin: 4px 0 12px; color: #e7e3da; }
.chart-tooltip--floating { position: absolute; width: 286px; margin: 0; z-index: 2; pointer-events: none; box-shadow: 0 6px 20px #0009; }
.chart-tooltip__heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #343d41; padding-bottom: 8px; margin-bottom: 6px; font-size: 13px; }
.chart-tooltip__heading span { color: #a0afb5; font-size: 10px; text-transform: uppercase; letter-spacing: .07em; }
.chart-tooltip__row { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 11px; line-height: 1.4; padding: 5px 0; }
.chart-tooltip__row .line-swatch { width: 18px; }
.chart-tooltip__row span { overflow-wrap: anywhere; }
.chart-tooltip__row b { font-variant-numeric: tabular-nums; color: #f1e5ce; font-size: 13px; }
.chart-hint { margin: 10px 0 16px; color: #a8b2b4; font-size: 11px; line-height: 1.5; }
.chart-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #3b4445; }
.chart-controls > span { color: #bca384; text-transform: uppercase; font-size: 10px; letter-spacing: .09em; }
.chart-controls > div { display: flex; gap: 4px; }
.subscriber-chart .chart-button { background: transparent; color: #d2d8d8; border: 1px solid #465252; border-radius: 2px; font-size: 11px; padding: 6px 9px; min-height: 36px; }
.chart-legend { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.subscriber-chart .chart-legend__item { display: flex; align-items: center; gap: 8px; background: #24302f; border: 1px solid #4b5f56; color: #e5e8e2; padding: 10px; min-height: 58px; border-radius: 2px; text-align: left; min-width: 0; }
.chart-legend__name { flex: 1; min-width: 0; font-size: 11px; overflow-wrap: anywhere; line-height: 1.3; }
.chart-legend__name small { display: block; font-size: 10px; color: #b4c0ba; margin-top: 4px; }
.chart-legend__check { color: #accb95; font-size: 13px; }
.subscriber-chart .chart-legend__item--hidden { background: #192024; border-color: #394347; color: #96a1a6; }
.chart-legend__item--hidden .line-swatch { opacity: .35; }
.chart-legend__item--hidden .chart-legend__check { color: #9ba8ab; }
.chart-values { margin-top: 16px; border-top: 1px solid #3b4445; font-size: 12px; }
.chart-values summary { color: #c7b294; }
.chart-values__period { padding: 12px 0; border-top: 1px solid #303b3e; }
.chart-values__period strong { color: #e3c99b; }
.chart-values__period p { margin: 6px 0; overflow-wrap: anywhere; }
.chart-empty { text-align: center; padding: 64px 12px; color: #bdc5c7; font-size: 13px; }
.chart-empty--overlay { position: absolute; top: 25%; left: 15%; right: 5%; padding: 16px 8px; background: #1b2329ed; pointer-events: none; }
.subscriber-chart :focus-visible { outline: 2px solid #e8b575; outline-offset: 3px; }
@media (hover: hover) {
  .subscriber-chart .chart-legend__item:hover, .subscriber-chart .chart-button:enabled:hover { border-color: #bd9070; background: #323734; }
}
@media (max-width: 760px) { .chart-legend { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) {
  .subscriber-chart { padding: 14px 10px; }
  .subscriber-chart h2 { font-size: 21px; }
  .chart-count { padding: 4px 6px; }
  .chart-legend__item .line-swatch { width: 16px; flex-basis: 16px; }
  .subscriber-chart .chart-legend__item { padding: 10px 7px; gap: 6px; }
  .subscriber-chart .chart-button { min-height: 44px; }
}
</style>
