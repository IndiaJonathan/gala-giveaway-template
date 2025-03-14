<template>
  <v-card class="giveaway-card" rounded="xl">
    <!-- Main image container -->
    <div class="position-relative">
      <v-img :src="giveaway.image || GiveawayPlaceholderJPG" height="358px" cover class="giveaway-image">
        <!-- Available in overlay -->
        <div v-if="isUpcoming" class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-subtitle-1 text-center mb-2">Available in</div>
          <div class="countdown-timer">
            {{ availableIn }}
          </div>
        </div>

        <div v-else-if="isDistributedGiveaway && hasEnded && hasSignedUp && !hasClaimed"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">🎲</span>
          </div>
          <div class="text-h6 text-center">Better luck next time!</div>
        </div>

        <!-- All gone overlay (only for FirstComeFirstServe that have run out) -->
        <div v-else-if="!isDistributedGiveaway && (giveaway.claimsLeft || 0) <= 0 && !hasClaimed"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">🙅‍♂️</span>
          </div>
          <div class="text-h6 text-center">It's all gone!</div>
        </div>

        <div v-else-if="isDistributedGiveaway && hasClaimed" 
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">🏆</span>
          </div>
          <div class="text-h6 text-center">Congratulations! You won!</div>
        </div>

        <div v-else-if="!isDistributedGiveaway && hasClaimed" class="available-overlay d-flex align-center justify-center">
          <div class="claimed-container pa-3">
            <div class="d-flex align-center">
              <span>You've claimed it</span>
              <v-icon color="success" class="ml-2">mdi-check-circle</v-icon>
            </div>
          </div>
        </div>

        <!-- Signed up overlay for DistributedGiveaway -->
        <div v-else-if="isDistributedGiveaway && hasSignedUp"
          class="available-overlay d-flex align-center justify-center">
          <div class="claimed-container pa-3">
            <div class="d-flex align-center">
              <span>You've signed up for this raffle</span>
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
        <div class="giveaway-subtitle">
          {{ footerSubtitle }}
        </div>
      </div>

      <!-- Different button for different states -->
      <div class="button-container">
        <Web3Button v-if="!isUpcoming && shouldShowActionButton" class="web3-button" :disabled="buttonDisabled"
          :onClick="handleClaimClick" :primaryText="getButtonText()" :connectWalletText="'Sign up'" />

        <Web3Button v-else-if="!hasEnded && (hasClaimed || (isDistributedGiveaway && hasSignedUp))" class="web3-button"
          :onClick="handleViewClick" primaryText="View" :connectWalletText="'Sign up'" />
        
      </div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { type PropType, computed, defineEmits } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import GiveawayPlaceholderJPG from '@/assets/giveaway-placeholder.jpg'
import { tokenToReadable } from '@/utils/GalaHelper'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'
import Web3Button from '@/components/Web3Button.vue'
import { signupForGiveaway } from '@/services/BackendApi'
import { useToast } from '@/composables/useToast'

const { giveaway } = defineProps({
  giveaway: {
    type: Object as PropType<Giveaway>,
    required: true
  }
})

const emit = defineEmits(['signup-success'])

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

// Determine if we should show action button
const shouldShowActionButton = computed(() => {
  if (isDistributedGiveaway.value) {
    return !hasSignedUp.value && !hasEnded.value
  } else {
    // For FirstComeFirstServe, only show if there are claims left and user hasn't claimed
    return (giveaway.claimsLeft || 0) > 0 && !hasClaimed
  }
})

// Get button text based on state
const getButtonText = () => {
  if (isDistributedGiveaway.value) {
    return 'Sign up'
  } else {
    return 'Claim'
  }
}

// Handle claim or signup click action
const handleClaimClick = async () => {
  const { showToast } = useToast();

  try {
    if (isDistributedGiveaway.value) {
      console.log('Sign up clicked for raffle giveaway:', giveaway._id)
      // Use the profile store to sign a payload for the giveaway signup
      const payload = {
        giveawayId: giveaway._id,
        uniqueKey: 'giveaway-signup-' + giveaway._id + Date.now().toString()
      }
      const signedPayload = await profileStore.sign("Signup for Giveaway", payload);
      const success = await signupForGiveaway(signedPayload);
      if (success) {
        await profileStore.fetchProfile();
        // Emit an event so parent components can reload giveaways
        emit('signup-success');
        // The UI will update automatically when the profile is refreshed
        showToast('Successfully signed up for the giveaway!');
      } else {
        showToast('Failed to sign up for the giveaway.', true);
      }
    } else {
      console.log('Claim clicked for giveaway:', giveaway._id)
      // Implement claim logic here
    }
  } catch (error) {
    console.error('Error in handleClaimClick:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    showToast(`Failed to process giveaway action. Error: ${errorMessage}`, true);
  }

  return Promise.resolve()
}

// Handle view click action
const handleViewClick = async () => {
  console.log('View clicked for giveaway:', giveaway._id)
  //TODO: Implement view logic and views here
  // For distributed giveaways, we can enhance this to show details about the winner
  if (isDistributedGiveaway.value && hasEnded.value) {
    if (hasClaimed) {
      console.log('User won this giveaway')
      // Could navigate to a details page or show a modal with win information
    } else {
      console.log('User did not win this giveaway')
      // Could navigate to a details page or show results information
    }
  }
  
  return Promise.resolve()
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

// Calculate the footer subtitle text based on giveaway type
const footerSubtitle = computed(() => {
  // For upcoming giveaways, show available soon
  if (isUpcoming) {
    return 'Available soon';
  }
  
  if (isDistributedGiveaway.value) {
    // For distributed giveaway that has ended
    if (hasEnded.value) {
      if (hasClaimed) {
        return 'You won!';
      } else if (hasSignedUp.value) {
        return 'Drawing complete';
      }
    }
    
    // For active distributed giveaway, show drawing date
    if (giveaway.endDateTime) {
      const drawingDate = new Date(giveaway.endDateTime);
      
      // Format date as "Mon DD, YYYY"
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      };
      
      return `Drawing: ${drawingDate.toLocaleDateString(undefined, options)}`;
    } else {
      return 'Drawing: TBD';
    }
  } else {
    // For regular giveaway, show remaining count
    return `Remaining: ${giveaway.claimsLeft || 0}`;
  }
})

// Check if a distributed giveaway has ended (past the end date)
const hasEnded = computed(() => {
  if (!giveaway.endDateTime) {
    return false;
  }
  const endTime = new Date(giveaway.endDateTime);
  return endTime < new Date();
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
  overflow: hidden;
}

.giveaway-image {
  width: 358px;
  height: 358px;
  border-radius: 16px;
  align-self: stretch;
}

.position-relative {
  position: relative;
  width: 100%;
  height: 358px;
}

.giveaway-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  width: 100%;
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

.giveaway-subtitle {
  font-family: 'Figtree', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 145%;
  color: #CCCCCC;
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

:deep(.web3-button) {
  display: flex !important;
  flex-direction: row !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 8px 16px !important;
  min-width: 110px !important;
  width: auto !important;
  height: 34px !important;
  background: #FFFFFF !important;
  border-radius: 100px !important;
  font-family: 'Figtree', sans-serif !important;
  font-style: normal !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  line-height: 100% !important;
  text-align: center !important;
  color: #0A0A0A !important;
  text-transform: none !important;
  white-space: nowrap !important;
  overflow: visible !important;
}

:deep(.web3-button:disabled) {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

:deep(.web3-button span) {
  color: #0A0A0A !important;
}
</style>
