<template>
  <div>
    <v-checkbox v-model="isChecked" :label="label" :class="{ 'checked': isChecked }" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Require'
  }
});

const isChecked = ref(false);
</script>

<style scoped>


/* Target the v-checkbox when it is selected */
/* Style for the label when the checkbox is unchecked */
:deep(.v-label) {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6); /* Blue color when unchecked */
}

/* Style for the label when the checkbox is checked */
.checked :deep(.v-label) {
  color: rgba(255, 255, 255, 1); /* Blue color when unchecked */
}
</style>
