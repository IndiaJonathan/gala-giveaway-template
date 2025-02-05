<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <v-app-bar app flat sticky style="background-color: inherit" class="pa-8" height="96px">
        <img :src="GalaGiveawayPNG" height="32" />

        <v-spacer></v-spacer>

        <v-btn
          class="connect-wallet-btn"
          rounded="pill"
          width="152px"
          height="44px"
          color="#000"
          flat
          >Connect Wallet</v-btn
        >
      </v-app-bar>

      <SideNav />

      <v-main style="margin-top: 108px">
        <router-view></router-view>
        <!-- <SignupModal
          :title="connectedUserGCAddress"
          :show="!!connectedEthAddress && !connectedUserGCAddress && !isFetchingProfile"
        ></SignupModal> -->
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
import GalaGiveawayPNG from '@/assets/images/gala-giveaway.png'
</script>

<style scoped>
.connect-wallet-btn {
  background-color: #fff;
  text-transform: none;
  font-weight: 600;
}
</style>
