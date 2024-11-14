<template>
  <v-container>
    <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
    <div v-else-if="giveaways.length">
      <div v-if="activeGiveaways.length">
        <v-list-subheader>Active Giveaways</v-list-subheader>
        <v-list>
          <v-list-item v-for="(giveaway, index) in activeGiveaways" :key="index" @click="signGiveaway(giveaway)"
            class="giveaway-item">
            <v-list-item-title>
              Giveway of {{ giveaway.tokenQuantity }} "{{ tokenToReadable(giveaway.giveawayToken) }}" Tokens
            </v-list-item-title>
            <v-list-item-subtitle>
              Winners Possible: {{ giveaway.winnerCount }} </v-list-item-subtitle>
            <v-list-item-subtitle>
              {{ getEndDateMessage(giveaway.endDateTime) }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="giveaway.requireBurnTokenToClaim">
              Requires {{ giveaway.burnTokenQuantity }} burnable token(s) of:
              "{{ tokenToReadable(giveaway.burnToken) }}" to claim
            </v-list-item-subtitle>
            <v-list-item-action>
              <div v-if="isUserSignedUp(giveaway)">
                Signed Up <v-icon class="ml-2">mdi-check-circle</v-icon>
              </div>
              <div v-else-if="giveaway.telegramAuthRequired">Telegram Auth Required</div>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>


      <v-divider style="margin-top: 20px; margin-bottom: 20px;"></v-divider>

      <!-- Completed Giveaways -->
      <div v-if="completedGiveaways.length">
        <v-list-subheader>Completed Giveaways</v-list-subheader>
        <v-list>
          <v-list-item v-for="(giveaway, index) in completedGiveaways" :key="index" class="giveaway-item">
            <v-list-item-title>
              Giveway of {{ giveaway.tokenQuantity }} "{{ tokenToReadable(giveaway.giveawayToken) }}" Tokens
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ getEndDateMessage(giveaway.endDateTime) }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="giveaway.requireBurnTokenToClaim">
              Requires {{ giveaway.burnTokenQuantity }} burnable token(s) of:
              "{{ tokenToReadable(giveaway.burnToken) }}" to claim
            </v-list-item-subtitle>
            <v-list-item-action>
              <div v-if="giveaway.isWinner">
                You won!!! <v-icon class="ml-2">mdi-check-circle</v-icon>
              </div>
              <div v-else-if="giveaway.telegramAuthRequired">Telegram Auth Required</div>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>
    </div>
    <div v-else>
      No giveaways yet. Why not start one?
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { getActiveGiveaways, getGiveaways, signupForGiveaway } from '@/services/BackendApi'
import type { SignupForGiveawayDto } from '@/utils/types'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { BrowserConnectClient } from '@gala-chain/connect'
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from '../composables/useToast'
import { getConnectedAddress, isEthersRejectedRequest, tokenToReadable } from '../utils/GalaHelper'

export interface Giveaway {
  _id: string
  giveawayToken: TokenClassKeyProperties
  tokenQuantity: string
  winnerCount: string
  signature: string
  endDateTime?: string
  usersSignedUp: string[]
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties
  isWinner?: boolean
}

const { showToast } = useToast()
const connectedUserGCAddress = ref<string | null>(null)
const giveaways = ref<Giveaway[]>([])
const loading = ref(true)

const fetchGiveaways = async () => {
  loading.value = true
  connectedUserGCAddress.value = await getConnectedAddress()
  if (connectedUserGCAddress.value) {
    giveaways.value = await getGiveaways(connectedUserGCAddress.value)
  } else {
    giveaways.value = await getActiveGiveaways()
  }
  loading.value = false
}

onMounted(() => {
  fetchGiveaways()
})

const activeGiveaways = computed(() => {
  return giveaways.value.filter((giveaway) => {
    if (giveaway.endDateTime) {
      return new Date(giveaway.endDateTime) > new Date()
    }
    // If no endDateTime is provided, consider it active
    return true
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

const signGiveaway = async (giveaway: Giveaway) => {
  try {
    const connectClient = new BrowserConnectClient()
    connectedUserGCAddress.value = await connectClient.connect()
    const userAlreadySigned = isUserSignedUp(giveaway)
    if (userAlreadySigned) {
      showToast("You're already signed up!")
      return
    }
    const signupDto: SignupForGiveawayDto = {
      giveawayId: giveaway._id
    }
    const signedDto = await connectClient.sign('Signup for Giveaway', signupDto as any)
    await signupForGiveaway(signedDto)
    giveaway.usersSignedUp.push(connectedUserGCAddress.value)
    showToast('Signup Successful, good luck!')
  } catch (error: any) {
    if (error.message && error.message.includes("ACTION_REJECTED")) {
      showToast(`Rejected sign request`, true)
    } else {
      console.error('Error signing up for giveaway:', error)
      showToast(`${error.message || 'Unable to signup. Unknown error'}`, true)
    }
  }
}

const isUserSignedUp = (giveaway: Giveaway): boolean => {
  return (
    !!connectedUserGCAddress.value &&
    giveaway.usersSignedUp.includes(connectedUserGCAddress.value)
  )
}
watch(connectedUserGCAddress, () => {
  fetchGiveaways();
});

const getEndDateMessage = (dateString?: string): string => {
  if (dateString) {
    const endDate = new Date(dateString)
    const now = new Date()

    if (now > endDate) {
      return `Ended: ${endDate.toLocaleDateString()}`
    } else {
      return `Ends: ${endDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`
    }
  }
  return 'No end date'
}
</script>
