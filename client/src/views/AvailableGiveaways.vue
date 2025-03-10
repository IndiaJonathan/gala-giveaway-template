<template>
  <v-container class="available-giveaways-container pa-0" fluid>

    <div class="hero-container"
      :class="{ 'mobile-hero-container': $vuetify.display.smAndDown, 'desktop-hero-container': !$vuetify.display.smAndDown }">
      <div class="hero-content" :class="{ 'desktop-hero-content': !$vuetify.display.smAndDown }">
        <h1 class="hero-title" :class="{ 'desktop-hero-title': !$vuetify.display.smAndDown }">The Web3 way to giveaway
        </h1>
        <p class="hero-subtitle">Grab free gifts, before they are gone</p>
      </div>
    </div>

    <v-progress-circular v-if="loading" indeterminate color="primary" size="64"
      class="mx-auto my-12 d-block"></v-progress-circular>

    <template v-else>
      <v-item-group mandatory v-model="giveawaysTab" selected-class="tab-selected" style="color: #7a7a7a;">
        <v-item v-slot="{ toggle, selectedClass }" value="active">
          <h2 :class="['d-inline mr-6 cursor-pointer', selectedClass]" @click="toggle">
            Active
          </h2>
        </v-item>
        <v-item v-slot="{ toggle, selectedClass }" value="past">
          <h2 :class="['d-inline cursor-pointer', selectedClass]" @click="toggle">Past</h2>
        </v-item>
      </v-item-group>

      <v-fade-transition mode="out-in">
        <Giveaways v-if="giveawaysTab === 'active'" :giveaways="activeGiveaways" key="active"
          @signup-success="handleSignupSuccess"></Giveaways>
        <Giveaways v-else :giveaways="completedGiveaways" key="past" @signup-success="handleSignupSuccess"></Giveaways>
      </v-fade-transition>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
import { getGiveaways } from '@/services/BackendApi'
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from '../composables/useToast'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import Giveaways from '@/components/Giveaways.vue'
import { type Giveaway } from '@/types/giveaway'

const { showToast } = useToast()
const giveaways = ref<Giveaway[]>([])
const loading = ref(true)

const profileStore = useProfileStore()
const { connectedUserGCAddress } = storeToRefs(profileStore)

const giveawaysTab = ref<'active' | 'past'>('active')

const fetchGiveaways = async () => {
  try {
    loading.value = true
    console.log('Fetching giveaways...')
    giveaways.value = await getGiveaways(connectedUserGCAddress.value)
  } catch (e) {
    showToast((e as any).message || JSON.stringify(e), true)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGiveaways()
})

const activeGiveaways = computed(() => {
  let isActive = true
  return giveaways.value.filter((giveaway) => {
    if (giveaway.endDateTime) {
      isActive = new Date(giveaway.endDateTime) > new Date()
    }
    if (giveaway.claimsLeft != undefined) {
      isActive = isActive && giveaway.claimsLeft > 0
    }
    // If no endDateTime is provided, consider it active
    return isActive
  })
})

const completedGiveaways = computed(() => {
  return giveaways.value.filter((giveaway) => {
    if (giveaway.endDateTime) {
      return new Date(giveaway.endDateTime) <= new Date()
    }
    // If no endDateTime is provided, consider it active
    return false
  })
})

watch(connectedUserGCAddress, () => {
  fetchGiveaways()
})

// Handler for signup success events
const handleSignupSuccess = () => {
  console.log('Signup successful, reloading giveaways')
  fetchGiveaways()
}
</script>

<style scoped>
.available-giveaways-container {
  min-height: 80vh;
}

.hero-container {
  width: 100%;
  margin: 0;
  padding: 2rem;
}

.cursor-pointer {
  cursor: pointer;
  font-size: 32px;
}

.tab-selected {
  color: #fff;
  font-weight: 600;
}

/* Mobile hero styling */
.mobile-hero-container {
  position: relative;
  width: 100%;
  height: 308px;
  z-index: 1;
  margin-top: 0;
  /* Reset any negative margins */
  background: radial-gradient(60% 70% at 92% 95%, rgba(18, 18, 18, 0.65) 0%, rgba(18, 18, 18, 0.2) 100%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 1) 98%),
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
    linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 1) 98%),
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
</style>
