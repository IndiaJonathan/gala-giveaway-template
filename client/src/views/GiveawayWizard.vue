<template>
  <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
    <div v-if="!connectedEthAddress || !connectedUserGCAddress" style="width: 100%; text-align: center;">
      <h1>Start A Giveaway</h1>
      <Web3Button color="success" @click="profileStore.connect"
        primary-text="Sign in With your Web3 Wallet To Continue"></Web3Button>
    </div>
    <v-stepper v-else v-model="currentStep" style="width: 100%; height: 100%;">
      <!-- Stepper Header -->
      <v-stepper-header>
        <v-stepper-item :complete="stepsComplete[1]" :value="1"> Select Token </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[2]" :value="2"> Giveaway Settings </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[3]" :value="3"> Grant Allowance </v-stepper-item>
        <v-stepper-item :complete="stepsComplete[4]" :value="4"> Launch Giveaway </v-stepper-item>
      </v-stepper-header>

      <!-- Stepper Content -->
      <v-stepper-window style="width: 100%; padding: 20px">
        <!-- Step 1: Select Token -->
        <v-stepper-window-item :value="1">
          <h1> Option 1: Create Giveaway from balances</h1>
          <UserBalances :token-class="giveawaySettings.giveawayToken" :clickable="true"
            @item-clicked="handleBalanceClick" :data="balances"></UserBalances>


          <v-divider style="padding-top: 30px;"></v-divider>


          <v-row>

            <h1>Option 2: Create Giveaway from Allowances</h1>

            <v-tooltip>
              <template #activator="{ props }">
                <v-icon small v-bind="props" class="ml-2">mdi-information-outline</v-icon>
              </template>
              <span>
                This requires that you are a token authority on the selected token
              </span>
            </v-tooltip>
          </v-row>

          <!-- User Allowances Component -->
          <UserAllowances @clicked-token="selectProjectToken" :gc-address="connectedUserGCAddress"></UserAllowances>




          <!-- Custom input section -->

          <!-- <v-row>
            <v-checkbox v-model="showCustomInput" label="Show Custom Token Input"></v-checkbox>
            <v-tooltip>
              <template #activator="{ props }">
                <v-icon small v-bind="props" class="ml-2">mdi-information-outline</v-icon>
              </template>
              <span>
                Only select this if you know what you're doing!
              </span>
            </v-tooltip>
          </v-row>


          <div v-if="showCustomInput">

            <TokenInput @update:token-class="deselectToken" ref="tokenInputRef"
              v-model:tokenClass="giveawaySettings.giveawayToken" :showQuantity="false" />

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



            </v-row>

          </div> -->


          <div v-if="totalSupply !== null && maxSupply !== null && stepsComplete[1]">
            <p>Total Supply: {{ totalSupply }} Max Supply: {{ maxSupply }}</p>
          </div>
        </v-stepper-window-item>

        <!-- Step 2: Giveaway Settings -->
        <v-stepper-window-item :value="2">
          <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="giveawaySettings.giveawayToken"
            :giveaway-settings="giveawaySettings" />
        </v-stepper-window-item>

        <!-- Step 3-->
        <v-stepper-window-item :value="3">
          <!--  Grant Allowance (For allowance based giveaways)-->
          <AdminBalanceGrant @form-valid="stepChanged" :token-class-key="giveawaySettings.giveawayToken"
            :giveaway-settings="giveawaySettings">
          </AdminBalanceGrant>
        </v-stepper-window-item>

        <v-stepper-window-item :value="4">
          <GiveawaySettings @form-valid="updateGiveawaySettingsValidity" :token-class="giveawaySettings.giveawayToken"
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


const tokenInputRef = ref<InstanceType<typeof TokenInput> | null>(null)
const showCustomInput = ref(false)
const router = useRouter()

const profileStore = useProfileStore();
const { profile, isConnected, error, balances, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL



const stepsComplete: Ref<Record<number, boolean>> = ref({})

const markStepComplete = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = true
}

const resetStep = (stepNumber: number) => {
  stepsComplete.value[stepNumber] = false
}



const currentStep = ref(1)

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