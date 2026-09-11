<script setup lang="ts">
defineProps<{ name: string }>();

// Shared 24px grid keeps navigation symbols crisp at both tile sizes.
const paths: Record<string, string[]> = {
  calendar: ['M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z M7 3v4 M17 3v4 M3 10h18', 'M7 14h2 M15 14h2 M7 17h2 M15 17h2'],
  clients: ['M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M6 21v-3a6 6 0 0 1 12 0v3', 'M18 4a3 3 0 0 1 0 6 M21 20v-3a5 5 0 0 0-3-4 M6 4a3 3 0 0 0 0 6 M3 20v-3a5 5 0 0 1 3-4'],
  events: ['M9 4H5v17h14V4h-4 M9 2h6v5H9Z', 'm8 14 3 3 5-6'],
  notifications: ['M18 9a6 6 0 0 0-12 0c0 6-3 6-3 8h18c0-2-3-2-3-8Z M10 21h4 M12 1v2'],
  reports: ['M4 3v18h17 M8 16v-5 M13 16V7 M18 16v-9', 'm7 7 5-4 5 1 4-3'],
  payments: ['M3 5h18v15H3Z M3 9h18 M6 16h4', 'M14 13h4'],
  missions: ['m3 6 1 1 3-3 M10 6h11 m-18 7 1 1 3-3 M10 13h11 m-18 7 1 1 3-3 M10 20h11'],
  analytics: ['M3 20V4 M3 20h18 M6 15l4-5 4 3 6-9 M16 4h4v4'],
  services: ['M3 3h8l10 10-8 8L3 11Z', 'M8 7h.01'],
  campaigns: ['M3 10v5h5l11 5V4L8 10Z M8 15l2 6H6l-2-6 M22 9v6'],
  tgchannels: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M3 12h18', 'M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z'],
  managers: ['M4 4h16v17H4Z M9 2h6v4 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M8 18v-1a4 4 0 0 1 8 0v1'],
  expenses: ['M4 3h16v19l-4-2-4 2-4-2-4 2Z M8 7h8 M8 11h8 M10 16h6'],
  adsources: ['M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2', 'M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'],
  products: ['m3 7 9-5 9 5v10l-9 5-9-5Z M3 7l9 5 9-5 M12 12v10 M8 4l9 5'],
  channels: ['M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', 'M6 6a9 9 0 0 0 0 12 M18 6a9 9 0 0 1 0 12 M3 3a13 13 0 0 0 0 18 M21 3a13 13 0 0 1 0 18'],
  companies: ['M5 21V3h14v18 M2 21h20 M9 21v-5h6v5 M9 7h1 M14 7h1 M9 11h1 M14 11h1'],
  templates: ['M3 4h18v14H8l-5 4Z M7 8h10 M7 12h7'],
  jobs: ['M3 7h18v14H3Z M8 7V3h8v4 M3 12l9 3 9-3 M12 13v4'],
  tickers: ['M3 21h18 M7 3v15 M4 7h6v7H4Z M17 5v15 M14 10h6v6h-6Z'],
  payroll: ['M3 5h18v14H3Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M6 12h.01 M18 12h.01'],
  surveys: ['M9 4H5v17h14V4h-4 M9 2h6v5H9Z M8 11h8 M8 15h8 M8 18h4'],
  bulk: ['M2 7h17v14H2Z m0 0 8.5 7L19 7 M6 3h16v13'],
  exams: ['m2 8 10-5 10 5-10 5Z M6 10v7c4 3 8 3 12 0v-7 M22 8v10'],
  'bot-stream': ['M4 7h16v14H4Z M12 3v4 M10 3h4 M1 12v5 M23 12v5 M8 12h.01 M16 12h.01 M8 17h8'],
  audit: ['M4 3h12v7 M4 3v18h8 M8 7h4 M8 11h3', 'M21 15a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z M15 12v3l2 1'],
  grid: ['M3 3h7v7H3Z M14 3h7v7h-7Z M3 14h7v7H3Z M14 14h7v7h-7Z'],
};
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in paths[name] || paths.grid" :key="index" :d="path" />
  </svg>
</template>
