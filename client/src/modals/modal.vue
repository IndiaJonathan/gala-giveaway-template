<template>
    <div v-if="show" class="modal-overlay" @click="closeOnOverlayClick">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="close">×</button>
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, type PropType } from 'vue';
  
  export default defineComponent({
    name: 'Modal',
    props: {
      show: {
        type: Boolean as PropType<boolean>,
        required: true,
      },
      closeOnOverlay: {
        type: Boolean as PropType<boolean>,
        default: true,
      },
    },
    emits: ['close'],
    setup(props, { emit }) {
      const close = () => {
        emit('close');
      };
  
      const closeOnOverlayClick = () => {
        if (props.closeOnOverlay) {
          close();
        }
      };
  
      return {
        close,
        closeOnOverlayClick,
      };
    },
  });
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  }
  </style>
  