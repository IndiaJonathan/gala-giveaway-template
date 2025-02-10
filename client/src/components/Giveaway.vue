<template>
  <v-card class="mx-auto my-4" max-width="256px" style="background-color: inherit">
    <v-img :src="giveaway.image || MysteryBoxPNG">
      <v-row v-if="isUpcoming" class="image-overlay ma-0">
        <v-col cols="12" align-self="center" class="text-center">
          <h5>Available in</h5>
          <h2 class="px-4 py-3 mx-auto mt-2 border-md rounded-lg d-inline-block">
            {{ availableIn }}
          </h2>
        </v-col>
      </v-row>
    </v-img>
    <v-row>
      <v-col :cols="hasAction ? 12 : 8">
        <v-card-title>{{ tokenToReadable(giveaway.giveawayToken) }}</v-card-title>
        <v-card-subtitle>Remaining: {{ giveaway.claimsLeft || 0 }}</v-card-subtitle>
      </v-col>
      <v-col v-if="!hasAction" cols="4" align-self="center">
        <v-btn class="card-button" rounded="pill" variant="flat" :disabled="isUpcoming">{{
          hasClaimed ? 'View' : 'Claim'
        }}</v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts" setup>
import { type PropType, computed } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import MysteryBoxPNG from '@/assets/mystery-box.png'
import { tokenToReadable } from '@/utils/GalaHelper'

const { giveaway } = defineProps({
  giveaway: {
    type: Object as PropType<Giveaway>,
    required: true
  }
})

const hasClaimed = giveaway.isWinner === true

const startTime = new Date(giveaway.startDateTime)
const isUpcoming = startTime > new Date()

const availableIn = computed(() => {
  if (!isUpcoming) {
    return ''
  }

  const now = new Date()

  const secondsRemaining = Math.floor((startTime.getTime() - now.getTime()) / 1000)

  // less than 1 minute
  if (secondsRemaining < 60) {
    return `${secondsRemaining}s`
    // less than 1 hour
  } else if (secondsRemaining < 3600) {
    const minutesRemaining = Math.round(secondsRemaining / 60)

    return `${minutesRemaining}m`
    // more than 1 hour
  } else {
    const minutesTotalRemaining = Math.round(secondsRemaining / 60)
    const hoursRemaining = Math.floor(minutesTotalRemaining / 60)
    const minutesRemaining = minutesTotalRemaining % 60

    return `${hoursRemaining}h ${minutesRemaining}m`
  }
})

const hasAction = (giveaway.claimsLeft || 0) <= 0 || hasClaimed
</script>

<style scoped>
.card-button {
  background-color: #fff;
  color: #0a0a0a;
  text-transform: none;
}

.image-overlay {
  height: 100%;
  width: 100%;
  background-color: #0a0a0a;
  opacity: 0.85;
}
</style>
