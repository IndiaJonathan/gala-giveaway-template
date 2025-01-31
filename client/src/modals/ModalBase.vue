<template>
  <v-dialog :model-value="show" max-width="500" persistent>
    <v-card class="pa-5" outlined>
      <v-btn icon class="modal-close" @click="close" style="position: absolute; top: 10px; right: 10px;">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <slot name="actions"></slot>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Modal Title',
  },
  allowClose: {
    type: Boolean,
    required: false,
    default: true
  }
});

const emit = defineEmits(['close', 'update:show']);

const close = () => {
  emit('update:show', false);
  emit('close');
};

const onUpdateShow = (value: boolean) => {
  emit('update:show', value);
};
</script>
