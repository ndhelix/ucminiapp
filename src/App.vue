<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useBackButton } from '@/composables/useBackButton';
import { getCrmClient } from '@/api/crmClient';
import type { MiniAppMeResponse } from '@/api/crmTypes';

useBackButton();

const loading = ref( true );
const me = ref<MiniAppMeResponse | null>( null );
const loadErr = ref<string | null>( null );

onMounted( async () => {
  try {
    const { data } = await getCrmClient().post<MiniAppMeResponse>( '/MiniApp/Me', {} );
    me.value = data;
    if ( !data.Success )
      loadErr.value = data.ErrMsg || 'Доступ запрещён';
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
    <template v-else-if="!me?.Success">
      <div class="app-state app-state--error">
        {{ me?.ErrMsg || 'Нет доступа к мини-приложению.' }}
      </div>
    </template>
    <template v-else>
      <header class="app-header">
        <div class="app-header__title">
          CRM
        </div>
        <div class="app-header__sub">
          {{ me?.Name }} · компания {{ me?.CompanyId }}
          <span v-if="me?.MiniappUserLevel === 2" class="badge">админ</span>
        </div>
      </header>
      <main class="app-main">
        <RouterView />
      </main>
      <nav class="app-nav">
        <RouterLink class="app-nav__link" active-class="app-nav__link--active" to="/">
          Календарь
        </RouterLink>
        <RouterLink class="app-nav__link" active-class="app-nav__link--active" to="/reports">
          Отчёты
        </RouterLink>
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
  padding: 14px 8px;
  font-weight: 600;
  color: var(--tg-theme-link-color, #2481cc);
  text-decoration: none;
}

.app-nav__link--active {
  background: var(--tg-theme-secondary-bg-color, #f4f4f4);
}
</style>
