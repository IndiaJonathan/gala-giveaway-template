<template>
  <div v-if="loading">Loading...</div>
  <v-container v-else>
    <v-list two-line>
      Allowances
      <v-list-item v-for="(allowance, index) in allowances" :key="index">
        <v-list-item-title>
          {{ allowance.collection }} | {{ allowance.category }}| {{ allowance.type }} |
          {{ allowance.additionalKey }}
        </v-list-item-title>
        <v-list-item-subtitle>
          Quantity Left: {{ Number(allowance.quantity) - Number(allowance.quantitySpent || 0) }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-container>

  <v-snackbar
    v-model="toast.visible"
    :timeout="toast.timeout"
    :color="toast.isError ? 'error' : 'success'"
    top
  >
    {{ toast.message }}
    <v-btn color="white" @click="toast.visible = false">Close</v-btn>
  </v-snackbar>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>

<script setup lang="ts">
import { GetAdminWallet, startGiveaway } from '@/services/BackendApi'
import { createHeadlessWallet, getPublicKey } from '@/services/GalaSwapApi'
import { getGalaChainAddress } from '@/utils/GalaHelper'
import {
  AllowanceType,
  createValidDTO,
  FetchAllowancesDto,
  FetchAllowancesResponse,
  FetchBalancesDto,
  FetchTokenClassesDto,
  GrantAllowanceDto,
  RegisterUserDto,
  TokenAllowance,
  TokenClass,
  TokenClassKey,
  TokenInstanceQueryKey,
  type CreateTokenClassDto,
  type TokenClassKeyBody
} from '@gala-chain/api'
import { BrowserConnectClient, TokenApi, PresignedClient, PublicKeyApi } from '@gala-chain/connect'
import BigNumber from 'bignumber.js'
import { plainToInstance } from 'class-transformer'
import { reactive, ref, type Ref } from 'vue'
const browserClient = new BrowserConnectClient()

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const publicContractUrl = import.meta.env.VITE_PUBLIC_KEY_CONTRACT_URL
const allowances: Ref<TokenAllowance[]> = ref([])
const tokenApi = new TokenApi(tokenContractUrl, browserClient)
let loading = ref(true)

async function fetchBalances() {
  loading.value = true
  const adminWallet = await GetAdminWallet()
  if (!adminWallet || !adminWallet.gc_address) {
    showToast('Unable to get admin wallet info', true)
    loading.value = false
    return
  }

  const fetchBalanceDto = await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
    grantedTo: adminWallet.gc_address
  })
  const response = await tokenApi.FetchAllowances(fetchBalanceDto)
  console.log(response)

  if (response.Status === 1 && response.Data && response.Data.results) {
    allowances.value = response.Data.results as any
  } else {
    showToast('Failed to fetch allowances', true)
  }
  loading.value = false
}

fetchBalances()
const form = ref()

const toast = ref({
  visible: false,
  message: 'This is a toast message!',
  timeout: 3000,
  isError: false
})

function showToast(message: string, isError = false) {
  toast.value.message = message
  toast.value.visible = true
  toast.value.isError = isError
}

const rules = {
  required: (value: any) => !!value || 'Required.'
}
</script>
