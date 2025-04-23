<script  lang="ts">
  import { computed } from 'vue';
  import { routes } from '@/router';
  import AppPage from '@/components/AppPage.vue';
  import AppLink from '@/components/AppLink.vue';
  import TaskForm from '@/components/CRM.vue';
  import axios from 'axios';

  const nonIndexRoutes = computed(() => routes.filter((r) => !!r.meta?.title));

  export default {
    data() {
      return {
        formData: {
          Name: '',
          Descr: ''
        }
      };
    },
    methods: {
      async submitForm() {
        alert('Hello task.');
        try {
          const response = await axios.post('https://unit-control.com/Missions/PostTask', formData, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Response:', response.data);
          alert('Task submitted successfully!');
        } catch (error) {
          console.error('Error submitting task:', error);
          alert('Failed to submit task.' + error);
        }
      }
    }
  };

</script>


<template>
  <AppPage title="UNIT-CONTROL" :back="false">
    <h2 class="text-xl font-bold mb-4">Новая задача</h2>
    <form @submit.prevent="submitForm"  class="space-y-4">
      <input v-model="formData.Name" type="text" placeholder="Название" class="border p-2 w-full rounded" required />
      <input v-model="formData.Descr" type="text" placeholder="Описание" class="border p-2 w-full rounded" required />
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Создать</button>
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
