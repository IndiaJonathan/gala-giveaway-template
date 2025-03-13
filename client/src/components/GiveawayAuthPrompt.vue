<template>
  <div class="auth-prompt-container">
    <div class="auth-content">
      <!-- Header with logo -->
      <div class="modal-header">
        <div class="logo-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16.0001V8.00006C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27006L13 2.27006C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27006L4 6.27006C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00006V16.0001C3.00036 16.3508 3.09294 16.6953 3.26846 16.9989C3.44398 17.3026 3.69626 17.5547 4 17.7301L11 21.7301C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.7301L20 17.7301C20.3037 17.5547 20.556 17.3026 20.7315 16.9989C20.9071 16.6953 20.9996 16.3508 21 16.0001Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">GALACHIAN GIVEAWAYS</span>
        </div>
      </div>
      
      <!-- Auth content -->
      <div class="modal-content">
        <h1>Start A Giveaway</h1>
        <p>You must have a Gala wallet to create a giveaway.<br>Please connect a web3 wallet to continue</p>
        
        <div class="wallet-status" v-if="connectedEthAddress || connectedUserGCAddress">
          <div class="status-item" v-if="connectedEthAddress">
            <span class="status-label">ETH Address:</span>
            <span class="status-value">{{ formatAddress(connectedEthAddress) }}</span>
          </div>
          <div class="status-item" v-if="connectedUserGCAddress">
            <span class="status-label">GC Address:</span>
            <span class="status-value">{{ formatAddress(connectedUserGCAddress) }}</span>
          </div>
        </div>
        
        <div class="auth-actions">
          <Web3Button 
            primary-text="Web3 Login" 
            :onClick="profileStore.connect"
            class="auth-button"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'
import Web3Button from '@/components/Web3Button.vue'

const profileStore = useProfileStore()
const { connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)

// Helper function to format addresses for display
const formatAddress = (address: string | null): string => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
</script>

<style scoped>
.auth-prompt-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-content {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  background: linear-gradient(135deg, #922b3e, #5d3d92);
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
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

.wallet-status {
  width: 100%;
  margin: 16px 0 24px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  text-align: left;
}

.status-item {
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
}

.status-label {
  color: rgba(255, 255, 255, 0.6);
}

.status-value {
  color: white;
  font-family: monospace;
  font-weight: 600;
}

.auth-actions {
  margin-top: 16px;
}

.auth-button {
  width: 180px;
}
</style> 