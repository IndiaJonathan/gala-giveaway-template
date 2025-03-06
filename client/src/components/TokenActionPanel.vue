<template>
  <Collapsible :title="title" :collapsible="false" isOpen :class="{'mb-4': true, ...customClass}">
    <!-- Explanatory text -->
    <p class="explanatory-text mb-8">
      <slot name="explanatoryText">
        {{ explanatoryText }}
      </slot>
    </p>

    <!-- Token info -->
    <div class="token-info">
      <div class="token-section">
        <div class="token-label">{{ tokenLabelText }}</div>
        <div class="token-value">
          <div class="token-icon">
            <img v-if="tokenImage" class="token-img" :src="tokenImage" alt="token icon" />
            <div v-else class="token-icon-circle"></div>
            <span>{{ tokenSymbol }}</span>
          </div>
        </div>
      </div>
      <!-- Status indicator (optional) -->
      <div v-if="showStatusIndicator" class="missing-allowance">{{ statusText }}</div>
    </div>

    <!-- Content area for balance display -->
    <slot name="content"></slot>

    <!-- Action button -->
    <slot name="actionButton">
      <button 
        class="action-btn" 
        :disabled="actionDisabled" 
        :class="{ 'disabled': actionDisabled }" 
        @click="$emit('action-click')">
        {{ actionButtonText }}
      </button>
    </slot>
  </Collapsible>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Collapsible from './Collapsible.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  explanatoryText: {
    type: String,
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.'
  },
  tokenLabelText: {
    type: String,
    default: 'TOKEN'
  },
  tokenImage: {
    type: String,
    default: ''
  },
  tokenSymbol: {
    type: String,
    required: true
  },
  showStatusIndicator: {
    type: Boolean,
    default: false
  },
  statusText: {
    type: String,
    default: 'MISSING BALANCE'
  },
  actionButtonText: {
    type: String,
    default: 'Transfer Tokens'
  },
  actionDisabled: {
    type: Boolean,
    default: false
  },
  customClass: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['action-click']);
</script>

<style scoped>
.explanatory-text {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  color: rgba(255, 255, 255, 0.6);
}

.mb-8 {
  margin-bottom: 32px;
}

.mb-4 {
  margin-bottom: 16px;
}

.token-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 8px;
  justify-content: space-between;
}

.token-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.token-value {
  display: flex;
  align-items: center;
}

.token-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.token-icon-circle {
  width: 24px;
  height: 24px;
  background-color: #333;
  border-radius: 50%;
}

.token-icon span {
  color: #fff;
  font-weight: 500;
}

.missing-allowance {
  display: inline-flex;
  align-items: center;
  background-color: #FF4D4F;
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  height: fit-content;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #27272A;
  color: white;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  min-width: 180px;
}

.action-btn:hover:not(.disabled) {
  background-color: #3F3F46;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.collapsible) {
  background: #18181B;
  border-radius: 16px;
  padding: 24px;
}
</style> 