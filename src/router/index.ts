import { createRouter, createWebHistory } from 'vue-router';
import CalendarPage from '@/pages/CalendarPage.vue';
import HomePage from '@/pages/HomePage.vue';
import ReportsPage from '@/pages/ReportsPage.vue';
import ClientsPage from '@/pages/ClientsPage.vue';
import ClientPage from '@/pages/ClientPage.vue';
import EventsPage from '@/pages/EventsPage.vue';
import EventPage from '@/pages/EventPage.vue';

export const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { title: 'Главная' } },
  { path: '/bot-stream', component: () => import('@/pages/BotStreamPage.vue'), meta: { permission: 'IsAdmin' } },
  { path: '/catalog', component: () => import('@/pages/CatalogSectionsPage.vue') },
  { path: '/catalog/:kind', component: () => import('@/pages/CatalogListPage.vue') },
  { path: '/catalog/:kind/:id', component: () => import('@/pages/CatalogRecordPage.vue') },
  { path: '/bulk', component: () => import('@/pages/BulkPage.vue'), meta: { permission: 'Messages' } },
  { path: '/exams', component: () => import('@/pages/ExamsPage.vue') },
  { path: '/audit', component: () => import('@/pages/AuditPage.vue'), meta: { permission: 'IsAdmin' } },
  { path: '/missions', component: () => import('@/pages/MissionsPage.vue'), meta: { permission: 'Missions' } },
  { path: '/missions/new', component: () => import('@/pages/MissionPage.vue'), meta: { permission: 'EditMissions' } },
  { path: '/missions/:id', component: () => import('@/pages/MissionPage.vue'), meta: { permission: 'Missions' } },
  { path: '/notifications', component: () => import('@/pages/NotificationsPage.vue'), meta: { permission: 'Notifications' } },
  { path: '/payments', component: () => import('@/pages/PaymentsPage.vue'), meta: { permission: 'Payments' } },
  { path: '/analytics', component: () => import('@/pages/AnalyticsPage.vue'), meta: { permission: 'Reports' } },
  { path: '/more', component: () => import('@/pages/MorePage.vue') },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage,
    meta: { title: 'Календарь', permission: 'Events' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsPage,
    meta: { title: 'Отчёты', permission: 'Reports' },
  },
  { path: '/clients', component: ClientsPage, meta: { title: 'Клиенты', permission: 'Clients' } },
  { path: '/clients/new', component: ClientPage, meta: { title: 'Новый клиент', permission: 'EditClients' } },
  { path: '/clients/:id', component: ClientPage, meta: { title: 'Клиент', permission: 'Clients' } },
  { path: '/events', component: EventsPage, meta: { title: 'События', permission: 'Events' } },
  { path: '/events/new', component: EventPage, meta: { title: 'Новое событие', permission: 'EditEvents' } },
  { path: '/events/:id', component: EventPage, meta: { title: 'Событие', permission: 'Events' } },
];

const router = createRouter( {
  history: createWebHistory( import.meta.env.BASE_URL ),
  routes,
  scrollBehavior(_to, _from, savedPosition) { return savedPosition || { top: 0 }; },
} );

export default router;
