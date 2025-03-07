<template>
  <v-card class="giveaway-card" rounded="xl">
    <!-- Main image container -->
    <div class="position-relative">
      <v-img 
        :src="giveaway.image || GiveawayPlaceholderJPG" 
        height="358px"
        cover
        class="giveaway-image"
      >
        <!-- Available in overlay -->
        <div v-if="isUpcoming" class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-subtitle-1 text-center mb-2">Available in</div>
          <div class="countdown-timer">
            {{ availableIn }}
          </div>
        </div>
        
        <!-- All gone overlay -->
        <div v-else-if="(giveaway.claimsLeft || 0) <= 0 && !hasClaimed && !isDistributedGiveaway" 
             class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 2rem;">🙅‍♂️</span>
          </div>
          <div class="text-h6 text-center">It's all gone!</div>
        </div>
        
        <!-- Claimed overlay -->
        <div v-else-if="hasClaimed" class="available-overlay d-flex align-center justify-center">
          <div class="claimed-container pa-3">
            <div class="d-flex align-center">
              <span>You've claimed it</span>
              <v-icon color="success" class="ml-2">mdi-check-circle</v-icon>
            </div>
          </div>
        </div>
      </v-img>
    </div>
    
    <!-- Card footer with information and claim button -->
    <div class="giveaway-footer">
      <div class="title-container">
        <div class="giveaway-title">
          {{ isToken ? `${getTokenAmount()} ${getTokenSymbol()} prize` : (giveaway.giveawayToken?.collection || 'Mystery Box') }}
        </div>
      </div>
      
      <!-- Different button for different states -->
      <div class="button-container">
        <v-btn 
          v-if="!isUpcoming && (!hasClaimed || isDistributedGiveaway)" 
          class="claim-button" 
          rounded="pill" 
          variant="flat"
          :disabled="buttonDisabled"
        >
          <template v-if="hasClaimed">
            View
          </template>
          <template v-else-if="isDistributedGiveaway">
            {{ hasSignedUp ? 'Signed up' : 'Sign up' }}
          </template>
          <template v-else>
            Claim
          </template>
        </v-btn>
        
        <v-btn 
          v-else-if="hasClaimed"
          class="view-button" 
          rounded="pill" 
          variant="flat"
        >
          View
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { type PropType, computed } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import GiveawayPlaceholderJPG from '@/assets/giveaway-placeholder.jpg'
import { tokenToReadable } from '@/utils/GalaHelper'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'

const { giveaway } = defineProps({
  giveaway: {
    type: Object as PropType<Giveaway>,
    required: true
  }
})

const profileStore = useProfileStore()
const { connectedUserGCAddress } = storeToRefs(profileStore)

const hasClaimed = giveaway.isWinner === true

const startTime = new Date(giveaway.startDateTime)
const isUpcoming = startTime > new Date()

// Check if the giveaway is of type DistributedGiveaway
const isDistributedGiveaway = computed(() => {
  return giveaway.giveawayType === 'DistributedGiveaway'
})

// Check if the giveaway is a token/currency
const isToken = computed(() => {
  return giveaway.giveawayToken?.collection === 'GALA' || 
         giveaway.giveawayToken?.type === 'FT' ||
         giveaway.giveawayToken?.category === 'Currency'
})

// Get token symbol
const getTokenSymbol = () => {
  if (giveaway.giveawayToken?.collection === 'GALA') {
    return '$GALA'
  }
  return giveaway.giveawayToken?.collection || ''
}

// Get token amount
const getTokenAmount = () => {
  return giveaway.tokenQuantity || '0'
}

// Check if the user has already signed up for a distributed giveaway
const hasSignedUp = computed(() => {
  if (!isDistributedGiveaway.value || !giveaway.usersSignedUp || !connectedUserGCAddress.value) {
    return false
  }
  return giveaway.usersSignedUp.includes(connectedUserGCAddress.value)
})

// Determine if the button should be disabled based on giveaway type and status
const buttonDisabled = computed(() => {
  if (isUpcoming) {
    return true
  }
  
  if (isDistributedGiveaway.value) {
    return hasSignedUp.value
  } else {
    // FirstComeFirstServe type
    return (giveaway.claimsLeft || 0) <= 0 || hasClaimed
  }
})

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
</script>

<style scoped>
.giveaway-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 0px 16px;
  gap: 16px;
  width: 358px;
  height: 438px;
  background: #181818;
  border: 1px solid #FFFFFF;
  box-shadow: 0px 14px 25px #000000;
  border-radius: 16px;
  margin: 16px auto;
  overflow: visible;
}

.giveaway-image {
  width: 358px;
  height: 358px;
  border-radius: 16px;
  align-self: stretch;
}

.position-relative {
  position: relative;
}

.giveaway-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  width: 358px;
  height: 48px;
  align-self: stretch;
  overflow: visible;
}

.title-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
  height: 48px;
  flex-grow: 1;
  max-width: 65%;
}

.button-container {
  display: flex;
  min-width: 110px;
  overflow: visible;
}

.giveaway-title {
  font-family: 'Figtree', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 145%;
  color: #FFFFFF;
  text-shadow: 0px 1px 0px #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.available-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

.countdown-timer {
  background: linear-gradient(to right, #ff5757, #ff9966);
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  min-width: 100px;
  text-align: center;
}

.claimed-container {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
}

.claim-button, .view-button {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  min-width: 110px;
  width: auto;
  height: 34px;
  background: #FFFFFF;
  border-radius: 100px;
  font-family: 'Figtree', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 100%;
  text-align: center;
  color: #0A0A0A;
  text-transform: none;
  white-space: nowrap;
  overflow: visible;
}
</style>
