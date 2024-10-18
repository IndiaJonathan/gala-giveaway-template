<template>
  <div>
    <v-stepper v-model="currentStep">
      <!-- Stepper Header -->
      <v-stepper-header>
        <v-stepper-item :complete="stepsComplete[1]" :value="1"> Select Token </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[2]" :value="2"> Giveaway Settings </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[3]" :value="3"> Grant Allowance </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[4]" :value="4"> Allowance Check </v-stepper-item>
        <v-stepper-item :value="5"> Launch Giveaway </v-stepper-item>
      </v-stepper-header>

      <!-- Stepper Content -->
      <v-stepper-window>
        <!-- Step 1: Select Token -->
        <v-stepper-window-item :value="1">
          <TokenInput ref="tokenInputRef" v-model:tokenClass="tokenClass" :showQuantity="false" />
          <v-row no-gutters>
            <v-btn :disabled="stepsComplete[1]" color="success" @click="selectToken">
              <template v-if="stepsComplete[1]">
                <v-icon left>mdi-check</v-icon>
                Token Selected
              </template>
              <template v-else> Select Token </template>
            </v-btn>
          </v-row>
        </v-stepper-window-item>

        <!-- Step 4: Giveaway Settings -->
        <v-stepper-window-item :value="2">
          <GiveawaySettings
            @form-valid="updateGiveawaySettingsValidity"
            :token-class="tokenClass"
            @settings-completed="nextStep"
            :giveaway-settings="giveawaySettings"
          />
        </v-stepper-window-item>

        <!-- Step 2: Grant Allowance -->
        <v-stepper-window-item :value="3">
          <AdminBalanceGrant :token-class-key="tokenClass"></AdminBalanceGrant>
        </v-stepper-window-item>

        <!-- Step 3: Allowance Check -->
        <v-stepper-window-item :value="4">
          <AllowanceCheck :token-key="tokenKey" :available-quantity="availableQuantity" />
        </v-stepper-window-item>

        <!-- Step 5: Launch Giveaway -->
        <v-stepper-window-item :value="5">
          <!-- <LaunchGiveaway :settings="giveawaySettings" /> -->
        </v-stepper-window-item>
      </v-stepper-window>

      <div class="stepper-actions">
        <v-btn color="primary" :disabled="!allowPrevious(currentStep)" @click="prevStep">
          <v-icon>mdi-chevron-left</v-icon> Back
        </v-btn>

        <v-btn color="primary" :disabled="!allowNext(currentStep)" @click="nextStep">
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
import type { TokenClassKey, TokenClassKeyBody } from '@gala-chain/api'
import { GalaChainApi } from '@/services/GalaChainApi'
import { useToast } from '@/composables/useToast'
import { GetAdminWallet } from '@/services/BackendApi'
import GiveawaySettings from '@/components/GiveawaySettings.vue'
import AdminBalanceGrant from '@/components/AdminBalanceGrant.vue'
import type { GiveawaySettingsDto } from '@/utils/types'
const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)

const router = useRouter()

const stepsComplete: Ref<Record<number, boolean>> = ref({})

// Function to mark a step as complete
const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

// Function to reset a step's completion status
const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}

// Props from route
const props = defineProps<{
  tokenClass: string
}>()

// Reactive state

const currentStep = ref(1)
const tokenKey = ref(props.tokenClass || '')
const availableQuantity = ref(0) // You might fetch this based on the tokenKey

const tokenClass = reactive<TokenClassKeyBody>({
  collection: 'MyCollection',
  category: 'Art4',
  type: 'UniqueArtToken',
  additionalKey: 'Rare'
})
const { showToast } = useToast()

const giveawaySettings = ref<GiveawaySettingsDto>({
  endDateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
  winners: 1,
  tokenQuantity: 1,
  tokenClass: { additionalKey: '', category: '', collection: '', type: '' }
})
const tokenService = GalaChainApi.getInstance()

let selectedToken: TokenClassKey | null = null
async function selectToken() {
  await tokenService.init()

  const isValid = await tokenInputRef.value?.validate()
  if (isValid.valid) {
    const { tokenClassDto, tokenClassResponse } = await tokenService.fetchTokenClasses(tokenClass)
    if ((tokenClassResponse as any).Status === 1) {
      selectedToken = tokenClassDto
      markStepComplete(1)
    } else {
      resetStep(1)
      selectedToken = null
      showToast((tokenClassResponse as any).message || 'Unable to get token class', true)
    }
  }
}
// Watch for changes in step or tokenKey to update the URL
// watch([currentStep, tokenKey], () => {
//   router.replace({
//     name: 'GiveawayWizard',
//     params: {
//       step: currentStep.value,
//       tokenClass: tokenKey.value || undefined
//     }
//   })
// })

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

const isEnd = (currentPage: number) => {
  return currentPage == 2
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

function launchGiveaway() {
  // Implement your logic to launch the giveaway
  alert('Giveaway launched!')
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
