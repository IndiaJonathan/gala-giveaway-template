<template>
  <div class="login-modal-overlay" v-if="show">
    <div class="login-modal">
      
      <!-- Header with logo -->
      <div class="modal-header">
        <div class="logo-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16.0001V8.00006C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27006L13 2.27006C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27006L4 6.27006C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00006V16.0001C3.00036 16.3508 3.09294 16.6953 3.26846 16.9989C3.44398 17.3026 3.69626 17.5547 4 17.7301L11 21.7301C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.7301L20 17.7301C20.3037 17.5547 20.556 17.3026 20.7315 16.9989C20.9071 16.6953 20.9996 16.3508 21 16.0001Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">GALACHAIN GIVEAWAYS</span>
        </div>
      </div>
      
      <!-- Modal content -->
      <div class="modal-content">
        <h1>Login</h1>
        <p>You must have a Gala wallet to create a giveaway.<br>Please connect a web3 wallet to continue</p>
        
        <Web3Button primary-text="Web3 Login" connect-wallet-text="Web3 Login" :onClick="handleLogin"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from '@/stores/profile';
import Web3Button from '@/components/Web3Button.vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
    default: false
  }
});

const emit = defineEmits(['update:show', 'close']);

const profileStore = useProfileStore();

const close = () => {
  emit('update:show', false);
  emit('close');
};

const handleLogin = async () => {
  // Handle web3 login logic here
  await profileStore.connect();
  // Close modal on successful login
  close();
};

const handleExistingAccount = () => {
  // Handle existing account logic here
  console.log('User has an existing account');
};
</script>

<style scoped>
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  background: linear-gradient(135deg, #922b3e, #5d3d92);
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 10;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header {
  padding: 16px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-weight: 600;
  color: white;
  font-size: 16px;
}

.modal-content {
  padding: 20px 40px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 32px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
  text-align: center;
}

p {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.6;
}

.account-link {
  margin-top: 24px;
}

.account-link a {
  color: white;
  text-decoration: underline;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.account-link a:hover {
  opacity: 1;
}

</style> 