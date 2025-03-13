<template>
  <div class="demo-container">
    <h1>Login Modal Demo</h1>
    <v-btn color="primary" @click="showLoginModal = true">Open Login Modal</v-btn>
    
    <!-- Login Modal Component -->
    <LoginModal v-model:show="showLoginModal" @close="handleModalClose" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginModal from '@/modals/LoginModal.vue';

const showLoginModal = ref(false);

const handleModalClose = () => {
  console.log('Login modal was closed');
};
</script>

<style scoped>
.demo-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style> 