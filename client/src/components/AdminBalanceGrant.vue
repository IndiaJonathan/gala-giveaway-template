<template>
  <v-container>
    <div v-if="isLoading" class="text-center my-8">
      <v-progress-circular indeterminate size="48"></v-progress-circular>
    </div>
    <v-alert v-if="!props.giveawaySettings.tokenQuantity || !props.giveawaySettings.winners || !props.giveawaySettings.tokenQuantity" type="info"
      class="mb-6">
      Please go back to Step 2 to set all required settings.
    </v-alert>

    <v-form v-else>
      <div v-if="totalAllowance" class="text-muted mb-4">
        <p>You have a net allowance of <strong>{{ totalAllowance }}</strong> tokens allocated to the giveaway wallet.
        </p>
      </div>
      <div v-else class="text-muted mb-4">
        <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
      </div>

      <v-alert v-if="totalAllowance >= props.giveawaySettings.tokenQuantity" type="success" dense outlined
        class="mb-4">
        You have sufficient allowance to start the giveaway.
      </v-alert>

      <div v-else class="text-muted mb-4">
        <p>
          You need to grant an additional
          <strong>{{ new BigNumber(props.giveawaySettings.tokenQuantity || 0).minus(new BigNumber(totalAllowance || 0))
            }}</strong>
          tokens to meet the requirement.
        </p>
        <v-btn color="primary" @click="grantAdditionalAllowance" class="mt-2">
          Grant Additional Allowance
        </v-btn>
      </div>

      <v-divider></v-divider>

      <v-btn @click="loadBalances" color="primary" class="mt-6">
        Refresh Allowances
      </v-btn>

      <div v-if="giveawayWallet" class="text-muted mt-8">
        <p>All allowances are granted to the giveaway wallet: <strong>{{ giveawayWallet }}</strong></p>
      </div>
    </v-form>
  </v-container>
</template>



<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GetAdminQuantityAvailable, getProfile } from '@/services/BackendApi'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import {
  createValidDTO,
  FetchAllowancesDto,
  type TokenClassKey,
  type TokenClassKeyProperties
} from '@gala-chain/api'
import { ref, watch, type PropType } from 'vue'
import TokenInput from './TokenInput.vue'
import type { GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'

const props = defineProps({
  tokenClassKey: {
    type: Object as PropType<TokenClassKeyProperties>,
    required: true
  },
  giveawaySettings: {
    type: Object as PropType<GiveawaySettingsDto>,
    required: true
  }
})

const isLoading = ref(true)
const tokenClassReadOnly = { ...props.tokenClassKey }
const tokenService = GalaChainApi.getInstance()

const emit = defineEmits<{
  (e: 'form-valid', payload: { stepNumber: number; isComplete: boolean }): void
}>()

const { showToast } = useToast()
const totalAllowance = ref()
const browserClient = new BrowserConnectClient()
const giveawayWallet = ref();

async function grantAdditionalAllowance() {
  await browserClient.connect()
  const profile = await getProfile(browserClient.galaChainAddress)
  if (!profile.giveawayWalletAddress) {
    showToast(`Unable to get giveway wallet`, true)
    return
  }
  if (!props.giveawaySettings.tokenQuantity) {
    showToast('Unable to find the token quantity, please make sure it is set in step 2!')
    return
  }
  await tokenService.init()
  if (!props.tokenClassKey) {
    showToast('Please select a token at step 1!')
  } else {
    try {

      const grant = await tokenService.grantAllowance(
        props.tokenClassKey,
        new BigNumber(props.giveawaySettings.tokenQuantity).minus( new BigNumber(totalAllowance.value || 0)),
        profile.giveawayWalletAddress
      )
      if (grant.Status === 1) {
        // Success!
        showToast('Allowance Granted!')
        await loadBalances()
      }
    } catch (e: unknown) {
      let errorMessage = 'unknown error';

      if (isErrorWithMessage(e)) {
        errorMessage = e.Message
      }

      console.error(errorMessage)
      showToast(`Unable to grant allowance. Error: ${errorMessage}`, true);
    }
  }
}

function isErrorWithMessage(error: unknown): error is { Message: string } {
  return typeof error === 'object' && error !== null && 'Message' in error;
}

async function loadBalances() {
  try {
    await browserClient.connect()

    const profile = await getProfile(browserClient.galaChainAddress)
    await tokenService.init()

    if (!profile || !profile.galaChainAddress) {
      showToast('Unable to get admin wallet info', true)
      return
    }
    console.log('loaded here')

    const response = await GetAdminQuantityAvailable(props.tokenClassKey, profile.galaChainAddress)
    giveawayWallet.value = response?.giveawayWallet;
    totalAllowance.value = Number(response?.totalQuantity)
  } catch (e: any) {
    showToast(e.message || 'An error occured', true)
    console.warn(e)
  } finally {
    isLoading.value = false
  }
}

watch(
  [() => Number(props.giveawaySettings.tokenQuantity), totalAllowance],
  ([tokenQuantity, totalAllowance]) => {
    if (tokenQuantity && (totalAllowance >= tokenQuantity || 0)) {
      emit('form-valid', { stepNumber: 3, isComplete: true })
    } else {
      emit('form-valid', { stepNumber: 3, isComplete: false })
    }
  }
)
loadBalances()
</script>
