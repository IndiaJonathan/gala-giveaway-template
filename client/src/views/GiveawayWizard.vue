<template>
  <div>
    <v-stepper v-model="currentStep">
      <!-- Stepper Header -->
      <v-stepper-header>
        <v-stepper-item :complete="stepsComplete[1]" :value="1"> Select Token </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[2]" :value="2"> Giveaway Settings </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[3]" :value="3"> Grant Allowance </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[4]" :value="4"> Launch Giveaway </v-stepper-item>
      </v-stepper-header>

      <!-- Stepper Content -->
      <v-stepper-window>
        <!-- Step 1: Select Token -->
        <v-stepper-window-item :value="1">
          <TokenInput ref="tokenInputRef" v-model:tokenClass="tokenClass" :showQuantity="false" />
          <v-row no-gutters>
            <v-btn :disabled="stepsComplete[1]" color="success" @click="selectToken" :loading="tokenSelectLoading">
              <div v-if="stepsComplete[1]">
                <template v-if="stepsComplete[1]">
                  <v-icon left>mdi-check</v-icon>
                  Token Selected
                </template>
              </div>
              <template v-else> Select Token </template>
            </v-btn>
            <v-spacer></v-spacer>
            <div v-if="totalSupply !== null && maxSupply !== null && stepsComplete[1]">
              <p>Total Supply: {{ totalSupply }} Max Supply: {{ maxSupply }}</p>
            </div>
          </v-row>
        </v-stepper-window-item>

        <!-- Step 4: Giveaway Settings -->
        <v-stepper-window-item :value="2">
          <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="tokenClass"
            :giveaway-settings="giveawaySettings" />
        </v-stepper-window-item>

        <!-- Step 2: Grant Allowance -->
        <v-stepper-window-item :value="3">
          <AdminBalanceGrant @form-valid="stepChanged" :token-class-key="tokenClass"
            :giveaway-settings="giveawaySettings">
          </AdminBalanceGrant>
        </v-stepper-window-item>

        <v-stepper-window-item :value="4">
          <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="tokenClass"
            :giveaway-settings="giveawaySettings" read-only />
          <v-btn color="success" @click="launchGiveaway">Launch Giveaway</v-btn>
        </v-stepper-window-item>
      </v-stepper-window>

      <div class="stepper-actions">
        <v-btn color="primary" :disabled="!allowPrevious(currentStep)" @click="prevStep">
          <v-icon>mdi-chevron-left</v-icon> Back
        </v-btn>

        <v-btn color="primary" v-if="currentStep < 4" :disabled="!allowNext(currentStep)" @click="nextStep">
          Next
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </v-stepper>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import TokenInput from '@/components/TokenInput.vue'
import { type TokenClassKeyProperties } from '@gala-chain/api'
import { GalaChainApi } from '@/services/GalaChainApi'
import { useToast } from '@/composables/useToast'
import { startGiveaway } from '@/services/BackendApi'
import GiveawaySettings from '@/components/GiveawaySettings.vue'
import AdminBalanceGrant from '@/components/AdminBalanceGrant.vue'
import type { FullGiveawayDto, GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient, GalaChainResponseError } from '@gala-chain/connect'
import type BigNumber from 'bignumber.js'
const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)

const router = useRouter()

const stepsComplete: Ref<Record<number, boolean>> = ref({})

const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}


const currentStep = ref(1)

const tokenClass = ref<TokenClassKeyProperties>({
  collection: '',
  category: '',
  type: '',
  additionalKey: ''
})

const burnTokenClass = ref<TokenClassKeyProperties>({
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none'
})
const { showToast } = useToast()

const giveawaySettings = ref<GiveawaySettingsDto>({
  endDateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
  winners: undefined,
  tokenQuantity: undefined,
  telegramAuthRequired: false,
  requireBurnTokenToClaim: false,
  burnToken: burnTokenClass.value,
  burnTokenQuantity: '1'
})
const tokenService = GalaChainApi.getInstance()

let selectedToken: TokenClassKeyProperties | null = null
const totalSupply: Ref<BigNumber | null> = ref(null)
const maxSupply: Ref<BigNumber | null> = ref(null)
const tokenSelectLoading = ref(false);

async function selectToken() {
  tokenSelectLoading.value = true;
  await tokenService.init()

  const isValid = await tokenInputRef.value?.validate()
  if (isValid.valid) {
    try {
      const { tokenClassDto, tokenClassResponse } = await tokenService.fetchTokenClasses(tokenClass)
      if (
        tokenClassResponse.Status === 1 &&
        tokenClassResponse.Data &&
        tokenClassResponse.Data[0]
      ) {
        selectedToken = tokenClassDto
        maxSupply.value = (tokenClassResponse).Data[0].maxSupply
        totalSupply.value = (tokenClassResponse).Data[0].totalSupply
        markStepComplete(1)
      }
    } catch (e: any) {
      resetStep(1)
      selectedToken = null
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
  if (currentStep.value < 5) {
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

async function launchGiveaway() {
  const settings = giveawaySettings.value
  const selectedToken = tokenClass

  const connectClient = new BrowserConnectClient()
  await connectClient.connect()

  if (settings.endDateTime && settings.tokenQuantity && settings.winners) {
    const unsignedGiveaway: FullGiveawayDto = {
      giveawayToken: selectedToken.value,
      tokenQuantity: settings.tokenQuantity,
      winnerCount: settings.winners,
      endDateTime: settings.endDateTime.toISOString(),
      telegramAuthRequired: settings.telegramAuthRequired || false,
      requireBurnTokenToClaim: settings.requireBurnTokenToClaim,
      ...(settings.requireBurnTokenToClaim && {
        burnTokenQuantity: settings.burnTokenQuantity,
        burnToken: settings.burnToken,
      }),
    }
    const signedGiveaway = await connectClient.sign('StartGiveaway', unsignedGiveaway)

    console.log(settings.endDateTime)
    try {
      const result = await startGiveaway(signedGiveaway)
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
}
</script>

<style scoped>
.stepper-actions {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
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
</style>
