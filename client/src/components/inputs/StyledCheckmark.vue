<template>
  <div>
    <v-checkbox v-model="isChecked" :label="label" :class="{ 'checked': isChecked }" />
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Require'
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const isChecked = ref(props.modelValue);

watch(isChecked, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<style scoped>
:deep(.v-label) {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6); 
}

.checked :deep(.v-label) {
  color: rgba(255, 255, 255, 1);
}
</style>
