<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <v-app-bar app flat sticky style="background-color: inherit" class="pa-8" height="96px">
        <v-app-bar-title>GalaChain GiveAways</v-app-bar-title>

        <v-spacer></v-spacer>

        <template v-if="connectedUserGCAddress">
          <div class="profile-avatar-container">
            <v-avatar size="40" class="profile-avatar">
              <span class="text-h6 font-weight-bold white--text">{{ connectedUserGCAddress.slice(-2) }}</span>
            </v-avatar>
          </div>
        </template>
        <template v-else>
          <Web3Button primary-text="Connect Wallet"></Web3Button>
        </template>
      </v-app-bar>

      <SideNav />

      <v-main style="margin-top: 108px">
        <router-view></router-view>
        <SignupModal
          :title="connectedUserGCAddress"
          :show="!!connectedEthAddress && !connectedUserGCAddress && !isFetchingProfile"
        ></SignupModal>
      </v-main>

      <v-snackbar
        v-model="toast.visible"
        :timeout="toast.timeout"
        :color="toast.isError ? 'error' : 'success'"
      >
        {{ toast.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="toast.visible = false"> Close </v-btn>
        </template>
      </v-snackbar>
    </v-app>
  </v-responsive>
</template>

<script lang="ts" setup>
import SignupModal from './modals/SignupModal.vue'
import SideNav from './components/SideNav.vue'
import { useProfileStore } from './stores/profile';
import { storeToRefs } from 'pinia';
import Web3Button from './components/Web3Button.vue';
import { useToast } from './composables/useToast';

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

const { toast } = useToast()
</script>

<style scoped>
.connect-wallet-btn {
  background-color: #fff;
  text-transform: none;
  font-weight: 600;
}

.profile-avatar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 10px;
  width: 40px;
  height: 40px;
  flex: none;
  order: 2;
  flex-grow: 0;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border: 1.5px solid #868686;
  background-color: #5E42CC;
  flex: none;
  order: 0;
  flex-grow: 0;
}
</style>
