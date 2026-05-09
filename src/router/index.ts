import { createRouter, createWebHistory } from 'vue-router';
import CalendarPage from '@/pages/CalendarPage.vue';
import ReportsPage from '@/pages/ReportsPage.vue';

export const routes = [
  {
    path: '/',
    name: 'calendar',
    component: CalendarPage,
    meta: { title: 'Календарь' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsPage,
    meta: { title: 'Отчёты' },
  },
];

const router = createRouter( {
  history: createWebHistory( import.meta.env.BASE_URL ),
  routes,
} );

export default router;
