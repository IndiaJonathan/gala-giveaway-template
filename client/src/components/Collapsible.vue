<template>
  <div class="collapsible-container" :class="{ 'collapsed-bg': collapsible && !isOpen }">
    <div class="collapsible-header" @click="collapsible && toggle" style="cursor: pointer;">
      <h5 style="margin-bottom: 12px;">
        {{ title }} <span class="required">*</span>
      </h5>
    </div>
    <!-- Wrap the content slot in a transition for animation -->
    <transition name="collapse">
      <div v-show="!collapsible || isOpen">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  collapsible: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: true },
});

const emit = defineEmits(['update:isOpen']);

const toggle = () => {
  emit('update:isOpen', !props.isOpen);
};
</script>

<style scoped>
.collapsible-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 6px;
  border-radius: 16px;
  border: 1px solid rgba(236, 236, 236, 0.1);
}

.collapsed-bg {
  /* Background color when collapsed */
  background-color: #1a1a1a;
}

.required {
  color: red;
}

/* Animation for folding out/in */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1000px; /* An arbitrarily high max-height */
}
</style>
