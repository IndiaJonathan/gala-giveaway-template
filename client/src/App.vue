<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <v-app-bar app flat sticky style="background-color: inherit" class="pa-8" height="96px">
        <v-app-bar-title>GalaChain GiveAways</v-app-bar-title>

        <v-spacer></v-spacer>

        <Web3Button primary-text="Connect Wallet"></Web3Button>
      </v-app-bar>

      <SideNav />

      <v-main style="margin-top: 108px">
        <router-view></router-view>
        <SignupModal
          :title="connectedUserGCAddress"
          :show="!!connectedEthAddress && !connectedUserGCAddress && !isFetchingProfile"
        ></SignupModal>
      </v-main>

      <!-- <v-snackbar
        v-model="toast.visible"
        :timeout="toast.timeout"
        :color="toast.isError ? 'error' : 'success'"
      >
        {{ toast.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="toast.visible = false"> Close </v-btn>
        </template>
      </v-snackbar> -->
    </v-app>
  </v-responsive>
</template>

<script lang="ts" setup>
import SignupModal from './modals/SignupModal.vue'
import SideNav from './components/SideNav.vue'
import { useProfileStore } from './stores/profile';
import { storeToRefs } from 'pinia';
import Web3Button from './components/Web3Button.vue';

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

</script>

<style scoped>
.connect-wallet-btn {
  background-color: #fff;
  text-transform: none;
  font-weight: 600;
}
</style>
