<template>
  <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
    <div style="width: 100%; max-width: 670px; height: 100%">

      <!-- <GiveawayAuthPrompt v-if="!connectedEthAddress || !connectedUserGCAddress" /> -->

      <div v-if="connectedEthAddress && connectedUserGCAddress" style="width: 100%; height: 100%;">

        <h2 class="mb-4 mt-16">Create giveaway</h2>
        <p class="paragraph-small-regular mb-10" style="color: rgba(255, 255, 255, 0.6);">Est. 15min</p>
        <StepProgress :current-step="currentStep" :steps=steps class="mb-10">

        </StepProgress>

        <div style="width: 100%">
          <!-- Step 1: Select Token -->
          <GiveawayDetails v-if="currentStep === 0" @is-valid="handleValidityChange($event, 0)"></GiveawayDetails>


          <!-- Step 2: Giveaway Settings -->
          <div v-if="currentStep === 1">
            <SettingsStep @is-valid="handleValidityChange($event, 1)"></SettingsStep>
          </div>

          <!-- Step 3-->
          <div v-if="currentStep === 2">
            <AllowanceStep @is-valid="handleValidityChange($event, 2)"></AllowanceStep>
          </div>

          <div v-if="currentStep === 3">
            <ReviewStep @is-valid="handleValidityChange($event, 3)"></ReviewStep>
          </div>
        </div>

        <div class="stepper-actions">
          <StyledButton v-if="currentStep === 0" @click="cancel">
            <span style="color: rgba(255, 255, 255, 1)">Cancel</span>
          </StyledButton>
          <StyledButton v-else :class="['NextButton', { enabled: allowPrevious(currentStep) }]" v-if="currentStep < 4"
            :disabled="!allowPrevious(currentStep)" @click="prevStep">
            <span v-if="currentStep === 3">Previous</span>
            <span v-else>Back</span>
          </StyledButton>

          <StyledButton :class="['NextButton', { enabled: allowNext(currentStep) }]" v-if="currentStep < 3"
            :disabled="!allowNext(currentStep)" @click="nextStep">
            Next
          </StyledButton>
          
          <StyledButton v-if="currentStep === 3" :class="['PublishButton', { enabled: allowNext(currentStep) }]"
            :disabled="!allowNext(currentStep)" @click="launchGiveaway">
            Publish
          </StyledButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import TokenInput from '@/components/TokenInput.vue'
import { GalaChainApi } from '@/services/GalaChainApi'
import { useToast } from '@/composables/useToast'
import { startGiveaway } from '@/services/BackendApi'
import { GiveawayTokenType, type GiveawaySettingsDto, type StartBasicGivewaySettingsDto } from '@/utils/types'
import { BrowserConnectClient, GalaChainResponseError, TokenBalance } from '@gala-chain/connect'
import type BigNumber from 'bignumber.js'
import type { Transaction } from '@/services/GalaSwapApi'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { useProfileStore } from '@/stores/profile'
import { useCreateGiveawayStore } from '@/stores/createGiveaway'
import { storeToRefs } from 'pinia'
import Web3Button from '@/components/Web3Button.vue'
import StepProgress from '@/components/StepProgress.vue'
import StyledButton from '@/components/StyledButton.vue'
import GiveawayDetails from './GiveawayDetails.vue'
import SettingsStep from '@/components/SettingsStep.vue'
import AllowanceStep from '@/components/AllowanceStep.vue'
import ReviewStep from '@/components/ReviewStep.vue'
import GiveawayAuthPrompt from '@/components/GiveawayAuthPrompt.vue'


const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)
const showCustomInput = ref(false)
const router = useRouter()

const profileStore = useProfileStore();
const giveawayStore = useCreateGiveawayStore();
const { profile, isConnected, error, balances, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)
const { giveawaySettings } = storeToRefs(giveawayStore);

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

const steps = ['Details', 'Settings', 'Allowance', 'Review']

const stepsComplete: Ref<Record<number, boolean>> = ref({})



const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}


const handleValidityChange = (stepValid: boolean, stepNumber: number) => {
  console.log(`Step: ${stepNumber}, isValid: ${stepValid}`)
  if (stepValid) {
    markStepComplete(stepNumber)
  } else {
    resetStep(stepNumber)
  }
};

const currentStep = ref(0)

const burnTokenClass = ref<TokenClassKeyProperties>({
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none'
})
const { showToast } = useToast()

const tokenService = GalaChainApi.getInstance()

const totalSupply: Ref<BigNumber | null> = ref(null)
const maxSupply: Ref<BigNumber | null> = ref(null)
const tokenSelectLoading = ref(false);


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

function cancel() {
  router.push('/')
}

const allowNext = (currentPage: number) => {
  return currentPage < 4 && stepsComplete.value[currentPage]
}

const allowPrevious = (currentPage: number) => {
  return currentPage > 0
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

  if (signableSettings.giveawayToken) {
    signableSettings.giveawayToken = {
      collection: signableSettings.giveawayToken.collection,
      category: signableSettings.giveawayToken.category,
      type: signableSettings.giveawayToken.type,
      additionalKey: signableSettings.giveawayToken.additionalKey,
      instance: '0'
    };
  }

  const unsignedGiveaway = {
    ...signableSettings,
    ...(settings.startDateTime && { startDateTime: settings.startDateTime.toISOString() }),
  };

  if (settings.endDateTime) {
    unsignedGiveaway.endDateTime = settings.endDateTime.toISOString();
  } else{
    delete unsignedGiveaway.endDateTime;
  }

  const signedGiveaway = await connectClient.sign('StartGiveaway', unsignedGiveaway)

  try {
    const result = await startGiveaway(signedGiveaway as StartBasicGivewaySettingsDto)
    if (result?.success) {
      showToast('Giveaway launched!')
      
      // Reload balances after successful giveaway launch
      await profileStore.getBalances(true);
      await profileStore.fetchGiveaways()

      giveawayStore.$reset()
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
.NextButton.enabled {
  background-color: white;
  color: black;
}

.PublishButton.enabled {
  background-color: #E74C3C;
  color: white;
  border-radius: 24px;
  padding: 10px 30px;
}

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