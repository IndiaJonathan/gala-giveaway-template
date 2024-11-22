<template>
  <v-container>
    <div v-if="isLoading" class="text-center my-8">
      <v-progress-circular indeterminate size="48"></v-progress-circular>
    </div>
    <v-alert
      v-if="!props.giveawaySettings.tokenQuantity || !props.giveawaySettings.winners || !props.giveawaySettings.tokenQuantity"
      type="info" class="mb-6">
      Please go back to Step 2 to set all required settings.
    </v-alert>

    <v-form v-else-if="!isLoading">
      <h1>Giveaway Token Requirements</h1>

      <div v-if="totalAllowance" class="text-muted mb-4">
        <p>You have a net allowance of <strong>{{ totalAllowance }}</strong> tokens allocated to the giveaway wallet.
        </p>
      </div>
      <div v-else class="text-muted mb-4">
        <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
      </div>


      <v-alert v-if="totalAllowance?.gte(props.giveawaySettings.tokenQuantity)" type="success" dense outlined
        class="mb-4">
        You have sufficient allowance to start the giveaway.
      </v-alert>

      <div v-else class="text-muted mb-4">
        <p>
          You need to grant an additional
          <strong> {{ new BigNumber(props.giveawaySettings.tokenQuantity).minus(new BigNumber(totalAllowance ||
            0)) }}
          </strong>
          tokens to meet the requirement.
        </p>
        <v-btn color="primary" @click="grantAdditionalAllowance" class="mt-2">
          Grant Additional Allowance
        </v-btn>
      </div>

      <v-divider></v-divider>

      <h1>GALA Token Requirements</h1>

      <div v-if="giveawayGalaBalance" class="text-muted mb-4">
        <p>You have a balance of <strong>{{ giveawayGalaBalance }}</strong> tokens in the giveaway wallet for fees.
        </p>
      </div>
      <div v-else class="text-muted mb-4">
        <p>You have no GALA in the giveaway wallet for fees, but need an estimated {{ estimateGalaFees() }}</p>
      </div>

      <v-alert v-if="giveawayGalaBalance?.gte(estimateGalaFees())" type="success" dense outlined class="mb-4">
        You have sufficient balance to start the giveaway.
      </v-alert>

      <div class="text-muted mb-4" v-else-if="
        estimateGalaFees().plus(1).minus(new BigNumber(giveawayGalaBalance || 0)).minus(galaBalance ||
          0).gt(0)">
        <p>
          <strong>
            Your personal balance of GALA is {{ galaBalance }}. Get more at <a :href="galaConnectURL" target="_blank"
              style="color: #ffffff; text-decoration: underline;">Gala
              Connect</a>
          </strong>
        </p>
      </div>

      <div v-else class="text-muted mb-4">
        <p>
          You need to transfer an additional
          <strong>{{ estimateGalaFees().minus(new BigNumber(giveawayGalaBalance || 0))
            }}</strong>
          tokens to meet the requirement.
        </p>



        <v-btn color="primary" @click="transferGala" class="mt-2">
          Transfer GALA
        </v-btn>
        <v-tooltip>
          <template #activator="{ props }">
            <v-icon small v-bind="props" class="ml-2">mdi-information-outline</v-icon>
          </template>
          <span>
            One GALA will be burned as a transfer fee, so {{ estimateGalaFees().plus(1) }} GALA total is required
          </span>
        </v-tooltip>

      </div>

      <v-btn @click="loadBalances" color="primary" class="mt-6">
        Refresh
      </v-btn>

      <div v-if="giveawayWallet" class="text-muted mt-8">
        <p>All allowances and balances are granted to the giveaway wallet: <strong>{{ giveawayWallet }}</strong></p>
      </div>
    </v-form>
  </v-container>
</template>



<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GetGiveawayBalances, getProfile } from '@/services/BackendApi'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import {
  type TokenClassKeyProperties
} from '@gala-chain/api'
import { ref, watch, type PropType, type Ref } from 'vue'
import type { GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { GALA } from '@/utils/constants';

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
const tokenService = GalaChainApi.getInstance()
const galaConnectURL = import.meta.env.VITE_GALA_CONNECT_URL

const emit = defineEmits<{
  (e: 'form-valid', payload: { stepNumber: number; isComplete: boolean }): void
}>()

function estimateGalaFees() {
  return BigNumber(props.giveawaySettings.winners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
}
const { showToast } = useToast()
const totalAllowance: Ref<BigNumber | undefined> = ref()
const giveawayGalaBalance: Ref<BigNumber | undefined> = ref()
const browserClient = new BrowserConnectClient()
const giveawayWallet = ref();
const galaBalance: Ref<BigNumber | undefined> = ref()


async function grantAdditionalAllowance() {
  await browserClient.connect()
  const profile = await getProfile(browserClient.galaChainAddress)
  if (!profile.giveawayWalletAddress) {
    showToast(`Unable to get giveway wallet`, true)
    return
  }
  if (!props.giveawaySettings.tokenQuantity) {
    showToast('Unable to find the token quantity, please make sure it is set in step 2!', true)
    return
  }
  await tokenService.init()
  if (!props.tokenClassKey) {
    showToast('Please select a token at step 1!')
  } else {
    try {

      const grant = await tokenService.grantAllowance(
        props.tokenClassKey,
        new BigNumber(props.giveawaySettings.tokenQuantity).minus(new BigNumber(totalAllowance.value || 0)),
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

async function transferGala() {
  await browserClient.connect()
  const profile = await getProfile(browserClient.galaChainAddress)
  if (!profile.giveawayWalletAddress) {
    showToast(`Unable to get giveway wallet`, true)
    return
  }
  await tokenService.init()
  if (!props.tokenClassKey) {
    showToast('Please select a token at step 1!')
  } else {
    try {
      const grant = await tokenService.transferGALA(
        estimateGalaFees().minus(giveawayGalaBalance.value || 0),
        profile.giveawayWalletAddress
      )
      if (grant.Status === 1) {
        // Success!
        showToast('GALA sent!')
        await loadBalances()
      }
    } catch (e: unknown) {
      let errorMessage = 'unknown error';

      if (isErrorWithMessage(e)) {
        errorMessage = e.Message
      }

      console.error(errorMessage)
      showToast(`Unable to transfer GALA. Error: ${errorMessage}`, true);
    }
  }
}

function isErrorWithMessage(error: unknown): error is { Message: string } {
  return typeof error === 'object' && error !== null && 'Message' in error;
}

async function loadBalances() {
  try {
    isLoading.value = true;
    await browserClient.connect()

    const profile = await getProfile(browserClient.galaChainAddress)
    await tokenService.init()

    if (!profile || !profile.galaChainAddress) {
      showToast('Unable to get admin wallet info', true)
      return
    }

    const balances = await tokenService.getBalances(browserClient.galaChainAddress, GALA);
    const balance = balances.Data.reduce((total, item) => {
      return total.plus(item.quantity);
    }, new BigNumber(0));

    galaBalance.value = balance;
    const response = await GetGiveawayBalances(props.tokenClassKey, profile.galaChainAddress)
    giveawayWallet.value = response?.giveawayWallet;
    totalAllowance.value = BigNumber(response?.allowances.totalQuantity || 0)
    giveawayGalaBalance.value = BigNumber(response?.balances || 0)
  } catch (e: any) {
    showToast(e.message || 'An error occured', true)
    console.warn(e)
  } finally {
    isLoading.value = false
  }
}

watch(
  [() => Number(props.giveawaySettings.tokenQuantity), totalAllowance, () => Number(props.giveawaySettings.winners), galaBalance],
  ([tokenQuantity, totalAllowance, winners, galaBalance]) => {
    if (tokenQuantity && (totalAllowance >= tokenQuantity || 0) && galaBalance?.gt(estimateGalaFees())) {
      emit('form-valid', { stepNumber: 3, isComplete: true })
    } else {
      emit('form-valid', { stepNumber: 3, isComplete: false })
    }
  }
)
loadBalances()
</script>
