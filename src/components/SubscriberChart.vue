<script setup lang="ts">
import { computed, ref } from 'vue';
export interface Series { Name: string; Channel: string; Dashed: boolean; Values: number[] }
const props = defineProps<{ labels: string[]; series: Series[] }>();
const hidden = ref<string[]>([]);
const shown = computed(() => props.series.filter(x => !hidden.value.includes(x.Name)));
const max = computed(() => Math.max(1, ...shown.value.flatMap(x => x.Values)));
const colors = ['#168e96', '#e05269', '#b88900', '#9760dc'];
const color = (s: Series) => colors[Math.max(0, [...new Set(props.series.map(x => x.Channel))].indexOf(s.Channel)) % 4];
const px = (i: number) => 42 + i * 530 / Math.max(1, props.labels.length - 1);
const py = (v: number) => 220 - v * 195 / max.value;
const points = (s: Series) => s.Values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
function toggle(name: string) { hidden.value = hidden.value.includes(name) ? hidden.value.filter(x => x !== name) : [...hidden.value, name]; }
</script>
<template>
  <div><svg viewBox="0 0 600 255" role="img" aria-label="Динамика подписчиков: сплошные линии — подписки, пунктирные — отписки">
    <g v-for="n in [0, 0.5, 1]" :key="n"><line x1="42" x2="572" :y1="py(max * n)" :y2="py(max * n)" stroke="currentColor" opacity=".2" /><text x="3" :y="py(max * n) + 4" fill="currentColor" font-size="12">{{ Math.round(max * n) }}</text></g>
    <g v-for="s in shown" :key="s.Name"><polyline :points="points(s)" fill="none" :stroke="color(s)" stroke-width="2.5" :stroke-dasharray="s.Dashed ? '6 4' : undefined" /><circle v-for="(v, i) in s.Values" :key="i" :cx="px(i)" :cy="py(v)" r="2.5" :fill="color(s)"><title>{{ labels[i] }}: {{ s.Name }} — {{ v }}</title></circle></g>
    <text x="42" y="248" fill="currentColor" font-size="12">{{ labels[0] }}</text><text x="572" y="248" text-anchor="end" fill="currentColor" font-size="12">{{ labels[labels.length - 1] }}</text>
  </svg><div class="legend"><button v-for="s in series" :key="s.Name" class="secondary" :aria-pressed="!hidden.includes(s.Name)" @click="toggle(s.Name)"><span :style="{ borderColor: color(s), borderTopStyle: s.Dashed ? 'dashed' : 'solid' }" />{{ s.Name }}</button></div>
    <details><summary>Значения по периодам</summary><div v-for="(day, i) in labels" :key="day" class="detail-section"><strong>{{ day }}</strong><p v-for="s in shown" :key="s.Name">{{ s.Name }}: {{ s.Values[i] }}</p></div></details>
  </div>
</template>
<style scoped>
svg { display: block; width: 100%; height: auto; margin: 16px 0; }
.legend { display: flex; flex-wrap: wrap; gap: 8px; }
.legend button { display: flex; align-items: center; gap: 8px; text-align: left; font-size: .8rem; }
.legend span { width: 20px; border-top-width: 3px; }
.legend button[aria-pressed="false"] { opacity: .45; }
</style>
