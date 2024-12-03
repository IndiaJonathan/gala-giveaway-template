<template>
  <v-container>
    <div v-if="isLoading" class="text-center my-8">
      <v-progress-circular indeterminate size="48"></v-progress-circular>
    </div>
    <v-alert v-if="!requiredAmount" type="info" class="mb-6">
      Please go back to Step 2 to set all required settings.
    </v-alert>

    <v-form v-else-if="!isLoading">

      <div v-if="giveawayBalanceData">


        <h1>Giveaway Token Requirements</h1>

        <div v-if="giveawayBalanceData?.allowances" class="text-muted mb-4">
          <p>You have a net allowance of <strong>{{ giveawayBalanceData.allowances.totalQuantity }}</strong> tokens
            allocated to the giveaway wallet.
          </p>
        </div>
        <div v-else class="text-muted mb-4">
          <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
        </div>


        <v-alert v-if="BigNumber(giveawayBalanceData?.allowances.totalQuantity || 0).gte(requiredAmount)" type="success"
          dense outlined class="mb-4">
          You have sufficient allowance to start the giveaway.
        </v-alert>

        <div v-else class="text-muted mb-4">
          <p>
            You need to grant an additional
            <strong> {{ requiredAmount.minus(new BigNumber(giveawayBalanceData?.allowances.totalQuantity ||
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

        <div v-if="giveawayBalanceData?.balances" class="text-muted mb-4">
          <p>You have a balance of <strong>{{ giveawayBalanceData.balances }}</strong> tokens in the giveaway wallet for
            fees.
          </p>
        </div>
        <div v-else class="text-muted mb-4">
          <p>You have no GALA in the giveaway wallet for fees, but need an estimated {{ getGalaCost(giveawayBalanceData) }}</p>
        </div>

        <v-alert v-if="BigNumber(giveawayBalanceData?.balances).gte(getGalaCost(giveawayBalanceData))" type="success" dense outlined
          class="mb-4">
          You have sufficient balance to start the giveaway.
        </v-alert>




        <div class="text-muted mb-4" v-else-if="
          getGalaCost(giveawayBalanceData).plus(1).minus(new BigNumber(giveawayBalanceData?.balances || 0)).minus(personalGalaBalance ||
            0).gt(0)">
          <p>
            <strong>
              Your personal balance of GALA is {{ personalGalaBalance }}. The giveaway wallet will need {{
                getGalaCost(giveawayBalanceData) }}.
              Get more at <a :href="galaConnectURL" target="_blank"
                style="color: #ffffff; text-decoration: underline;">Gala
                Connect</a>
            </strong>
          </p>
        </div>

        <div v-else class="text-muted mb-4">
          <p>
            You need to transfer an additional
            <strong>{{ getGalaCost(giveawayBalanceData).minus(new BigNumber(giveawayBalanceData.balances || 0))
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
              One GALA will be burned as a transfer fee, so {{ getGalaCost(giveawayBalanceData).plus(1).minus(giveawayBalanceData.balances) }} GALA total is required
            </span>
          </v-tooltip>

        </div>

        <v-btn @click="loadBalances" color="primary" class="mt-6">
          Refresh
        </v-btn>

        <div v-if="giveawayWallet" class="text-muted mt-8">
          <p>All allowances and balances are granted to the giveaway wallet: <strong>{{ giveawayWallet }}</strong></p>
        </div>
      </div>

      <div v-else>
        <p>
          Balances failed to load, reload?
        </p>
        <v-btn color="primary" @click="loadBalances">Load Balances</v-btn>
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
import { computed, ref, watch, type PropType, type Ref } from 'vue'
import { getRequiredAmountForFCFS, type GiveawayBalances, type GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { GALA } from '@/utils/constants';
import { BadRequestError } from '@tonconnect/sdk';

const props = defineProps({
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
  if (props.giveawaySettings.giveawayType === 'DistributedGiveway') {
    return BigNumber(props.giveawaySettings.maxWinners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
  } else if (props.giveawaySettings.giveawayType === 'FirstComeFirstServe') {
    return BigNumber(props.giveawaySettings.maxWinners || 1)
  } else {
    throw new BadRequestError(`Unknown giveaway type`)
  }
}
const { showToast } = useToast()
const giveawayBalanceData: Ref<GiveawayBalances | undefined> = ref()
const personalGalaBalance: Ref<BigNumber | undefined> = ref()
// const totalAllowance: Ref<BigNumber | undefined> = ref()
// const giveawayGalaBalance: Ref<BigNumber | undefined> = ref()
const browserClient = new BrowserConnectClient()
const giveawayWallet = ref();
// const galaBalance: Ref<BigNumber | undefined> = ref()
const requiredAmount = computed(() => {
  switch (props.giveawaySettings.giveawayType) {
    case 'DistributedGiveway':
      if (!props.giveawaySettings.tokenQuantity) {
        return null;
      }
      return BigNumber(props.giveawaySettings.tokenQuantity);
    case 'FirstComeFirstServe':
      return getRequiredAmountForFCFS(props.giveawaySettings);
  }
})

async function grantAdditionalAllowance() {
  await browserClient.connect()
  const profile = await getProfile(browserClient.galaChainAddress)
  if (!profile.giveawayWalletAddress) {
    showToast(`Unable to get giveaway wallet`, true)
    return
  }
  if (!giveawayBalanceData.value) {
    showToast(`Please reload balance data`, true)
    return
  }

  await tokenService.init()
  if (!props.giveawaySettings.giveawayToken) {
    showToast('Please select a token at step 1!')
  } else {
    const reqAmount = requiredAmount.value;
    if (!reqAmount) {
      showToast('Unable to find the token quantity, please make sure it is set in step 2!', true)
      return
    }
    try {

      const grant = await tokenService.grantAllowance(
        props.giveawaySettings.giveawayToken,
        reqAmount.minus(new BigNumber(giveawayBalanceData.value.allowances.totalQuantity || 0)),
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
  if (!giveawayBalanceData.value) {
    showToast(`Please reload balance data`, true)
    return
  }
  if (!profile.giveawayWalletAddress) {
    showToast(`Unable to get giveway wallet`, true)
    return
  }
  await tokenService.init()
  if (!props.giveawaySettings.giveawayToken) {
    showToast('Please select a token at step 1!')
  } else {
    try {
      const grant = await tokenService.transferGALA(
        getGalaCost(giveawayBalanceData.value).minus(giveawayBalanceData.value.balances),
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

function getGalaCost(balanceData: GiveawayBalances) {
  return BigNumber(balanceData.currentGalaFeesNeeded).plus(estimateGalaFees())
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

    personalGalaBalance.value = balance;
    const response = await GetGiveawayBalances(props.giveawaySettings.giveawayToken, profile.galaChainAddress)
    giveawayBalanceData.value = response;
    giveawayWallet.value = response?.giveawayWallet;
  } catch (e: any) {
    showToast(e.message || 'An error occured', true)
    console.warn(e)
  } finally {
    isLoading.value = false
  }
}

watch(
  [requiredAmount, giveawayBalanceData, props.giveawaySettings, personalGalaBalance],
  ([tokenQuantity, totalAllowance, winners, galaBalance]) => {
    if (tokenQuantity && totalAllowance && (BigNumber(giveawayBalanceData.value?.allowances.totalQuantity || 0).gte(tokenQuantity)) && galaBalance?.gt(estimateGalaFees())) {
      console.log("form-valid")
      emit('form-valid', { stepNumber: 3, isComplete: true })
    } else {
      console.log("form-invalid")
      emit('form-valid', { stepNumber: 3, isComplete: false })
    }
  }, { deep: true }
)
loadBalances()
</script>
