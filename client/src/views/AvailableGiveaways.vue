<template>
  <div></div>
  <!-- <div class="d-flex justify-center" style="padding-top: 20px">
    <Web3Button
      color="primary"
      v-if="!connectedEthAddress || isFetchingProfile"
      @click="connectAndFetch"
      primary-text="Sign In"
    >
    </Web3Button>
  </div>
  <div class="d-flex justify-center" style="padding-top: 20px">
    <v-btn
      color="primary"
      v-if="connectedEthAddress && !profile && !isFetchingProfile"
      @click="signUpForGalachain"
      >Sign Up</v-btn
    >
  </div>

  <v-dialog :model-value="!!selectedGiveaway" v-if="!!selectedGiveaway" max-width="400px">
    <v-card>
      <v-card-title class="text-h5">Confirm Action</v-card-title>
      <v-card-text v-if="selectedGiveaway">
        To claim this giveaway costs {{ selectedGiveaway.burnTokenQuantity }}
        {{ tokenToReadable(selectedGiveaway.burnToken) }}. Do you want to claim it?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="confirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container>
    <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
    <div v-else-if="giveaways.length">
      <div v-if="activeGiveaways.length">
        <v-list-subheader>Active Giveaways</v-list-subheader>
        <v-list>
          <v-list-item
            v-for="(giveaway, index) in activeGiveaways"
            :key="index"
            class="giveaway-item"
            @click="requestClickGiveaway(giveaway)"
          >
            <DistributedGiveaway
              v-if="giveaway.giveawayType === 'DistributedGiveway'"
              :is-user-signed-up="isUserSignedUp(giveaway)"
              :giveaway="giveaway"
            >
            </DistributedGiveaway>

            <FirstComeFirstServe
              v-if="giveaway.giveawayType === 'FirstComeFirstServe'"
              :giveaway="giveaway"
            >
            </FirstComeFirstServe>
            <v-divider style="margin-top: 10px"></v-divider>
          </v-list-item>
        </v-list>
      </div>

      <v-divider style="margin-top: 20px; margin-bottom: 20px"></v-divider>
    -->

  <!-- Completed Giveaways -->
  <!--<div v-if="completedGiveaways.length">
        <v-list-subheader>Completed Giveaways</v-list-subheader>
        <v-list>
          <v-list-item
            v-for="(giveaway, index) in completedGiveaways"
            :key="index"
            class="giveaway-item"
          >
            <v-list-item-title>
              Giveway of {{ giveaway.tokenQuantity }} "{{
                tokenToReadable(giveaway.giveawayToken)
              }}" Tokens
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ getEndDateMessage(giveaway.endDateTime) }}
            </v-list-item-subtitle>
            <v-list-item-action>
              <div v-if="giveaway.isWinner">
                You won! <v-icon class="ml-2">mdi-check-circle</v-icon>
              </div>
            </v-list-item-action>
            <v-divider style="margin-top: 10px"></v-divider>
          </v-list-item>
        </v-list>
      </div>
    </div>
    <div v-else>No giveaways yet. Why not start one?</div>
  </v-container> -->
</template>

<script lang="ts" setup>
import { getGiveaways, requestClaimFCFS, signupForGiveaway } from '@/services/BackendApi'
import type { ClaimFCFSDto, SignupForGiveawayDto } from '@/utils/types'
import type { TokenClassKeyProperties, TokenInstanceKey } from '@gala-chain/api'
import { BrowserConnectClient } from '@gala-chain/connect'
import { ref, onMounted, computed, watch, type Ref } from 'vue'
import { useToast } from '../composables/useToast'
import { getConnectedAddress, randomId, tokenToReadable } from '../utils/GalaHelper'
import DistributedGiveaway from '@/components/DistributedGiveaway.vue'
import { getEndDateMessage } from '@/utils/Helpers'
import FirstComeFirstServe from '@/components/FirstComeFirstServe.vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import Web3Button from '@/components/Web3Button.vue'

export interface Giveaway {
  _id: string
  giveawayToken: TokenClassKeyProperties
  tokenQuantity: string
  maxWinners: string
  signature: string
  endDateTime?: string
  usersSignedUp: string[]
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties
  isWinner?: boolean
  claimPerUser?: string
  claimsLeft?: number
  giveawayType: 'FirstComeFirstServe' | 'DistributedGiveway'
}

const selectedGiveaway: Ref<Giveaway | null> = ref(null)
const { showToast } = useToast()
const giveaways = ref<Giveaway[]>([])
const loading = ref(true)

const profileStore = useProfileStore()
// Destructure to get reactive variables
const { profile, isConnected, error, connectedEthAddress, connectedUserGCAddress, isFetchingProfile } = storeToRefs(profileStore)

const fetchGiveaways = async () => {
  try {
    loading.value = true
    console.log("hit")
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

const requestSignDistributedGiveaway = async (giveaway: Giveaway) => {
  const userAlreadySigned = isUserSignedUp(giveaway)
  if (userAlreadySigned) {
    switch (giveaway.giveawayType) {
      case 'DistributedGiveway':
        showToast("You're already signed up!", true)
        break
      case 'FirstComeFirstServe':
        showToast("You've already claimed this!", true)
        break
    }
    return
  }

  if (giveaway.requireBurnTokenToClaim && giveaway.giveawayType === 'FirstComeFirstServe') {
    selectedGiveaway.value = giveaway
    return
  }

  await signGiveaway(giveaway)
}

async function requestClickGiveaway(giveaway: Giveaway) {
  switch (giveaway.giveawayType) {
    case 'DistributedGiveway':
      return await requestSignDistributedGiveaway(giveaway)
    case 'FirstComeFirstServe':
      return await requestSignFCFSGiveaway(giveaway)
  }
}

const requestSignFCFSGiveaway = async (giveaway: Giveaway) => {
  const userAlreadyClaimed = hasUserClaimed(giveaway)
  if (userAlreadyClaimed) {
    showToast("You've already claimed this!", true)
    return
  }

  if (giveaway.requireBurnTokenToClaim) {
    //Confirmation dialogue
    selectedGiveaway.value = giveaway
  } else {
    await claimFCFS(giveaway)
  }
}

const isUserSignedUp = (giveaway: Giveaway): boolean => {
  return (
    !!connectedUserGCAddress.value &&
    giveaway.usersSignedUp.includes(connectedUserGCAddress.value)
  )
}
const hasUserClaimed = (giveaway: Giveaway): boolean => {
  return (
    !!connectedUserGCAddress.value &&
    !!giveaway.isWinner
  )
}
watch(connectedUserGCAddress, () => {
  fetchGiveaways();
});

const claimFCFS = async (giveaway: Giveaway) => {
  try {
    const signupDto: ClaimFCFSDto = {
      giveawayId: giveaway._id
    }

    if (giveaway.burnToken && giveaway.burnTokenQuantity && giveaway.requireBurnTokenToClaim) {
      signupDto.tokenInstances = [
        {
          quantity: giveaway.burnTokenQuantity.toString() as any,
          tokenInstanceKey: { ...giveaway.burnToken, instance: '0' as any } as TokenInstanceKey
        }
      ]
    }
    const signedDto = await profileStore.sign('Claim Giveaway', signupDto as any)
    await requestClaimFCFS(signedDto)

    // giveaway.usersSignedUp.push(connectedUserGCAddress.value)

    showToast('Claim Successful!')

    giveaway.isWinner = true
  } catch (error: any) {
    if (error.message && error.message.includes('ACTION_REJECTED')) {
      showToast(`Rejected sign request`, true)
    } else {
      console.error('Error signing up for giveaway:', error)
      showToast(`${error.message || 'Unable to signup. Unknown error'}`, true)
    }
  }
}
const signGiveaway = async (giveaway: Giveaway) => {
  try {
    if (!connectedEthAddress.value || !connectedUserGCAddress.value) {
      throw Error('Not Connected')
    }
    const signupDto: SignupForGiveawayDto = {
      giveawayId: giveaway._id,
      uniqueKey: 'giveaway-signup-' + randomId(),
    }
    const signedDto = await profileStore.sign('Signup for Giveaway', signupDto as any)

    await signupForGiveaway(signedDto)

    giveaway.usersSignedUp.push(connectedUserGCAddress.value)

    switch (giveaway.giveawayType) {
      case 'DistributedGiveway':
        showToast('Signup Successful, good luck!')
        break
      case 'FirstComeFirstServe':
        showToast('Claim Successful!')
        break
    }
  } catch (error: any) {
    if (error.message && error.message.includes('ACTION_REJECTED')) {
      showToast(`Rejected sign request`, true)
    } else {
      console.error('Error signing up for giveaway:', error)
      showToast(`${error.message || 'Unable to signup. Unknown error'}`, true)
    }
  }
}

async function connectAndFetch() {
  const connection = await profileStore.connect()
  if (connection) {
    await fetchGiveaways()
  }
}

async function signUpForGalachain() {
  console.log('Galachain signup')
}

function cancel() {
  selectedGiveaway.value = null
}

async function confirm() {
  if (selectedGiveaway.value) {
    await claimFCFS(selectedGiveaway.value)
    selectedGiveaway.value = null
  }
}
</script>
