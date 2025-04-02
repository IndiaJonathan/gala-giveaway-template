<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <LoginModal v-model:show="showLoginModal" />

      <!-- Profile Menu -->
      <div class="profile-menu-container">
        <template v-if="connectedUserGCAddress">
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <div class="profile-avatar-container" v-bind="props" role="button">
                <v-avatar size="40" class="profile-avatar">
                  <span class="text-h6 font-weight-bold white--text">{{ connectedUserGCAddress.slice(-2) }}</span>
                </v-avatar>
              </div>
            </template>
            <v-list>
              <v-list-item @click="navigateToProfile">
                <v-list-item-title>My Profile</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="handleLogout">
                <v-list-item-title class="text-error">Disconnect Wallet</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        <template v-else>
          <Web3Button :primary-text="$vuetify.display.smAndDown ? 'Login' : 'Connect Wallet'"
            :class="$vuetify.display.smAndDown ? 'mobile-web3-btn' : 'desktop-web3-btn'">
          </Web3Button>
        </template>
      </div>

      <SideNav v-model="drawer" />

      <v-main :class="{ 'desktop-main': !$vuetify.display.smAndDown }">

        <router-view></router-view>
        <SignupModal :title="connectedUserGCAddress"
          :show="!!connectedEthAddress && !connectedUserGCAddress && !isFetchingProfile"></SignupModal>
      </v-main>

      <v-snackbar v-model="toast.visible" :timeout="toast.timeout" :color="toast.isError ? 'error' : 'success'">
        {{ toast.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="toast.visible = false"> Close </v-btn>
        </template>
      </v-snackbar>

      <AlertModal
        v-if="dialogType === 'alert'"
        v-model:show="showDialog"
        :title="dialogConfig?.title || ''"
        :body="dialogConfig?.body || ''"
        :cta-primary="dialogConfig?.ctaPrimary || ''"
        :cta-secondary="dialogConfig?.ctaSecondary"
        @click-primary="handlePrimaryClick"
        @click-secondary="handleSecondaryClick"
      />
    </v-app>
  </v-responsive>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import SignupModal from './modals/SignupModal.vue'
import LoginModal from './modals/LoginModal.vue'
import SideNav from './components/SideNav.vue'
import { useProfileStore } from './stores/profile';
import { storeToRefs } from 'pinia';
import Web3Button from './components/Web3Button.vue';
import { useToast } from './composables/useToast';
import { ref, onMounted, watch } from 'vue';
import { useDisplay } from 'vuetify';
import AlertModal from './modals/AlertModal.vue';
import { useDialog } from './composables/useDialog';

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { showLoginModal, profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

const { toast, showToast } = useToast()
const display = useDisplay();
const router = useRouter();

const drawer = ref(!display.smAndDown.value); // Closed on mobile by default, open on desktop

const { showDialog, dialogConfig, dialogType, handlePrimaryClick, handleSecondaryClick } = useDialog();

const navigateToProfile = () => {
  router.push('/profile');
};

const handleLogout = async () => {
  try {
    await profileStore.logout();
    showToast('Successfully disconnected wallet', false);
    // If user is on a protected route, redirect to home
    const protectedRoutes = ['/create-giveaway', '/created', '/profile', '/won'];
    if (protectedRoutes.includes(router.currentRoute.value.path)) {
      router.push('/');
    }
  } catch (error) {
    showToast('Error disconnecting wallet', true);
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  console.log('router.currentRoute.value.path', router.currentRoute.value.path)
  if (!display.smAndDown.value && !drawer.value) {
    drawer.value = true;
  }
});

watch(() => router.currentRoute.value.path, (newPath) => {
  console.log('newPath:', newPath)
  // Define an array of protected routes that require authentication
  const protectedRoutes = ['/create-giveaway', '/created', '/profile', '/won'];

  // Check if current path is in protected routes and user is not connected
  if (protectedRoutes.includes(newPath) && !connectedEthAddress.value && !connectedUserGCAddress.value) {
    profileStore.setShowLoginModal(true)
  } else {
    profileStore.setShowLoginModal(false)
  }
})

// Watch for disconnection events
watch([connectedEthAddress, connectedUserGCAddress], ([newEthAddress, newGCAddress], [oldEthAddress, oldGCAddress]) => {
  const wasConnected = oldEthAddress || oldGCAddress;
  const isConnected = newEthAddress || newGCAddress;

  // If user was connected but is no longer connected
  if (wasConnected && !isConnected) {
    console.log('User disconnected');

    // Check if current route is protected
    const protectedRoutes = ['/create-giveaway', '/created', '/profile', '/my-entries', '/won'];
    if (protectedRoutes.includes(router.currentRoute.value.path)) {
      profileStore.setShowLoginModal(true);
    }
  }
}, { immediate: false })
</script>

<style scoped>
.connect-wallet-btn {
  background-color: #fff;
  text-transform: none;
  font-weight: 600;
}

.profile-menu-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
}

.profile-avatar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 10px;
  min-width: 40px;
  height: 40px;
  cursor: pointer;
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

/* Mobile logo styling */
.mobile-logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* Desktop main content styling with sidebar */
.desktop-main {
  padding-left: 256px;
  /* Width of the navigation drawer */
}

/* Media queries for responsive design */
@media screen and (max-width: 600px) {
  .v-app-bar {
    padding: 4px 16px !important;
  }

  .v-app-bar-title {
    font-size: 1.2rem;
  }
}


/* Web3Button mobile styling */
.mobile-web3-btn {
  transform: scale(0.9);
  margin-right: -8px;
}

/* Add desktop web3 button styling */
.desktop-web3-btn {
  min-width: 140px;
  margin-right: 16px;
}
</style>
