<template>
  <div>
    <v-row justify="center">
      <v-col cols="8" class="text-center">
        <h3>Starting a token Giveaway with: {{ tokenKey }}</h3>
      </v-col>
      <v-col cols="8" class="text-center">
        Detected Available Allowance: {{ availableQuantity }}
      </v-col>
      <v-col cols="8" class="text-center">
        <v-btn col>Grant Additional Allowance</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tokenKey = computed(() => route.params.tokenClass as string)
const loading = ref(true)

import { useToast } from '@/composables/useToast'
import { createValidDTO, FetchAllowancesDto, TokenAllowance } from '@gala-chain/api'
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import { getTokenKey, getTokenKeyFromString } from '@/utils/GalaHelper'
import { getProfile } from '../services/BackendApi'

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const browserClient = new BrowserConnectClient()

const tokenApi = new TokenApi(tokenContractUrl, browserClient)
const availableQuantity = ref(0)

const { showToast } = useToast()
fetchBalances()
async function fetchBalances() {
  loading.value = true
  await browserClient.connect()
  const profile = await getProfile(browserClient.galaChainAddress)
  if (!profile || !profile.galaChainAddress) {
    showToast('Unable to get giveaway wallet info', true)
    loading.value = false
    return
  }

  const tokenObject = computed(() => getTokenKeyFromString(tokenKey.value))
  if (!tokenObject.value) {
    showToast(`Token Class: ${tokenKey.value} not valid`, true)
    loading.value = false
    return
  }

  const fetchBalanceDto = await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
    grantedTo: profile.galaChainAddress,
    ...tokenObject.value
  })
  const response = await tokenApi.FetchAllowances(fetchBalanceDto)

  if (response.Status === 1 && response.Data && response.Data.results) {
    availableQuantity.value = (response.Data.results).reduce(
      (accumulator, element) => {
        if (Number(element.uses) - (Number(element.usesSpent) || 0) !== 0) {
          return accumulator + (Number(element.quantity) - (Number(element.quantitySpent) || 0))
        }
        return accumulator
      },
      0
    )
  } else {
    showToast('Failed to fetch allowances', true)
  }
  loading.value = false
}
</script>
