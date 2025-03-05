<!-- <template>
  <v-container>
    <div v-if="isLoading" class="text-center my-8">
      <v-progress-circular indeterminate size="48"></v-progress-circular>
    </div>

    <v-form v-else-if="!isLoading">

      <div v-if="giveawayBalanceData">


        <h1>Giveaway Token Requirements</h1>


        <div v-if="giveawayBalanceData.detailsType === 'Allowance' &&
          giveawaySettings.giveawayTokenType === 'Allowance'">
          <AllowanceCheck :giveaway-settings="giveawaySettings"
            :granted-allowance-quantity="BigNumber(giveawayBalanceData.allowances.totalQuantity)"
            :required-amount="requiredTokenAmount" v-on:allowance-granted="loadBalances"></AllowanceCheck>
        </div>
        <div
          v-else-if="giveawayBalanceData.detailsType === 'Balance' && giveawaySettings.giveawayTokenType === 'Balance'">
          <BalanceCheck :giveaway-settings="giveawaySettings"
            :admin-balance-quantity="BigNumber(giveawayBalanceData.tokenBalance)" :required-amount="requiredTokenAmount"
            v-on:token-transfered="loadBalances">
          </BalanceCheck>
        </div>

        <v-divider></v-divider>

        <h1>GALA Token Requirements</h1>

        <div v-if="giveawayBalanceData?.galaBalance" class="text-muted mb-4">
          <p>You have a balance of <strong>{{ giveawayBalanceData.galaBalance }}</strong> tokens in the giveaway wallet
            for
            fees.
          </p>
        </div>
        <div v-else class="text-muted mb-4">
          <p>You have no GALA in the giveaway wallet for fees, but need an estimated {{ getGalaCost(giveawayBalanceData)
            }}</p>
        </div>

        <v-alert v-if="BigNumber(giveawayBalanceData?.galaBalance).gte(getGalaCost(giveawayBalanceData))" type="success"
          dense outlined class="mb-4">
          You have sufficient balance to start the giveaway.
        </v-alert>




        <div class="text-muted mb-4" v-else-if="
          getGalaCost(giveawayBalanceData).plus(1).minus(new BigNumber(giveawayBalanceData?.galaBalance || 0)).minus(personalGalaBalance ||
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
            <strong>{{ getGalaCost(giveawayBalanceData).minus(new BigNumber(giveawayBalanceData.galaBalance || 0))
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
              One GALA will be burned as a transfer fee, so {{
                getGalaCost(giveawayBalanceData).plus(1).minus(giveawayBalanceData.galaBalance) }} GALA total is required
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
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import { computed, ref, watch, type PropType, type Ref } from 'vue'
import { getRequiredAmountForFCFS, type GiveawayDetails, type GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { GALA } from '@/utils/constants';
import { BadRequestError } from '@tonconnect/sdk';
import AllowanceCheck from '@/components/AllowanceCheck.vue'
import { isErrorWithMessage } from '@/utils/Helpers';
import BalanceCheck from './BalanceCheck.vue';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';

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
  if (props.giveawaySettings.giveawayType === 'DistributedGiveaway') {
    return BigNumber(props.giveawaySettings.maxWinners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
  } else if (props.giveawaySettings.giveawayType === 'FirstComeFirstServe') {
    return BigNumber(props.giveawaySettings.maxWinners || 1)
  } else {
    throw new BadRequestError(`Unknown giveaway type`)
  }
}
const { showToast } = useToast()
const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

const personalGalaBalance: Ref<BigNumber | undefined> = ref()

function ensureLoggedIn() {
  if (!profile || !profile.value) {
    showToast("Please Log In first!", true)
    throw Error("Not Logged In")
  }
  return profile.value;
}

const browserClient = new BrowserConnectClient()
const giveawayWallet = ref();
const requiredTokenAmount = computed(() => {
  switch (props.giveawaySettings.giveawayType) {
    case 'DistributedGiveaway':
      if (!props.giveawaySettings.tokenQuantity) {
        throw new Error('Token quantity not set')
      }
      return BigNumber(props.giveawaySettings.tokenQuantity);
    case 'FirstComeFirstServe':
      return getRequiredAmountForFCFS(props.giveawaySettings);
  }
})

async function transferGala() {
  const profile = ensureLoggedIn();
  await browserClient.connect()
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
      const transfer = await tokenService.transferToken(
        GALA,
        getGalaCost(giveawayBalanceData.value).minus(giveawayBalanceData.value.galaBalance).toString(),
        profile.giveawayWalletAddress
      )
      if (transfer.Status === 1) {
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

function getGalaCost(balanceData: GiveawayDetails) {
  let additional: BigNumber = BigNumber(0);
  if (props.giveawaySettings.giveawayTokenType === 'Balance') {
    additional = requiredTokenAmount.value;
  }
  return additional.plus(BigNumber(balanceData.currentGalaFeesNeeded).plus(estimateGalaFees()))
}



async function loadBalances() {
  try {
    const profile = ensureLoggedIn();

    isLoading.value = true;
    await browserClient.connect()

    await tokenService.init()

    if (!profile || !profile.galaChainAddress) {
      showToast('Unable to get admin wallet info', true)
      return
    }

    const GalaBalances = await tokenService.getBalances(browserClient.galaChainAddress, GALA);
    const balance = GalaBalances.Data.reduce((total, item) => {
      return total.plus(item.quantity);
    }, new BigNumber(0));


    personalGalaBalance.value = balance;

    if (props.giveawaySettings.giveawayTokenType === 'Allowance') {
      const response = await GetGiveawayAllowancesFromGiveaway({ ...props.giveawaySettings.giveawayToken, instance: '0' } as any, profile.galaChainAddress)
      giveawayBalanceData.value = response;
      giveawayWallet.value = response?.giveawayWallet;

      // const giveawayBalance = GalaBalances.Data.reduce((total, item) => {
      //   return total.plus(item.quantity);
      // }, new BigNumber(0));
    } else {
      //Is balance
      const response = await GetGiveawayBalances({ ...props.giveawaySettings.giveawayToken, instance: '0' } as any, profile.galaChainAddress)
      giveawayBalanceData.value = response;
      giveawayWallet.value = response?.giveawayWallet;
    }

  } catch (e: any) {
    showToast(e.message || 'An error occured', true)
    console.warn(e)
  } finally {
    isLoading.value = false
  }
}

watch(
  [requiredTokenAmount, giveawayBalanceData, props.giveawaySettings, personalGalaBalance],
  ([tokenQuantity, totalAllowance, winners, galaBalance]) => {
    let isComplete = false;
    if (requiredTokenAmount.value && giveawayBalanceData.value && galaBalance?.gt(estimateGalaFees())) {
      if (giveawayBalanceData.value.detailsType === 'Allowance' && props.giveawaySettings.giveawayTokenType === 'Allowance'
        && BigNumber(giveawayBalanceData.value.allowances.totalQuantity).gte(requiredTokenAmount.value)
      ) {
        isComplete = true;
      } else if (giveawayBalanceData.value.detailsType === 'Balance' && props.giveawaySettings.giveawayTokenType === 'Balance'
        && BigNumber(giveawayBalanceData.value.tokenBalance).gte(requiredTokenAmount.value)
      ) {
        isComplete = true;
      }
    }
    emit('form-valid', { stepNumber: 3, isComplete })

  }, { deep: true }
)
loadBalances()
</script> -->
<template>
  <div>
    <h1>Admin Balance Grant</h1>
  </div>
</template>