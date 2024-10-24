<template>
  <v-container v-if="!props.giveawaySettings.tokenQuantity || !props.giveawaySettings.winners">
    <p>Something isn't set, please go back to step 2</p>
  </v-container>
  <v-container v-else>
    <v-progress-circular v-if="isLoading" indeterminate size="64"></v-progress-circular>

    <v-form v-else>
      <p v-if="totalAllowance">
        You have a granted net allowance of {{ totalAllowance }} to the giveaway wallet
      </p>
      <p v-else="totalAllowance">
        You have not yet granted any allowance of this token to the giveaway wallet
      </p>
      <p v-if="totalAllowance >= props.giveawaySettings.tokenQuantity">
        This is enough to start the giveaway!
      </p>
      <div v-else>
        <p>
          You need to grant {{ props.giveawaySettings.tokenQuantity - (totalAllowance || 0) }} more
          to start the giveaway
        </p>
        <v-btn color="success" @click="grantAdditionalAllowance">Grant Allowance</v-btn>
      </div>

      <!-- <TokenInput
        ref="tokenInputRef"
        v-model:tokenClass="tokenClassReadOnly"
        :showQuantity="false"
        readOnly
      />
      <v-btn @click="grantAllowance" color="primary">Grant Allowance</v-btn> -->
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GetAdminQuantityAvailable, getProfile } from '@/services/BackendApi'
import { GalaChainApi } from '@/services/GalaChainApi'
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

async function grantAdditionalAllowance() {
  await browserClient.connect()
  const profile = await getProfile(browserClient.galachainEthAlias)
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
    const grant = await tokenService.grantAllowance(
      props.tokenClassKey,
      props.giveawaySettings.tokenQuantity - (totalAllowance.value || 0),
      profile.giveawayWalletAddress
    )
    if ((grant as any).Status === 1) {
      // Success!
      showToast('Allowance Granted!')
      await loadBalances()
    } else {
      showToast('Unable to grant allowance.', true)
    }
  }
}

async function loadBalances() {
  try {
    await browserClient.connect()

    const profile = await getProfile(browserClient.galachainEthAlias)
    await tokenService.init()

    if (!profile || !profile.galaChainAddress) {
      showToast('Unable to get admin wallet info', true)
      return
    }

    const response = await GetAdminQuantityAvailable(props.tokenClassKey, profile.galaChainAddress)
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
    console.log('hit here')
    if (tokenQuantity && (totalAllowance >= tokenQuantity || 0)) {
      console.log('valid')

      emit('form-valid', { stepNumber: 3, isComplete: true })
    } else {
      console.log('invalid')

      emit('form-valid', { stepNumber: 3, isComplete: false })
    }
  }
)
loadBalances()
</script>
