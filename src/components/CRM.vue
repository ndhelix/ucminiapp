<script lang="ts">
  import { defineComponent, reactive } from 'vue';
  import axios from 'axios';

  interface Task {
    Name: string;
    Descr: string;
  }

  export default defineComponent({
    name: 'TaskForm',
    setup() {
      const formData = reactive<Task>({
        Name: '',
        Descr: ''
      });

      const submitForm = async () => {
        try {
          const response = await axios.post('https://unit-control.com/Missions/PostTask', formData, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Response:', response.data);
          alert('Task submitted successfully!');
        } catch (error) {
          console.error('Error submitting task:', error);
          alert('Failed to submit task.');
        }
      };

      return { formData, submitForm };
    }
  });
</script>
