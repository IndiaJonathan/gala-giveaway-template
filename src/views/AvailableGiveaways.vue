<template>
  <v-container>
    <v-list>
      <v-list-item
        v-for="(giveaway, index) in giveaways"
        :key="index"
        @click="signUpForGiveaway(giveaway)"
        class="giveaway-item"
      >
        <v-list-item-title>
          {{ giveaway.giveawayToken.category }} - {{ giveaway.tokenQuantity }} tokens
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ getEndDateMessage(giveaway.endDateTime) }}
        </v-list-item-subtitle>
        <v-list-item-action>
          <v-icon v-if="isUserSignedUp(giveaway)">mdi-check-circle</v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import { getGiveaways, signupForGiveaway } from '@/services/BackendApi'
import type { SignupForGiveawayDto } from '@/utils/types'
import type { TokenClassBody } from '@gala-chain/api'
import { BrowserConnectClient } from '@gala-chain/connect'
import { defineComponent, ref, onMounted } from 'vue'

export interface Giveaway {
  _id: string
  giveawayToken: TokenClassBody
  tokenQuantity: string
  winners: string
  signature: string
  endDateTime?: string
  usersSignedUp: string[]
}

export default defineComponent({
  name: 'GiveawayList',
  setup() {
    const giveaways = ref<Giveaway[]>([])
    const userId = 'currentUserId123'

    // Fetch giveaways on component mount
    const fetchGiveaways = async () => {
      giveaways.value = await getGiveaways()
    }

    // Fetch giveaways once component is mounted
    onMounted(() => {
      fetchGiveaways()
    })

    // Method to sign up for a giveaway
    const signGiveaway = async (giveaway: Giveaway) => {
      try {
        const connectClient = new BrowserConnectClient()
        await connectClient.connect()
        const signupDto: SignupForGiveawayDto = {
          giveawayId: giveaway._id
        }
        const signedDto = await connectClient.sign('Signup for Giveaway', signupDto as any)
        const response = await signupForGiveaway(signedDto)
      } catch (error) {
        console.error('Error signing up for giveaway:', error)
      }
    }

    // Check if the user is already signed up for the giveaway
    const isUserSignedUp = (giveaway: Giveaway): boolean => {
      //todo: fix this
      return true
      //   return giveaway.usersSignedUp.includes(userId)
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
      getEndDateMessage
    }
  }
})
</script>

<style scoped>
.giveaway-item {
  cursor: pointer;
}
</style>
