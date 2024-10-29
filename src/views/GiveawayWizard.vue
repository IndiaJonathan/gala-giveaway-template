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
            <v-btn :disabled="stepsComplete[1]" color="success" @click="selectToken">
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
          <GiveawaySettings
            @form-valid="updateGiveawaySettingsValidity"
            :token-class="tokenClass"
            :giveaway-settings="giveawaySettings"
          />
        </v-stepper-window-item>

        <!-- Step 2: Grant Allowance -->
        <v-stepper-window-item :value="3">
          <AdminBalanceGrant
            @form-valid="stepChanged"
            :token-class-key="tokenClass"
            :giveaway-settings="giveawaySettings"
          ></AdminBalanceGrant>
        </v-stepper-window-item>

        <v-stepper-window-item :value="4">
          <GiveawaySettings
            @form-valid="updateGiveawaySettingsValidity"
            :token-class="tokenClass"
            :giveaway-settings="giveawaySettings"
            read-only
          />
          <v-btn color="success" @click="launchGiveaway">Launch Giveaway</v-btn>
        </v-stepper-window-item>
      </v-stepper-window>

      <div class="stepper-actions">
        <v-btn color="primary" :disabled="!allowPrevious(currentStep)" @click="prevStep">
          <v-icon>mdi-chevron-left</v-icon> Back
        </v-btn>

        <v-btn
          color="primary"
          v-if="currentStep < 4"
          :disabled="!allowNext(currentStep)"
          @click="nextStep"
        >
          Next
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </v-stepper>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, reactive, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AllowanceCheck from '@/components/AllowanceCheck.vue'
import ViewAdminBalances from '@/components/ViewAdminBalances.vue'
import TokenInput from '@/components/TokenInput.vue'
import type { TokenClassBody, TokenClassKey } from '@gala-chain/api'
import { GalaChainApi } from '@/services/GalaChainApi'
import { useToast } from '@/composables/useToast'
import { startGiveaway } from '@/services/BackendApi'
import GiveawaySettings from '@/components/GiveawaySettings.vue'
import AdminBalanceGrant from '@/components/AdminBalanceGrant.vue'
import type { FullGiveawayDto, GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)

const router = useRouter()

const stepsComplete: Ref<Record<number, boolean>> = ref({})

const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}

// Props from route
const props = defineProps<{
  tokenClass: string
}>()

const currentStep = ref(1)
const tokenKey = ref(props.tokenClass || '')
const availableQuantity = ref(0) // You might fetch this based on the tokenKey

const tokenClass = reactive<TokenClassBody>({
  collection: 'MyCollection',
  category: 'Art4',
  type: 'UniqueArtToken',
  additionalKey: 'Rare'
})
const { showToast } = useToast()

const giveawaySettings = ref<GiveawaySettingsDto>({
  endDateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
  winners: undefined,
  tokenQuantity: undefined,
  telegramAuthRequired: false
})
const tokenService = GalaChainApi.getInstance()

let selectedToken: TokenClassKey | null = null
const totalSupply: Ref<number | null> = ref(null)
const maxSupply: Ref<number | null> = ref(null)

async function selectToken() {
  await tokenService.init()

  const isValid = await tokenInputRef.value?.validate()
  if (isValid.valid) {
    const { tokenClassDto, tokenClassResponse } = await tokenService.fetchTokenClasses(tokenClass)
    if (
      (tokenClassResponse as any).Status === 1 &&
      (tokenClassResponse as any).Data &&
      (tokenClassResponse as any).Data[0]
    ) {
      selectedToken = tokenClassDto
      maxSupply.value = (tokenClassResponse as any).Data[0].maxSupply
      totalSupply.value = (tokenClassResponse as any).Data[0].totalSupply
      markStepComplete(1)
    } else {
      resetStep(1)
      selectedToken = null
      showToast((tokenClassResponse as any).message || 'Unable to get token class', true)
    }
  }
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

  console.log('fooooo')
  if (settings.endDateTime && settings.tokenQuantity && settings.winners) {
    const unsignedGiveaway: FullGiveawayDto = {
      giveawayToken: selectedToken,
      tokenQuantity: settings.tokenQuantity,
      winnerCount: settings.winners,
      endDateTime: settings.endDateTime.toISOString(),
      telegramAuthRequired: settings.telegramAuthRequired || false
    }
    const signedGiveaway = await connectClient.sign('StartGiveaway', unsignedGiveaway as any)

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
  opacity: 0.5; /* Make disabled buttons less prominent */
}
</style>
