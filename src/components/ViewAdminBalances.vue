<template>
  <div v-if="loading">Loading...</div>
  <v-container v-else>
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
import { GetAdminWallet } from '@/services/BackendApi'
import { AllowanceKey, createValidDTO, FetchAllowancesDto, TokenAllowance } from '@gala-chain/api'
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTokenKey, getTokenKeyFromString } from '@/utils/GalaHelper'
import { useToast } from '@/composables/useToast'
const browserClient = new BrowserConnectClient()

const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const allowances: Ref<TokenAllowance[]> = ref([])
const tokenApi = new TokenApi(tokenContractUrl, browserClient)
let loading = ref(true)
const router = useRouter()
const { toast, showToast } = useToast()
const emit = defineEmits(['token-selected'])

function startGiveaway(tokenClass: string) {
  emit('token-selected', tokenClass)
  // router.push({ name: `CreateGiveaway`, params: { tokenClass } })
}

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
</script>
