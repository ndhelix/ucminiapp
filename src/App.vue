<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useBackButton } from '@/composables/useBackButton';
import { workspace, loadWorkspace } from '@/api/workspace';
import type { Permissions } from '@/api/workspace';
import '@/assets/workspace.css';

useBackButton();

const loading = ref( true );
const me = computed(() => workspace.me);
const route = useRoute();
const allowed = computed(() => {
  const permission = route.meta.permission as keyof Permissions | undefined;
  return !permission || !!me.value?.Permissions[permission];
});
const loadErr = ref<string | null>( null );

onMounted( async () => {
  try {
    await loadWorkspace();
  }
  catch ( e ) {
    loadErr.value = e instanceof Error ? e.message : String( e );
  }
  finally {
    loading.value = false;
  }
} );
</script>

<template>
  <div class="app-shell">
    <template v-if="loading">
      <div class="app-state">
        Загрузка…
      </div>
    </template>
    <template v-else-if="loadErr">
      <div class="app-state app-state--error">
        {{ loadErr }}
      </div>
    </template>
    <template v-else-if="!me">
      <div class="app-state app-state--error">
        Нет доступа к мини-приложению.
      </div>
    </template>
    <template v-else>
      <header class="app-header">
        <RouterLink to="/" class="app-header__title" aria-label="CRM — главная">
          CRM
        </RouterLink>
        <div class="app-header__sub">
          {{ me?.Name }} · компания {{ me?.CompanyId }}
          <span v-if="me?.Permissions.IsAdmin" class="badge">админ</span>
        </div>
      </header>
      <main class="app-main">
        <RouterView v-if="allowed" :key="route.path" />
        <p v-else role="alert">Этот раздел недоступен по вашей должности.</p>
      </main>
      <nav class="app-nav">
        <RouterLink class="app-nav__link" exact-active-class="app-nav__link--active" to="/">
          Главная
        </RouterLink>
        <RouterLink v-if="me?.Permissions.Clients" class="app-nav__link" :class="{ 'app-nav__link--active': route.path.startsWith('/clients') }" to="/clients">Клиенты</RouterLink>
        <RouterLink v-if="me?.Permissions.Events" class="app-nav__link" :class="{ 'app-nav__link--active': route.path.startsWith('/events') }" to="/events">События</RouterLink>
        <RouterLink v-if="me?.Permissions.Missions" class="app-nav__link" :class="{ 'app-nav__link--active': route.path.startsWith('/missions') }" to="/missions">Задачи</RouterLink>
        <RouterLink class="app-nav__link" :class="{ 'app-nav__link--active': ['/more', '/reports', '/analytics', '/notifications', '/payments', '/catalog', '/bulk', '/exams', '/audit', '/bot-stream'].some(path => route.path === path || route.path.startsWith(path + '/')) }" to="/more">Ещё</RouterLink>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.app-state {
  padding: 24px 16px;
  text-align: center;
  color: var(--tg-theme-hint-color, #888);
}

.app-state--error {
  color: var(--tg-theme-destructive-text-color, #c00);
}

.app-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
}

.app-header__title {
  color: inherit;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 700;
}

.app-header__sub {
  font-size: 0.85rem;
  color: var(--tg-theme-hint-color, #888);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
}

.app-main {
  flex: 1;
  padding: 12px 16px 88px;
}

.app-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  border-top: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
  background: var(--tg-theme-bg-color, #fff);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 10;
}

.app-nav__link {
  flex: 1;
  text-align: center;
  padding: 14px 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--tg-theme-link-color, #2481cc);
  text-decoration: none;
}

.app-nav__link--active {
  background: var(--tg-theme-secondary-bg-color, #f4f4f4);
}
</style>
