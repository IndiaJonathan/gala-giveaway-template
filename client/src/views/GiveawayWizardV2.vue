<template>
  <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
    <div style="width: 100%; max-width: 670px; height: 100%">

      <div v-if="!connectedEthAddress || !connectedUserGCAddress" style="width: 100%; text-align: center;">
        <h1>Start A Giveaway</h1>
        {{ connectedEthAddress }} {{ connectedUserGCAddress }}
        <Web3Button color="success" @click="profileStore.connect"
          primary-text="Sign in With your Web3 Wallet To Continue"></Web3Button>
      </div>

      <div v-else style="width: 100%; height: 100%;">

        <h2>Create giveaway</h2>
        <p class="paragraph-small-regular" style="color: rgba(255, 255, 255, 0.6);">Est. 15min</p>
        <StepProgress :current-step="currentStep" :steps=steps>

        </StepProgress>

        <div style="width: 100%">
          <!-- Step 1: Select Token -->
          <div v-if="currentStep === 0">
            <TokenSelect style="margin-bottom: 40px;"></TokenSelect>
            <WinnerSelector></WinnerSelector>
          </div>


          <!-- Step 2: Giveaway Settings -->
          <div v-if="currentStep === 1">
            <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="giveawaySettings.giveawayToken"
              :giveaway-settings="giveawaySettings" />
          </div>

          <!-- Step 3-->
          <div v-if="currentStep === 2">
            <!--  Grant Allowance (For allowance based giveaways)-->
            <AdminBalanceGrant @form-valid="stepChanged" :token-class-key="giveawaySettings.giveawayToken"
              :giveaway-settings="giveawaySettings">
            </AdminBalanceGrant>
          </div>

          <div v-if="currentStep === 3">
            <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="giveawaySettings.giveawayToken"
              :giveaway-settings="giveawaySettings" read-only />
            <v-btn color="success" @click="launchGiveaway">Launch Giveaway</v-btn>
          </div>
        </div>

        <div class="stepper-actions">
          <StyledButton  v-if="currentStep < 4" :disabled="!allowNext(currentStep)" @click="nextStep">
            Cancel
          </StyledButton>


          <!-- <v-btn color="primary" :disabled="!allowPrevious(currentStep)" @click="prevStep">
            <v-icon>mdi-chevron-left</v-icon> Back
          </v-btn> -->

          <StyledButton  v-if="currentStep < 4" :disabled="!allowNext(currentStep)" @click="nextStep">
            Next
          </StyledButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, type Ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import TokenInput from '@/components/TokenInput.vue'
import { GalaChainApi } from '@/services/GalaChainApi'
import { useToast } from '@/composables/useToast'
import { startGiveaway } from '@/services/BackendApi'
import GiveawaySettings from '@/components/GiveawaySettings.vue'
import AdminBalanceGrant from '@/components/AdminBalanceGrant.vue'
import { type GiveawaySettingsDto, type StartBasicGivewaySettingsDto } from '@/utils/types'
import { BrowserConnectClient, GalaChainResponseError, TokenApi, TokenBalance } from '@gala-chain/connect'
import type BigNumber from 'bignumber.js'
import UserBalances from '@/components/UserBalances.vue'
import UserAllowances from '@/components/UserAllowances.vue'
import type { Transaction } from '@/services/GalaSwapApi'
import { getConnectedAddress } from '@/utils/GalaHelper'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'
import Web3Button from '@/components/Web3Button.vue'
import StepProgress from '@/components/StepProgress.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import WinnerSelector from '@/components/WinnerSelector.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import StyledButton from '@/components/StyledButton.vue'


const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)
const showCustomInput = ref(false)
const router = useRouter()

const profileStore = useProfileStore();
const { profile, isConnected, error, balances, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

const steps = ['Details', 'Settings', 'Allowance', 'Review']

const stepsComplete: Ref<Record<number, boolean>> = ref({})

const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}



const currentStep = ref(0)

const burnTokenClass = ref<TokenClassKeyProperties>({
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none'
})
const { showToast } = useToast()

const giveawaySettings = ref<GiveawaySettingsDto>({
  endDateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
  telegramAuthRequired: false,
  requireBurnTokenToClaim: false,
  burnToken: burnTokenClass.value,
  burnTokenQuantity: '1',
  giveawayType: 'DistributedGiveway',
  giveawayToken: {
    collection: '',
    category: '',
    type: '',
    additionalKey: ''
  },
  giveawayTokenType: undefined
})
const tokenService = GalaChainApi.getInstance()

const totalSupply: Ref<BigNumber | null> = ref(null)
const maxSupply: Ref<BigNumber | null> = ref(null)
const tokenSelectLoading = ref(false);


async function handleBalanceClick(item: TokenBalance) {
  giveawaySettings.value.giveawayToken = { additionalKey: item.additionalKey, category: item.category, collection: item.collection, type: item.type }
  giveawaySettings.value.giveawayTokenType = 'Balance'
  await selectToken();

  markStepComplete(1)
}

async function selectToken() {
  tokenSelectLoading.value = true;
  await tokenService.init()

  let isValid;
  if (showCustomInput.value) {
    isValid = tokenInputRef.value ? await tokenInputRef.value.validate() : { valid: false };
  } else {
    isValid = { valid: true };
  }

  if (isValid.valid) {
    try {
      const { tokenClassDto, tokenClassResponse } = await tokenService.fetchTokenClasses(giveawaySettings.value.giveawayToken)
      if (
        tokenClassResponse.Status === 1 &&
        tokenClassResponse.Data &&
        tokenClassResponse.Data[0]
      ) {
        maxSupply.value = (tokenClassResponse).Data[0].maxSupply
        totalSupply.value = (tokenClassResponse).Data[0].totalSupply
        markStepComplete(1)
      }
    } catch (e: any) {
      resetStep(1)
      if (e instanceof GalaChainResponseError) {
        showToast(e.Message || 'Unable to get token class', true)
      } else {
        showToast(e.message || 'Unable to get token class', true)

      }

    }

  }
  tokenSelectLoading.value = false;

}


async function selectProjectToken(transaction: Transaction) {
  giveawaySettings.value.giveawayToken = transaction.tokenDetails.tokenClass
  giveawaySettings.value.giveawayTokenType = 'Allowance'
  await selectToken();
}
// Navigation functions
function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value += 1
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

const allowNext = (currentPage: number) => {
  return currentPage < 4 && stepsComplete.value[currentPage]
}

const allowPrevious = (currentPage: number) => {
  return currentPage > 1
}

function updateGiveawaySettingsValidity(formIsValid: boolean) {
  if (formIsValid) {
    markStepComplete(2)
  } else {
    resetStep(2)
  }
}

function stepChanged(payload: { stepNumber: number; isComplete: boolean }) {
  if (payload.isComplete) {
    markStepComplete(payload.stepNumber)
  } else {
    resetStep(payload.stepNumber)
  }
}

function deselectToken() {
  resetStep(1)
}

async function launchGiveaway() {
  const settings = giveawaySettings.value

  const connectClient = new BrowserConnectClient()
  await connectClient.connect()

  const signableSettings = { ...settings } as any;
  if (!settings.requireBurnTokenToClaim) {
    delete signableSettings.burnToken
    delete signableSettings.burnTokenQuantity
  }
  const unsignedGiveaway = {
    ...signableSettings,
    ...(settings.endDateTime && { endDateTime: settings.endDateTime.toISOString() }),
  };

  const signedGiveaway = await connectClient.sign('StartGiveaway', unsignedGiveaway)

  try {
    const result = await startGiveaway(signedGiveaway as StartBasicGivewaySettingsDto)
    if (result?.success) {
      showToast('Giveaway launched!')
      router.push('/')
    } else {
      console.log(result)
      showToast(`Failed to launch giveaway. ${result?.message}`, true)
    }
  } catch (e: any) {
    console.warn(e)
    showToast(`Failed to launch giveaway. ${e.message || ''}`, true)
  }
}

</script>

<style scoped>
.stepper-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
  margin-top: 32px;
}

.stepper-actions .v-btn {
  margin: 0 10px;
}

.stepper-actions .v-btn.icon {
  flex-grow: 1;
}

.stepper-actions .v-btn[disabled] {
  opacity: 0.5;
  /* Make disabled buttons less prominent */
}

.v-stepper-header .v-stepper-item .v-stepper-item__icon {
  display: none;
}


/* Custom styles for stepper item */
.custom-stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Text below the dot */
.step-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 8px;
}

.step-label span {
  font-size: 14px;
  color: white;
}

/* Adjust dot icon position */
.step-label v-icon {
  font-size: 24px;
  color: #9e9e9e;
}

/* Active and completed styles */
.step-label.active v-icon {
  color: #00bcd4;
}

.step-label.completed v-icon {
  color: #4caf50;
}

.v-avatar {
  display: none !important;
  width: 0px;
  height: 0px;
}
</style>