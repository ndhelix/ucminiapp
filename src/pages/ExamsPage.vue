<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { api, errorText, dateText, requestId } from '@/api/workspace';
interface Survey { Id: number; Name: string; Comments: string; AttemptsLeft: number; BestPercent: number }
interface Exam { Id: number; Name: string; Revision: string; Questions: { Id: number; Name: string; Answers: { Id: number; Name: string }[] }[] }
const data = ref<{ Items: Survey[]; History: { Id: number; SurveyId: number; Created: string; CorrectCount: number; QuestionCount: number }[] } | null>(null);
const exam = ref<Exam | null>(null), selected = ref<number[]>([]), result = ref<{ Percent: number; CorrectCount: number; QuestionCount: number } | null>(null);
const loading = ref(false), error = ref(''); let operationId = requestId();
async function load() { try { data.value = await api('Exams'); } catch (e) { error.value = errorText(e); } }
async function start(id: number) { loading.value = true; error.value = ''; result.value = null; try { exam.value = await api('ExamQuestions', { Id: id }); selected.value = []; operationId = requestId(); } catch (e) { error.value = errorText(e); } finally { loading.value = false; } }
async function submit() { if (!exam.value || loading.value || !window.confirm('Завершить тест и сохранить результат?')) return; loading.value = true; error.value = ''; try { result.value = await api('SubmitExam', { Id: exam.value.Id, Revision: exam.value.Revision, Answers: selected.value, RequestId: operationId }); exam.value = null; selected.value = []; await load(); } catch (e) { error.value = errorText(e); } finally { loading.value = false; } }
function cancel() { if (!window.confirm('Закрыть тест без сохранения результата?')) return; exam.value = null; selected.value = []; }
onBeforeRouteLeave(() => !exam.value || window.confirm('Уйти без завершения теста?'));
onMounted(load);
</script>
<template>
  <section class="workspace-page"><h1>{{ exam?.Name || 'Тесты сотрудников' }}</h1><p v-if="error" class="error-text" role="alert">{{ error }}</p><p v-if="loading">Загрузка…</p>
    <section v-if="result" class="detail-section" role="status"><h2>Результат: {{ result.Percent }}%</h2><p>Правильных ответов: {{ result.CorrectCount }} из {{ result.QuestionCount }}</p><p>{{ result.Percent > 75 ? 'Тест пройден.' : 'Для прохождения нужно более 75%.' }}</p></section>
    <form v-if="exam" class="editor" @submit.prevent="submit"><p>В вопросе может быть несколько правильных ответов. Всего доступно 5 попыток.</p><fieldset :disabled="loading"><section v-for="(q, i) in exam.Questions" :key="q.Id" class="detail-section"><h2>{{ i + 1 }}. {{ q.Name }}</h2><label v-for="a in q.Answers" :key="a.Id" class="check-label"><input v-model="selected" type="checkbox" :value="a.Id">{{ a.Name }}</label></section><div class="actions"><button>Завершить тест</button><button type="button" class="secondary" @click="cancel">Отмена</button></div></fieldset></form>
    <template v-else-if="data"><p v-if="!data.Items.length">Активных тестов нет.</p><article v-for="x in data.Items" :key="x.Id" class="detail-section"><h2>{{ x.Name }}</h2><p class="full-text">{{ x.Comments }}</p><p>Попыток осталось: {{ x.AttemptsLeft }} · Лучший результат: {{ x.BestPercent }}%</p><button :disabled="loading || !x.AttemptsLeft" @click="start(x.Id)">Пройти тест</button></article><h2>Мои результаты</h2><p v-for="x in data.History" :key="x.Id">{{ dateText(x.Created) }} · {{ data.Items.find(s => s.Id === x.SurveyId)?.Name || `Тест №${x.SurveyId}` }} · {{ x.CorrectCount }}/{{ x.QuestionCount }}</p></template>
  </section>
</template>
