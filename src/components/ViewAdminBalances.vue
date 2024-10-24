<template>
  <v-container>
    <v-overlay :value="isLoading" absolute>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <v-list two-line>
      Currently Granted Allowances
      <v-list-item
        @click="startGiveaway(getTokenKey(allowance))"
        v-for="(allowance, index) in allowances"
        :key="index"
      >
        <v-list-item-title>
          {{ getTokenKey(allowance) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          Quantity Left: {{ Number(allowance.quantity) - Number(allowance.quantitySpent || 0) }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-container>
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
import { AllowanceKey, createValidDTO, FetchAllowancesDto, TokenAllowance } from '@gala-chain/api'
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTokenKey, getTokenKeyFromString } from '@/utils/GalaHelper'
import { useToast } from '@/composables/useToast'
import { getProfile } from '../services/BackendApi'
const browserClient = new BrowserConnectClient()

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const allowances: Ref<TokenAllowance[]> = ref([])
const tokenApi = new TokenApi(tokenContractUrl, browserClient)
const isLoading = ref(true)
const router = useRouter()
const { toast, showToast } = useToast()
const emit = defineEmits(['token-selected'])

function startGiveaway(tokenClass: string) {
  emit('token-selected', tokenClass)
  // router.push({ name: `CreateGiveaway`, params: { tokenClass } })
}

async function fetchBalances() {
  isLoading.value = true
  await browserClient.connect()
  const profile = await getProfile(browserClient.galachainEthAlias)
  if (!profile || !profile.galaChainAddress) {
    showToast('Unable to get giveaway wallet info', true)
    isLoading.value = false
    return
  }

  const fetchBalanceDto = await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
    grantedTo: profile.galaChainAddress
  })
  const response = await tokenApi.FetchAllowances(fetchBalanceDto)
  console.log(response)

  if (response.Status === 1 && response.Data && response.Data.results) {
    allowances.value = response.Data.results as any
  } else {
    showToast('Failed to fetch allowances', true)
  }
  isLoading.value = false
}

fetchBalances()
</script>
