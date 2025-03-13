<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <LoginModal v-model:show="showLoginModal" />

      <v-app-bar app flat sticky :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-8'" height="96px"
        :style="$vuetify.display.smAndDown ? 'background: transparent;' : 'background-color: inherit;'">
        <!-- Show hamburger menu on small screens -->
        <v-app-bar-nav-icon v-if="$vuetify.display.smAndDown" @click="drawer = !drawer"
          color="white"></v-app-bar-nav-icon>

        <div :class="['d-flex align-center', $vuetify.display.smAndDown ? 'mobile-logo' : '']">
          <v-icon icon="mdi-gift-outline" size="x-large" color="white" class="me-2"></v-icon>
          <span class="text-h6 font-weight-bold white--text">GALACHAIN GIVEAWAYS</span>
        </div>

        <v-spacer></v-spacer>

        <template v-if="connectedUserGCAddress">
          <div class="profile-avatar-container" @click.prevent="navigateToProfile" role="button">
            <v-avatar size="40" class="profile-avatar">
              <span class="text-h6 font-weight-bold white--text">{{ connectedUserGCAddress.slice(-2) }}</span>
            </v-avatar>
          </div>
        </template>
        <template v-else>
          <Web3Button :primary-text="$vuetify.display.smAndDown ? 'Login' : 'Connect Wallet'"
            :class="$vuetify.display.smAndDown ? 'mobile-web3-btn' : 'desktop-web3-btn'">
          </Web3Button>
        </template>
      </v-app-bar>


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

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { showLoginModal, profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

const { toast } = useToast()
const display = useDisplay();
const router = useRouter();

const drawer = ref(!display.smAndDown.value); // Closed on mobile by default, open on desktop

const navigateToProfile = () => {
  router.push('/profile');
};

onMounted(() => {
  console.log('router.currentRoute.value.path', router.currentRoute.value.path)
  if (!display.smAndDown.value && !drawer.value) {
    drawer.value = true;
  }
});

watch(() => router.currentRoute.value.path, (newPath) => {
  console.log('newPath:', newPath)
  if (newPath === '/create-giveaway' && !connectedEthAddress.value && !connectedUserGCAddress.value) {
    profileStore.setShowLoginModal(true)
  } else {
    profileStore.setShowLoginModal(false)
  }
})
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
