// stores/profile.ts

import { defineStore } from 'pinia'
import { getProfile } from '@/services/BackendApi'
import type { Profile } from '@/utils/types'
import { BrowserConnectClient, TokenApi, TokenBalance } from '@gala-chain/connect'
import { ref, shallowRef, onMounted, watch, type Ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<Profile | null>(null)
  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  const browserClient = shallowRef<BrowserConnectClient>(new BrowserConnectClient())
  const connectedEthAddress: Ref<string> = ref('')
  const connectedUserGCAddress = ref('')
  const balances: Ref<TokenBalance[]> = ref([])

  //W3w status
  const isAwaitingConnect = ref(false)
  const isAwaitingSign = ref(false)

  const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

  // Actions
  async function fetchProfile() {
    try {
      profile.value = await getProfile(browserClient.value.ethereumAddress)
      connectedUserGCAddress.value = profile.value.galaChainAddress
    } catch (err) {
      error.value = err as Error
      isConnected.value = false
    }
  }

  async function connect() {
    isAwaitingConnect.value = true
    try {
      const oldAddress = connectedEthAddress.value
      connectedEthAddress.value = await browserClient.value.connect()
      console.log('Updated address ', connectedEthAddress.value)
      if (connectedEthAddress.value !== oldAddress) {
        await walletAddressChanged()
      }
    } finally {
      isAwaitingConnect.value = false
    }
  }

  async function sign(method: string, dto: any) {
    await connect()
    try {
      isAwaitingSign.value = true
      return await browserClient.value.sign(method, dto)
    } finally {
      isAwaitingSign.value = false
    }
  }

  async function getBalances(forceRefresh = false) {
    const tokenApi = new TokenApi(tokenContractUrl, browserClient.value)
    if (forceRefresh || !balances.value) {
      balances.value = (
        (await tokenApi.FetchBalances({ owner: connectedUserGCAddress.value })) as any
      ).Data
    }
  }

  async function walletAddressChanged() {
    console.log("wallet address changed")
    if (connectedEthAddress.value && connectedEthAddress.value != '') await fetchProfile()
  }

  // Listen for account changes
  browserClient.value?.on('accountChanged', async () => {
    connectedEthAddress.value = browserClient.value.ethereumAddress
    await walletAddressChanged()
  })

  return {
    // State
    profile,
    isConnected: !!connectedEthAddress,
    error,
    connectedEthAddress,
    connectedUserGCAddress,
    isAwaitingConnect,
    isAwaitingSign,
    balances,
    // Actions
    fetchProfile,
    connect,
    sign,
    getBalances
  }
})
