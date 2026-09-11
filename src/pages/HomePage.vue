<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, errorText, workspace } from '@/api/workspace';
import type { Permissions } from '@/api/workspace';
import type { CatalogDefinition } from '@/api/catalog';
import SectionIcon from '@/components/SectionIcon.vue';

interface Section { title: string; to: string; icon: string; permission?: keyof Permissions; color?: string }
const mainSections: Section[] = [
  { title: 'Календарь', to: '/calendar', icon: 'calendar', permission: 'Events', color: '#3678d4' },
  { title: 'Клиенты', to: '/clients', icon: 'clients', permission: 'Clients', color: '#258978' },
  { title: 'События', to: '/events', icon: 'events', permission: 'Events', color: '#9260c8' },
  { title: 'Уведомления', to: '/notifications', icon: 'notifications', permission: 'Notifications', color: '#be7921' },
  { title: 'Отчеты', to: '/reports', icon: 'reports', permission: 'Reports', color: '#4b6cba' },
  { title: 'Платежи от клиентов', to: '/payments', icon: 'payments', permission: 'Payments', color: '#31856a' },
];
const allowed = (section: Section) => !section.permission || !!workspace.me?.Permissions[section.permission];
const primary = computed(() => mainSections.filter(allowed));
const catalog = ref<CatalogDefinition[]>([]);
const loading = ref(true), error = ref('');
const secondary = computed(() => {
  const items: Section[] = [
  { title: 'Задачи', to: '/missions', icon: 'missions', permission: 'Missions' },
  { title: 'Подписчики и аналитика', to: '/analytics', icon: 'analytics', permission: 'Reports' },
  ...catalog.value.map(x => ({ title: x.Kind === 'surveys' ? 'Тесты сотрудников' : x.Title, to: `/catalog/${x.Kind}`, icon: x.Kind })),
  ...(workspace.me?.CompanyId === 8 ? [{ title: 'Массовые рассылки', to: '/bulk', icon: 'bulk', permission: 'Messages' as const }] : []),
  { title: 'Пройти тест', to: '/exams', icon: 'exams' },
  { title: 'Сообщения ботов', to: '/bot-stream', icon: 'bot-stream', permission: 'IsAdmin' },
  { title: 'Журнал действий', to: '/audit', icon: 'audit', permission: 'IsAdmin' },
  ];
  return items.filter(allowed);
});

async function loadCatalog() {
  loading.value = true; error.value = '';
  try { catalog.value = (await api<{ Items: CatalogDefinition[] }>('CatalogSections')).Items; }
  catch (e) { error.value = errorText(e); }
  finally { loading.value = false; }
}
onMounted(loadCatalog);
</script>

<template>
  <section class="workspace-page home-page">
    <h1>Разделы CRM</h1>
    <nav v-if="primary.length" class="section-grid section-grid--primary" aria-label="Основные разделы">
      <RouterLink v-for="item in primary" :key="item.to" :to="item.to" class="section-tile section-tile--primary" :style="{ '--tile-accent': item.color }">
        <span class="section-tile__icon"><SectionIcon :name="item.icon" /></span>
        <span class="section-tile__label">{{ item.title }}</span>
      </RouterLink>
    </nav>

    <h2>Другие разделы</h2>
    <nav class="section-grid section-grid--secondary" aria-label="Другие разделы">
      <RouterLink v-for="item in secondary" :key="item.to" :to="item.to" class="section-tile section-tile--secondary">
        <span class="section-tile__icon"><SectionIcon :name="item.icon" /></span>
        <span class="section-tile__label">{{ item.title }}</span>
      </RouterLink>
    </nav>
    <p v-if="loading" class="muted" role="status">Загрузка справочников…</p>
    <div v-if="error" class="catalog-error" role="alert">
      <p class="error-text">Не удалось загрузить справочники. {{ error }}</p>
      <button class="secondary" @click="loadCatalog">Повторить</button>
    </div>
  </section>
</template>

<style scoped>
.home-page h1 { margin: 0 0 18px; }
.home-page h2 { margin: 26px 0 14px; font-size: 1rem; }
.section-grid { display: grid; gap: 10px; }
.section-grid--primary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.section-grid--secondary { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.home-page a.section-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  min-width: 0; box-sizing: border-box; text-align: center; text-decoration: none;
  color: var(--tg-theme-text-color, #243247);
  background: var(--tg-theme-bg-color, #fff);
  border: 1px solid var(--tg-theme-section-separator-color, #e5eaf0);
  transition: background-color .15s ease, border-color .15s ease;
}
.section-tile--primary { border-radius: 16px; padding: 16px 6px 12px; gap: 12px; min-height: 144px; }
.section-tile--secondary { border-radius: 12px; padding: 12px 6px; gap: 8px; min-height: 100px; }
.section-tile__icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.section-tile--primary .section-tile__icon {
  width: 62px; height: 62px; border-radius: 18px;
  color: var(--tile-accent); background: var(--tg-theme-secondary-bg-color, #f1f5fa);
  background: color-mix(in srgb, var(--tile-accent) 12%, var(--tg-theme-bg-color, #fff));
}
.section-tile--primary svg { width: 40px; height: 40px; }
.section-tile--secondary .section-tile__icon { width: 32px; height: 32px; color: var(--tg-theme-link-color, #547899); }
.section-tile--secondary svg { width: 27px; height: 27px; }
.section-tile__label { overflow-wrap: anywhere; line-height: 1.3; }
.section-tile--primary .section-tile__label { font-size: .85rem; font-weight: 600; }
.section-tile--secondary .section-tile__label { font-size: .77rem; }
.home-page a.section-tile:active { background: var(--tg-theme-secondary-bg-color, #eef3f8); }
@media (hover: hover) {
  .home-page a.section-tile:hover { border-color: var(--tg-theme-link-color, #2481cc); background: var(--tg-theme-secondary-bg-color, #f5f8fc); }
}
@media (max-width: 359px) { .section-grid--primary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 600px) {
  .section-grid--secondary { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .section-tile--primary .section-tile__label { font-size: 1rem; }
  .section-tile--secondary .section-tile__label { font-size: .85rem; }
}
@media (min-width: 860px) {
  .section-grid--primary, .section-grid--secondary { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) { .section-tile { transition: none; } }
</style>
