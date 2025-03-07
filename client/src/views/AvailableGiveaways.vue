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
      <v-item-group
        mandatory
        v-model="giveawaysTab"
        selected-class="tab-selected"
        style="color: #7a7a7a"
        class="tabs-row mb-6"
      >
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
        <Giveaways 
          v-if="giveawaysTab === 'active'" 
          :giveaways="activeGiveaways" 
          key="active"
          @signup-success="handleSignupSuccess"
        ></Giveaways>
        <Giveaways 
          v-else 
          :giveaways="completedGiveaways" 
          key="past"
          @signup-success="handleSignupSuccess"
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

.tabs-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-left: 16px;
}

.cursor-pointer {
  cursor: pointer;
  font-size: 32px;
}

.tab-selected {
  color: #fff;
  font-weight: 600;
}
</style>
