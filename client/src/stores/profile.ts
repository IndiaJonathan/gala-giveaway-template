// stores/profile.ts

import { defineStore } from 'pinia'
import { getProfile } from '@/services/BackendApi'
import type { Profile } from '@/utils/types'
import {
  BrowserConnectClient,
  TokenApi,
  TokenBalance,
  TokenBalanceWithMetadata,
  TokenClass,
  TokenClassKey
} from '@gala-chain/connect'
import { ref, shallowRef, onMounted, watch, type Ref, type ShallowRef, computed } from 'vue'
import { openNoWeb3WalletDialog } from '@/composables/useDialogue'
import { getConnectedAddress } from '@/utils/GalaHelper'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { getCreatedTokens, type Transaction } from '@/services/GalaSwapApi'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<Profile | null>(null)
  const createdTokens: Ref<Transaction[]> = ref([])

  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  let browserClient: ShallowRef<BrowserConnectClient, BrowserConnectClient> | null
  try {
    browserClient = shallowRef<BrowserConnectClient>(new BrowserConnectClient())
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          connectedUserGCAddress.value = undefined
          connectedEthAddress.value = undefined
        } else {
          connectedEthAddress.value = accounts[0]
        }
        await walletAddressChanged()
      })
    }

    //TODO GALA_SDK: this should handle locked accounts
    // browserClient.value?.on('accountChanged', async () => {
    //   if (!browserClient) throw new Error('No wallet connection')
    //   connectedEthAddress.value = browserClient.value.ethereumAddress
    //   console.log(connectedEthAddress.value)
    //   await walletAddressChanged()
    // })
  } catch (e) {
    browserClient = null
  }
  const connectedEthAddress: Ref<string | undefined> = ref()
  const connectedUserGCAddress: Ref<string | undefined> = ref(undefined)
  const balances: Ref<TokenBalance[]> = ref([])
  const metadata: Ref<TokenClass[]> = ref([])
  const isFetchingProfile = ref(false)

  //W3w status
  const isAwaitingConnect = ref(false)
  const isAwaitingSign = ref(false)

  const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

  // Actions
  async function fetchProfile() {
    isFetchingProfile.value = true
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    if (!connectedEthAddress.value) return

    try {
      profile.value = await getProfile(connectedEthAddress.value)
      connectedUserGCAddress.value = profile.value.galaChainAddress
      return profile.value
    } catch (err) {
      error.value = err as Error
      isConnected.value = false
    } finally {
      isFetchingProfile.value = false
    }
  }

  async function connect() {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return false
    }

    try {
      const newAdress = await getConnectedAddress()
      if (newAdress !== connectedEthAddress.value) {
        await walletAddressChanged(newAdress)
      }
      if (!connectedEthAddress.value) {
        isAwaitingConnect.value = true
        await browserClient.value.connect()
        await walletAddressChanged(browserClient.value.ethereumAddress)
      } else {
        //Ensure connection
        await browserClient.value.connect()
      }

      return connectedEthAddress.value
    } finally {
      isAwaitingConnect.value = false
    }
  }

  async function sign(method: string, dto: any) {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    await connect()
    try {
      isAwaitingSign.value = true
      return await browserClient.value.sign(method, dto)
    } finally {
      isAwaitingSign.value = false
    }
  }

  async function getBalances(forceRefresh = false) {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    const tokenApi = new TokenApi(tokenContractUrl, browserClient.value)
    if (forceRefresh || (!balances.value.length && connectedEthAddress)) {
      balances.value = (
        (await tokenApi.FetchBalances({ owner: connectedUserGCAddress.value })) as any
      ).Data
      console.log('loaded')
    }
  }

  function getTokenClasses() {
    let classes: TokenClassKeyProperties[] = []
    if (balances.value) {
      classes = classes.concat(
        balances.value.map((balance) => ({
          additionalKey: balance.additionalKey,
          collection: balance.collection,
          category: balance.category,
          type: balance.type
        }))
      )
    }

    return classes
  }
  watch(
    () => getTokenClasses(), // Track changes to getTokenClasses
    async (newTokenClasses) => {
      if (!browserClient || !newTokenClasses || !newTokenClasses.length) {
        metadata.value = []
        return
      }

      const tokenApi = new TokenApi(tokenContractUrl, browserClient.value)
      try {
        const foo = ((await tokenApi.FetchTokenClasses({ tokenClasses: newTokenClasses })) as any)
          .Data
        metadata.value = foo
      } catch (error) {
        console.error('Error fetching token classes:', error)
        metadata.value = []
      }
    },
    { deep: true, immediate: true } // Runs initially & watches deeply for changes
  )

  watch(connectedUserGCAddress, async () => {
    if (!connectedUserGCAddress.value) return
    const jobs = await getCreatedTokens(connectedUserGCAddress.value)
    createdTokens.value = jobs.completedJobs
  })

  async function walletAddressChanged(newAddress?: string) {
    connectedEthAddress.value = newAddress
    if (connectedEthAddress.value && connectedEthAddress.value != '') await fetchProfile()
  }

  async function refreshConnectedAddress() {
    connectedEthAddress.value = await getConnectedAddress()
  }

  watch(connectedEthAddress, async () => {
    const profile = await fetchProfile()
    if (profile) {
      await getBalances()
    }
  })

  refreshConnectedAddress()

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
    isFetchingProfile,
    metadata,
    createdTokens,
    // Actions
    fetchProfile,
    connect,
    sign,
    getBalances
  }
})
