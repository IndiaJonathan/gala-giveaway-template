<!-- App.vue -->
<template>
  <div id="app">
    <v-app>
      <v-app-bar app color="primary" dark>
        <v-toolbar-title>GalaChain Giveaways</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn to="/">Giveaways</v-btn>
        <v-btn to="/giveaway">Start A Giveaway</v-btn>
        <v-btn to="/profile">Profile</v-btn>
      </v-app-bar>

      <v-main>
        <router-view></router-view>
        <Modal :show="!!connectedEthAddress && !connectedUserGCAddress"></Modal>
      </v-main>

      <v-snackbar v-model="toast.visible" :timeout="toast.timeout" :color="toast.isError ? 'error' : 'success'">
        {{ toast.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="toast.visible = false"> Close </v-btn>
        </template>
      </v-snackbar>
    </v-app>
  </div>
</template>

<script lang="ts" setup>
import { useToast } from '@/composables/useToast'
import Modal from './modals/modal.vue';
import { useProfileStore } from './stores/profile';
import { storeToRefs } from 'pinia';

const { toast, showToast } = useToast()
const profileStore = useProfileStore()
const { connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)
</script>
