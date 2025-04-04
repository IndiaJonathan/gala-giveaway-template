<template>
  <v-card class="giveaway-card" rounded="xl">
    <!-- Main image container -->
    <div class="position-relative">
      <v-img :src="giveaway.giveawayToken.image" height="358px" contain class="giveaway-image">
        <!-- Burn requirement badge -->
        <div v-if="giveaway.requireBurnTokenToClaim" class="burn-badge-container">
          <v-chip color="warning" class="burn-badge" label>
            <v-icon start size="small">mdi-fire</v-icon>
            {{ giveaway.burnTokenQuantity }} {{ getTokenSymbol(giveaway.burnToken) }} burn required
          </v-chip>
        </div>

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

        <!-- Missed opportunity overlay (for DistributedGiveaway that ended without user signup) -->
        <div v-else-if="isDistributedGiveaway && hasEnded && !hasSignedUp"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">⌛</span>
          </div>
          <div class="text-h6 text-center">Raffle has ended</div>
        </div>

        <!-- All gone overlay (only for FirstComeFirstServe that have run out) -->
        <div v-else-if="!isDistributedGiveaway && (giveaway.claimsLeft || 0) <= 0 && !hasClaimed"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">🙅‍♂️</span>
          </div>
          <div class="text-h6 text-center">It's all gone!</div>
        </div>

        <!-- Ended overlay for FirstComeFirstServe that have expired but still have claims -->
        <div v-else-if="!isDistributedGiveaway && hasEnded && (giveaway.claimsLeft || 0) > 0 && !hasClaimed"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">⏱️</span>
          </div>
          <div class="text-h6 text-center">This giveaway has ended!</div>
        </div>

        <div v-else-if="isDistributedGiveaway && hasClaimed"
          class="available-overlay d-flex flex-column align-center justify-center">
          <div class="text-center mb-2">
            <span style="font-size: 4rem;">🏆</span>
          </div>
          <div class="text-h6 text-center">Congratulations! You won!</div>
        </div>

        <div v-else-if="!isDistributedGiveaway && hasClaimed"
          class="available-overlay d-flex align-center justify-center">
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
        <div class="giveaway-title-row">
          <div class="giveaway-title">
            <template v-if="giveaway.name">{{ giveaway.name }}</template>
            <template v-else>
              {{ isToken ? `${getTokenAmount()} ${getTokenSymbol(giveaway.giveawayToken)} prize` : `${getTokenAmount()}
              $${getTokenSymbol(giveaway.giveawayToken)} Claim Per User` }}
            </template>
          </div>
        </div>
        <div class="giveaway-subtitle">
          {{ footerSubtitle }}
        </div>
      </div>

      <!-- Different button for different states -->
      <div class="button-container">
        <!-- For button that needs tooltip -->
        <div v-if="!isUpcoming && shouldShowActionButton" class="button-wrapper">
          <Web3Button ref="claimButton" class="web3-button" :disabled="buttonDisabled" :onClick="handleButtonClick"
            :primaryText="getButtonText()" :connectWalletText="isDistributedGiveaway ? 'Sign up' : 'Claim'" />
          <v-tooltip :disabled="!(giveaway.requireBurnTokenToClaim && !hasEnoughTokensToBurn) || display.mobile.value"
            activator="parent" location="top">
            {{ getButtonTooltip }}
          </v-tooltip>
        </div>

        <!-- Button for already claimed or signed up -->
        <div
          v-if="!isUpcoming && !shouldShowActionButton && !hasEnded && (hasClaimed || (isDistributedGiveaway && hasSignedUp))"
          class="button-wrapper">
          <Web3Button class="web3-button" :onClick="handleViewClick"
            :primaryText="isDistributedGiveaway ? 'Sign up' : 'Claim'"
            :connectWalletText="isDistributedGiveaway ? 'Sign up' : 'Claim'" :disabled="true" />
        </div>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { type PropType, computed, defineEmits, onMounted, onUnmounted, ref, nextTick } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import GiveawayPlaceholderJPG from '@/assets/giveaway-placeholder.jpg'
import { tokenToReadable, getTokenSymbol } from '@/utils/GalaHelper'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'
import Web3Button from '@/components/Web3Button.vue'
import { claimWin, requestClaimFCFS, signupForGiveaway } from '@/services/BackendApi'
import { useToast } from '@/composables/useToast'
import { useDisplay } from 'vuetify'
import BigNumber from 'bignumber.js'

const { giveaway } = defineProps({
  giveaway: {
    type: Object as PropType<Giveaway>,
    required: true
  }
})

const emit = defineEmits(['signup-success', 'giveaway-available'])

const profileStore = useProfileStore()
const { connectedUserGCAddress, profile, metadata } = storeToRefs(profileStore)

const hasClaimed = giveaway.isWinner === true

const startTime = new Date(giveaway.startDateTime)
// Use ref instead of computed for isUpcoming
const isUpcoming = ref(startTime > new Date())

// Change from computed to ref for timer updates
const availableIn = ref('')
let countdownTimer: number | null = null

// Calculate and update the remaining time
function updateRemainingTime() {
  // Refresh the calculation of whether the giveaway is upcoming
  isUpcoming.value = startTime > new Date()

  if (!isUpcoming.value) {
    availableIn.value = ''
    // Clear the timer if we're no longer upcoming
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    return
  }

  const now = new Date()
  const secondsRemaining = Math.floor((startTime.getTime() - now.getTime()) / 1000)

  // less than 1 minute - update every second
  if (secondsRemaining < 60) {
    availableIn.value = `${secondsRemaining}s`

    // If we're showing seconds, make sure we're updating every second
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = setInterval(updateRemainingTime, 1000) as unknown as number
    }
  }
  // less than 1 hour - update every minute
  else if (secondsRemaining < 3600) {
    const minutesRemaining = Math.round(secondsRemaining / 60)
    availableIn.value = `${minutesRemaining}m`

    // If we're showing minutes, we can update once per minute
    if (countdownTimer && secondsRemaining % 60 === 0) {
      clearInterval(countdownTimer)
      countdownTimer = setInterval(updateRemainingTime, 60000) as unknown as number
    }
  }
  // more than 1 hour - update every minute
  else {
    const minutesTotalRemaining = Math.round(secondsRemaining / 60)
    const hoursRemaining = Math.floor(minutesTotalRemaining / 60)
    const minutesRemaining = minutesTotalRemaining % 60
    availableIn.value = `${hoursRemaining}h ${minutesRemaining}m`
  }

  // Check if we've gone past the start time
  if (secondsRemaining <= 0) {
    // Refresh the component data when timer ends
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }

    // Update isUpcoming again
    isUpcoming.value = startTime > new Date()

    // If the giveaway just became available
    if (!isUpcoming.value) {
      // Emit an event to trigger any parent components to update
      emit('giveaway-available', giveaway._id)

      // Force refresh of component state
      availableIn.value = ''

      // Force a UI refresh without directly assigning to computed properties
      nextTick(() => {
        // Just triggering the nextTick will force a UI refresh
        // No need to assign to computed property values
      })
    }
  }
}

// Set up the timer when the component is mounted
onMounted(() => {
  // Update immediately
  updateRemainingTime()

  // Determine initial update frequency based on time remaining
  const now = new Date()
  const secondsRemaining = Math.floor((startTime.getTime() - now.getTime()) / 1000)

  let updateInterval = 60000 // Default to every minute
  if (secondsRemaining < 60) {
    updateInterval = 1000 // Every second when less than a minute remains
  }

  // Then update at the determined interval
  countdownTimer = setInterval(updateRemainingTime, updateInterval) as unknown as number
})

// Clean up the timer when the component is unmounted
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

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

// Get token amount
const getTokenAmount = () => {
  return giveaway.winPerUser || 'UNKNOWN'
}

// Determine if we should show action button
const shouldShowActionButton = computed(() => {
  if (isDistributedGiveaway.value) {
    return !hasSignedUp.value && !hasEnded.value
  } else {
    // For FirstComeFirstServe, only show if there are claims left, user hasn't claimed, and giveaway hasn't ended
    return (giveaway.claimsLeft || 0) > 0 && !hasClaimed && !hasEnded.value
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
    // Check if Telegram auth is required but user doesn't have it linked
    if (giveaway.telegramAuthRequired && profile.value && !profile.value.hasTelegramLinked) {
      showToast('Must link Telegram account first', true);
      return Promise.resolve();
    }

    if (isDistributedGiveaway.value) {
      console.log('Sign up clicked for raffle giveaway:', giveaway._id)
      // Use the profile store to sign a payload for the giveaway signup
      let payload: any = {
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
      //FCFS
      const payload: any = {
        giveawayId: giveaway._id,
        uniqueKey: 'giveaway-claim-' + giveaway._id + Date.now().toString()
      }
      if (giveaway.requireBurnTokenToClaim && giveaway.burnToken && giveaway.burnTokenQuantity) {
        payload.tokenInstances = [{
          quantity: giveaway.burnTokenQuantity,
          tokenInstanceKey: {
            collection: giveaway.burnToken.collection,
            category: giveaway.burnToken.category,
            type: giveaway.burnToken.type,
            additionalKey: giveaway.burnToken.additionalKey,
            instance: '0'
          }
        }]
      }
      const signedPayload = await profileStore.sign("Claim Giveaway", payload);
      const success = await requestClaimFCFS(signedPayload);
      if (success) {
        await profileStore.fetchProfile();
        // Reload balances after successful claim
        await profileStore.getBalances(true);
        await profileStore.fetchGiveaways()

        // Emit an event so parent components can reload giveaways
        emit('signup-success');
        showToast('Successfully claimed the giveaway!');
      }
    }
  } catch (error: any) {
    console.error('Error in handleClaimClick:', error);
    const errorMessage = error.message || error || 'Unknown error occurred';
    showToast(errorMessage || 'Failed to process giveaway action. Error: Unknown error occurred', true);
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
    } else if (hasSignedUp.value) {
      console.log('User participated but did not win this giveaway')
      // Could navigate to a details page or show results information
    } else {
      console.log('User did not participate in this giveaway')
      // Could show historical information about the raffle
    }
  } else if (hasClaimed) {
    console.log('User claimed this first-come-first-serve giveaway')
    // Could show claim details
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
  if (isUpcoming.value) {
    return true
  }

  // Check if user has insufficient tokens for burn - only disable on desktop
  if (giveaway.requireBurnTokenToClaim && !hasEnoughTokensToBurn.value && !display.mobile.value) {
    return true
  }

  if (isDistributedGiveaway.value) {
    return hasSignedUp.value
  } else {
    // FirstComeFirstServe type - disable if no claims left, already claimed, or has ended
    return (giveaway.claimsLeft || 0) <= 0 || hasClaimed || hasEnded.value
  }
})

// Add a new computed property to check if user has enough tokens to burn
const hasEnoughTokensToBurn = computed(() => {
  if (!giveaway.requireBurnTokenToClaim || !giveaway.burnToken || !giveaway.burnTokenQuantity) {
    return true
  }

  // Check if we have balances data
  if (!profileStore.balances?.userBalances?.Data) {
    return false
  }

  // Find the required token in user's balances
  const requiredToken = profileStore.balances.userBalances.Data.find(token =>
    token.collection === giveaway.burnToken.collection &&
    token.category === giveaway.burnToken.category &&
    token.type === giveaway.burnToken.type &&
    token.additionalKey === giveaway.burnToken.additionalKey
  )

  // If token not found or quantity is less than required, return false
  if (!requiredToken) {
    return false
  }

  const userQuantity = new BigNumber(requiredToken.quantity || '0')
  const requiredQuantity = new BigNumber(giveaway.burnTokenQuantity)

  return userQuantity.isGreaterThanOrEqualTo(requiredQuantity)
})

// Get tooltip text based on button state
const getButtonTooltip = computed(() => {
  if (giveaway.requireBurnTokenToClaim && !hasEnoughTokensToBurn.value) {
    return `You need ${giveaway.burnTokenQuantity} ${getTokenSymbol(giveaway.burnToken)} to claim this giveaway`
  }
  return ''
})

// Calculate the footer subtitle text based on giveaway type
const footerSubtitle = computed(() => {
  // For upcoming giveaways, show available soon
  if (isUpcoming.value) {
    return 'Available soon';
  }

  if (isDistributedGiveaway.value) {
    // For distributed giveaway that has ended
    if (hasEnded.value) {
      if (hasClaimed) {
        return 'You won!';
      } else if (hasSignedUp.value) {
        return 'Drawing complete';
      } else {
        return 'Raffle ended';
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
    // For first-come-first-serve giveaway
    if (hasEnded.value) {
      return 'Ended';
    }

    // For active first-come-first-serve, show remaining count
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

// Get the giveaway image based on the metadata
// const getGiveawayImage = () => {
//   // Check if we have the metadata and giveaway token
//   if (metadata.value && giveaway.giveawayToken) {
//     // Find the token metadata
//     const tokenMetadata = metadata.value.find(meta =>
//       meta.collection === giveaway.giveawayToken.collection &&
//       meta.category === giveaway.giveawayToken.category &&
//       meta.type === giveaway.giveawayToken.type
//     );

//     // Use the metadata image if available
//     if (tokenMetadata && tokenMetadata.image) {
//       return tokenMetadata.image;
//     }
//   }

//   // Fall back to the giveaway image or placeholder
//   return giveaway.giveawayToken.image || GiveawayPlaceholderJPG;
// }

// Add useToast and useDisplay
const { showToast } = useToast()
const display = useDisplay()

// Add method to handle button click on mobile
const handleButtonClick = async () => {
  // Show toast on mobile devices instead of tooltip
  if (display.mobile.value && giveaway.requireBurnTokenToClaim && !hasEnoughTokensToBurn.value) {
    showToast(getButtonTooltip.value, true)
    // Return a resolved promise to satisfy the Web3Button's onClick requirement
    // but DON'T proceed with the claim action
    return Promise.resolve()
  }

  // Original button action for desktop or when conditions are met
  return handleClaimClick()
}
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
  align-items: center;
  justify-content: flex-end;
}

/* Button wrapper for tooltips */
.button-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
  /* Prevent extra space */
}

/* Ensure tooltips are visible */
:deep(.v-tooltip) {
  z-index: 1000 !important;
}

.giveaway-title-row {
  display: flex;
  align-items: center;
  width: 100%;
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

.burn-badge-container {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
}

.burn-badge {
  background: rgba(255, 152, 0, 0.9) !important;
  color: white !important;
  font-weight: 600;
  padding: 0 12px;
  height: 32px !important;
  font-size: 12px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.burn-badge :deep(.v-icon) {
  color: white !important;
  margin-right: 4px;
}
</style>
