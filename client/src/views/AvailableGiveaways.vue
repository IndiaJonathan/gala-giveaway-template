<template>
  <v-container>
    <v-progress-circular indeterminate v-if="loading"></v-progress-circular>

    <v-item-group
      v-else
      mandatory
      v-model="giveawaysTab"
      selected-class="tab-selected"
      style="color: #7a7a7a"
    >
      <v-item v-slot="{ toggle, selectedClass }" value="active">
        <h2 :class="['d-inline mr-6 cursor-pointer', selectedClass]" @click="toggle">Active</h2>
      </v-item>
      <v-item v-slot="{ toggle, selectedClass }" value="past">
        <h2 :class="['d-inline cursor-pointer', selectedClass]" @click="toggle">Past</h2>
      </v-item>
    </v-item-group>
  </v-container>

  <Giveaways v-if="giveawaysTab === 'active'" :giveaways="activeGiveaways"></Giveaways>
  <Giveaways v-if="giveawaysTab === 'past'" :giveaways="completedGiveaways"></Giveaways>
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
.tab-selected {
  color: #fff;
}
</style>
