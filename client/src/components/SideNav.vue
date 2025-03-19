<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    floating
    sticky
    :temporary="$vuetify.display.smAndDown"
    :permanent="!$vuetify.display.smAndDown"
    style="background-color: #121212; z-index: 1200;"
    :style="$vuetify.display.smAndDown ? 'height: 100vh; top: 0;' : 'height: 100vh; top: 0; position: fixed;'"
    :overlay="$vuetify.display.smAndDown"
    :close-on-content-click="$vuetify.display.smAndDown"
    app
  >    
    <!-- Logo section for both mobile and desktop -->
    <div class="d-flex align-center pa-4">
      <v-icon icon="mdi-gift-outline" size="large" color="white" class="me-2"></v-icon>
      <span class="text-h6 font-weight-bold white--text">GALACHAIN GIVEAWAYS</span>
    </div>

    <v-list nav class="mt-2" :selected="[currentRoute]">
      <v-list-item 
        prepend-icon="mdi-home" 
        title="Home" 
        value="/"
        to="/" 
        active-class="nav-item-active"
        class="white--text" 
        @click="closeOnMobile"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-plus-circle"
        title="Create Giveaway"
        value="/create-giveaway"
        to="/create-giveaway"
        active-class="nav-item-active"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
      <!-- <v-list-item
        prepend-icon="mdi-help-circle-outline"
        title="About"
        value="about"
        to="/about"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item> -->

      <v-divider class="my-2"></v-divider>

      <v-list-item
        prepend-icon="mdi-gift-outline"
        title="Won"
        value="/won"
        to="/won"
        active-class="nav-item-active"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-upload"
        title="Created"
        value="/created"
        to="/created"
        active-class="nav-item-active"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
    </v-list>

    <!-- Logout option at the bottom of the drawer -->
    <template v-slot:append>
      <v-list nav class="mb-2">
        <v-list-item
          v-if="isUserConnected"
          prepend-icon="mdi-logout"
          title="Disconnect Wallet"
          value="logout"
          class="mb-2 white--text"
          @click="handleLogout"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import { useToast } from '@/composables/useToast';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue']);
const display = useDisplay();
const profileStore = useProfileStore();
const { connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore);
const { showToast } = useToast();
const router = useRouter();
const route = useRoute();

// Get current route path for navigation highlighting
const currentRoute = computed(() => route.path);

// Computed property to check if user is connected
const isUserConnected = computed(() => {
  return !!connectedEthAddress.value || !!connectedUserGCAddress.value;
});

const closeOnMobile = () => {
  if (display.smAndDown.value) {
    emit('update:modelValue', false);
  }
};

const handleLogout = async () => {
  try {
    await profileStore.logout();
    showToast('Successfully disconnected wallet', false);
    closeOnMobile();
    
    // If user is on a protected route, redirect to home
    const protectedRoutes = ['/create-giveaway', '/created', '/profile', '/my-entries'];
    if (protectedRoutes.includes(router.currentRoute.value.path)) {
      router.push('/');
    }
  } catch (error) {
    showToast('Error disconnecting wallet', true);
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>
.dollar-sign {
  z-index: 1;
  font-weight: bold;
}

.nav-item-active {
  background-color: rgba(255, 255, 255, 0.12);
}

/* Override any default active classes to ensure only one item is active */
:deep(.v-list-item--active:not(.v-list-item--selected)) {
  background: transparent !important;
  color: inherit !important;
}
</style>
