<!-- AlertModal.vue -->
<template>
  <ModalBase :show="show" :title="title" @update:show="$emit('update:show', $event)">
    <div class="alert-body">
      {{ body }}
    </div>
    <template v-slot:actions>
      <v-card-actions class="d-flex justify-end gap-3">
        <v-btn
          v-if="ctaSecondary"
          variant="outlined"
          @click="handleSecondaryClick"
        >
          {{ ctaSecondary }}
        </v-btn>
        <v-btn
          color="primary"
          @click="handlePrimaryClick"
        >
          {{ ctaPrimary }}
        </v-btn>
      </v-card-actions>
    </template>
  </ModalBase>
</template>

<script lang="ts" setup>
import ModalBase from './ModalBase.vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  ctaPrimary: {
    type: String,
    required: true,
  },
  ctaSecondary: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:show', 'clickPrimary', 'clickSecondary']);

const handlePrimaryClick = () => {
  emit('clickPrimary');
  emit('update:show', false);
};

const handleSecondaryClick = () => {
  emit('clickSecondary');
  emit('update:show', false);
};
</script>

<style scoped>
.alert-body {
  margin-bottom: 16px;
  white-space: pre-line;
  line-height: 1.5;
}
</style> 