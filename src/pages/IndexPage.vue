<script setup lang="ts">
  import { computed } from 'vue';
  import { routes } from '@/router';
  import AppPage from '@/components/AppPage.vue';
  import AppLink from '@/components/AppLink.vue';
  import  CRM from '@/components/CRM.vue';


  const nonIndexRoutes = computed(() => routes.filter((r) => !!r.meta?.title));


</script>


<template>
  <AppPage title="ДОбро" :back="false">
    <h2 class="text-xl font-bold mb-4">Submit Task</h2>
    <form @submit.prevent="submitForm" class="space-y-4">
      <input v-model="formData.Name" type="text" placeholder="Name" class="border p-2 w-full rounded" required />
      <input v-model="formData.Descr" type="text" placeholder="Description" class="border p-2 w-full rounded" required />
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
    </form>
    <p>
      This page is a home page in this boilerplate. gfhjfjghYou can use the links below to visit other
      pages with their own functionality.
    </p>
    <ul class="index-page__links">
      <li v-for="route in nonIndexRoutes" :key="route.name" class="index-page__link-item">
        <AppLink class="index-page__link" :to="{ name: route.name }">
          <i v-if="route.meta?.icon" class="index-page__link-icon">
            <component :is="route.meta.icon" />
          </i>
          {{ route.meta!.title }}
        </AppLink>
      </li>
    </ul>
  </AppPage>
</template>

<style scoped>
  .index-page__links {
    list-style: none;
    padding-left: 0;
  }

  .index-page__link {
    font-weight: bold;
    display: inline-flex;
    gap: 5px;
  }

  .index-page__link-item + .index-page__link-item {
    margin-top: 10px;
  }

  .index-page__link-icon {
    width: 20px;
    display: block;
  }

    .index-page__link-icon svg {
      display: block;
    }
</style>
