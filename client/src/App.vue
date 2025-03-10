<!-- App.vue -->
<template>
  <v-responsive>
    <v-app>
      <v-app-bar app flat sticky :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-8'" height="96px"
        :style="$vuetify.display.smAndDown ? 'background: transparent;' : 'background-color: inherit; margin-left: 256px;'">
        <!-- Show hamburger menu on small screens -->
        <v-app-bar-nav-icon v-if="$vuetify.display.smAndDown" @click="drawer = !drawer"
          color="white"></v-app-bar-nav-icon>



        <div v-if="$vuetify.display.smAndDown" class="d-flex align-center justify-center mobile-logo">
          <v-icon icon="mdi-cube-outline" size="x-large" color="white" class="me-2"></v-icon>
          <span class="text-h6 font-weight-bold white--text">GALA GIVEAWAY</span>
        </div>

        <v-spacer></v-spacer>

        <template v-if="connectedUserGCAddress">
          <div class="profile-avatar-container">
            <v-avatar size="40" class="profile-avatar">
              <span class="text-h6 font-weight-bold white--text">{{ connectedUserGCAddress.slice(-2) }}</span>
            </v-avatar>
          </div>
        </template>
        <template v-else>
          <Web3Button :primary-text="$vuetify.display.smAndDown ? 'Login' : 'Connect Wallet'" 
                      :class="$vuetify.display.smAndDown ? 'mobile-web3-btn' : ''"></Web3Button>
        </template>
      </v-app-bar>


      <SideNav v-model="drawer" />

      <v-main :class="{ 'desktop-main': !$vuetify.display.smAndDown }">
        <!-- Show hero on both mobile and desktop -->
        <div class="hero-container" :class="{ 'mobile-hero-container': $vuetify.display.smAndDown, 'desktop-hero-container': !$vuetify.display.smAndDown }">
          <div class="hero-content" :class="{ 'desktop-hero-content': !$vuetify.display.smAndDown }">
            <h1 class="hero-title" :class="{ 'desktop-hero-title': !$vuetify.display.smAndDown }">The Web3 way to giveaway</h1>
            <p class="hero-subtitle">Grab free gifts, before they are gone</p>
          </div>
        </div>

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
import SignupModal from './modals/SignupModal.vue'
import SideNav from './components/SideNav.vue'
import { useProfileStore } from './stores/profile';
import { storeToRefs } from 'pinia';
import Web3Button from './components/Web3Button.vue';
import { useToast } from './composables/useToast';
import { ref, onMounted } from 'vue';
import { useDisplay } from 'vuetify';

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

const { toast } = useToast()
const display = useDisplay();

const drawer = ref(!display.smAndDown.value); // Closed on mobile by default, open on desktop

onMounted(() => {
  if (!display.smAndDown.value && !drawer.value) {
    drawer.value = true;
  }
});
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

/* Mobile hero styling */
.mobile-hero-container {
  position: relative;
  width: 100%;
  height: 308px;
  z-index: 1;
  margin-top: 0; /* Reset any negative margins */
  background: radial-gradient(60% 70% at 92% 95%, rgba(18, 18, 18, 0.65) 0%, rgba(18, 18, 18, 0.2) 100%),
              linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 0.7) 98%),
              linear-gradient(245.92deg, rgba(18, 18, 18, 0) 25%, rgba(18, 18, 18, 0.6) 87.84%),
              linear-gradient(155deg, #FF5722 0%, #FF8A00 30%, #FF7043 40%, #7E3FD1 70%, #B83FCF 100%);
}

/* Desktop hero styling */
.desktop-hero-container {
  position: relative;
  width: 100%;
  height: 400px;
  z-index: 1;
  background: radial-gradient(60% 70% at 92% 95%, rgba(18, 18, 18, 0.65) 0%, rgba(18, 18, 18, 0.2) 100%),
              linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 0.7) 98%),
              linear-gradient(245.92deg, rgba(18, 18, 18, 0) 25%, rgba(18, 18, 18, 0.6) 87.84%),
              linear-gradient(155deg, #FF5722 0%, #FF8A00 30%, #FF7043 40%, #7E3FD1 70%, #B83FCF 100%);
}

.hero-content {
  position: absolute;
  left: 24px;
  top: 100px;
  width: 314px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 2;
}

.desktop-hero-content {
  left: 64px;
  top: 150px;
  width: 500px;
}

.hero-title {
  font-family: 'Figtree', sans-serif;
  font-weight: 600;
  font-size: 40px;
  line-height: 115%;
  color: #FFFFFF;
  margin: 0;
}

.desktop-hero-title {
  font-size: 64px;
}

.hero-subtitle {
  font-family: 'Figtree', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 145%;
  color: #9E9E9E;
  margin: 0;
}

/* Web3Button mobile styling */
.mobile-web3-btn {
  transform: scale(0.9);
  margin-right: -8px;
}
</style>
