<template>
  <v-container>
    <v-list>
      <v-list-item v-for="(giveaway, index) in giveaways" :key="index" @click="signUpForGiveaway(giveaway)"
        class="giveaway-item">
        <v-list-item-title>
          {{ tokenToReadable(giveaway.giveawayToken) }} - {{ giveaway.tokenQuantity }} tokens
        </v-list-item-title>
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
  </v-container>
</template>

<script lang="ts">
import { getGiveaways, signupForGiveaway } from '@/services/BackendApi'
import type { SignupForGiveawayDto } from '@/utils/types'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { BrowserConnectClient } from '@gala-chain/connect'
import { defineComponent, ref, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { getConnectedAddress, tokenToReadable } from '../utils/GalaHelper'

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
}

export default defineComponent({
  name: 'GiveawayList',
  setup() {
    const { showToast } = useToast()
    let connectedUserGCAddress = ref<string | null>()
    const giveaways = ref<Giveaway[]>([])

    // Fetch giveaways on component mount
    const fetchGiveaways = async () => {
      connectedUserGCAddress.value = await getConnectedAddress()
      giveaways.value = await getGiveaways()
    }

    onMounted(() => {
      fetchGiveaways()
    })

    // Method to sign up for a giveaway
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
        console.error('Error signing up for giveaway:', error)
        showToast(`${error.message || 'Unable to signup. Unknown error'}`, true)
      }
    }

    // Check if the user is already signed up for the giveaway
    const isUserSignedUp = (giveaway: Giveaway): boolean => {
      return (
        !!connectedUserGCAddress.value &&
        !!giveaway.usersSignedUp.find((gcWallet) => connectedUserGCAddress.value === gcWallet)
      )
    }

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

    // Format the end date to be human-readable
    return {
      giveaways,
      signUpForGiveaway: signGiveaway,
      isUserSignedUp,
      getEndDateMessage,
      tokenToReadable
    }
  }
})
</script>

<style scoped>
.giveaway-item {
  cursor: pointer;
}
</style>
