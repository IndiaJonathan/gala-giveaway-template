<template>
  <v-container class="available-giveaways-container px-4 py-6" max-width="1280px">
    <div class="text-center mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">Available Giveaways</h1>
      <p class="text-subtitle-1 text-grey">Discover and claim exciting rewards</p>
    </div>

    <v-progress-circular 
      v-if="loading" 
      indeterminate 
      color="primary" 
      size="64" 
      class="mx-auto my-12 d-block"
    ></v-progress-circular>

    <template v-else>
      <div class="tabs-container mb-6">
        <v-tabs
          v-model="giveawaysTab"
          background-color="transparent"
          color="white"
          align-tabs="center"
          class="giveaway-tabs"
        >
          <v-tab value="active" class="giveaway-tab px-6">
            <v-icon start>mdi-gift</v-icon>
            Active
            <v-badge 
              color="primary" 
              :content="activeGiveaways.length.toString()" 
              offset-x="10" 
              offset-y="-8"
              v-if="activeGiveaways.length > 0"
            ></v-badge>
          </v-tab>
          <v-tab value="past" class="giveaway-tab px-6">
            <v-icon start>mdi-history</v-icon>
            Past
          </v-tab>
        </v-tabs>
      </div>

      <v-fade-transition mode="out-in">
        <Giveaways 
          v-if="giveawaysTab === 'active'" 
          :giveaways="activeGiveaways" 
          key="active"
        ></Giveaways>
        <Giveaways 
          v-else 
          :giveaways="completedGiveaways" 
          key="past"
        ></Giveaways>
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
    console.log('hit')
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
</script>

<style scoped>
.available-giveaways-container {
  min-height: 80vh;
}

.tabs-container {
  max-width: 480px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background-color: rgba(30, 30, 30, 0.5);
}

.giveaway-tabs {
  border-radius: 12px;
}

.giveaway-tab {
  font-weight: 500;
  letter-spacing: 0.5px;
  height: 52px;
}

.tab-selected {
  color: #fff;
  font-weight: 600;
}
</style>
