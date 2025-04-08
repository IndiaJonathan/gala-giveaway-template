// stores/profile.ts

import { defineStore, storeToRefs } from 'pinia'
import { getProfile, getClaimableWins, fetchBalances, getGiveaways } from '@/services/BackendApi'
import type { Profile, TokenBalances } from '@/utils/types'
import {
  BrowserConnectClient,
  SigningType,
  TokenApi,
  TokenBalance,
  TokenBalanceWithMetadata,
  TokenClass,
  TokenClassKey
} from '@gala-chain/connect'
import { ref, shallowRef, onMounted, watch, type Ref, type ShallowRef, computed } from 'vue'
import { openNoWeb3WalletDialog } from '@/composables/useDialogue'
import { getConnectedAddress, requestConnect, tokenToReadable } from '@/utils/GalaHelper'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { getCreatedTokens, type Transaction } from '@/services/GalaSwapApi'
import BigNumber from 'bignumber.js'
import { useCreateGiveawayStore } from './createGiveaway'
import type { BalanceResponseDto } from '@/dto/BalanceResponseDto'
import type { Giveaway } from '@/types/giveaway'
import { useToast } from '@/composables/useToast'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<Profile | null>(null)
  const createdTokens: Ref<Transaction[]> = ref([])
  const showLoginModal = ref(false)
  const claimableWins = ref<any[]>([])
  const isFetchingClaimableWins = ref(false)
  const giveaways = ref<Giveaway[]>([])

  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  // Use a Map to store unique tokens with string keys
  const uniqueTokenClasses = ref<Map<string, TokenClassKeyProperties>>(new Map())

  const isFetchingGiveaways = ref(false)
  const { showToast } = useToast()

  // Function to add a token to uniqueTokenClasses with deduplication
  function addUniqueToken(token: TokenClassKeyProperties) {
    const key = tokenToReadable(token)
    uniqueTokenClasses.value.set(key, token)
  }

  // Convert uniqueTokenClasses Map to array
  function getUniqueTokensArray(): TokenClassKeyProperties[] {
    return Array.from(uniqueTokenClasses.value.values())
  }

  // Declare fetchGiveaways function
  const fetchGiveaways = async () => {
    try {
      isFetchingGiveaways.value = true
      console.log('Fetching giveaways...')
      giveaways.value = await getGiveaways(connectedUserGCAddress.value)
      // Add each giveaway token to the map, deduplicating by key
      giveaways.value.forEach((giveaway) => {
        addUniqueToken(giveaway.giveawayToken)
      })
      console.log('uniqueTokenClasses', getUniqueTokensArray())
      return giveaways.value
    } catch (e) {
      showToast((e as any).message || JSON.stringify(e), true)
      console.error(e)
    } finally {
      isFetchingGiveaways.value = false
    }
  }

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
    //Show alert modal
    // showDialog.value = true
    // dialogConfig.value = {
    //   title: 'Error',
    //   body: 'Error connecting to wallet',
    //   ctaPrimary: 'OK'
    // }
  }
  const connectedEthAddress: Ref<string | undefined> = ref()
  const connectedUserGCAddress: Ref<string | undefined> = ref(undefined)
  const balances: Ref<BalanceResponseDto | undefined> = ref(undefined)
  const metadata: Ref<TokenClass[]> = ref([])
  const isFetchingProfile = ref(false)

  // //W3w status
  // const isAwaitingConnect = ref(false)
  // const isAwaitingSign = ref(false)

  const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
  const giveawayStore = useCreateGiveawayStore()
  const { giveawaySettings } = storeToRefs(giveawayStore)

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
      console.log('profile', profile.value)
      connectedUserGCAddress.value = profile.value.galaChainAddress
      return profile.value
    } catch (err) {
      error.value = err as Error
      isConnected.value = false
    } finally {
      isFetchingProfile.value = false
    }
  }
  async function setShowLoginModal(show: boolean) {
    showLoginModal.value = show
  }

  // Add logout function
  async function logout() {
    // Clear user data
    profile.value = null
    connectedEthAddress.value = undefined
    connectedUserGCAddress.value = undefined
    balances.value = undefined
    metadata.value = []
    claimableWins.value = []
    isConnected.value = false

    // If using Web3Modal or similar library, you might need to disconnect from provider
    if (browserClient?.value) {
      try {
        // Most wallet providers don't have explicit disconnect methods
        // But if you're using Web3Modal or similar, you might have:
        // await browserClient.value.disconnect()
        console.log('User disconnected from wallet')
      } catch (err) {
        console.error('Error disconnecting wallet:', err)
      }
    }

    // Redirect to home page if needed
    // router.push('/') - would need to import router

    return true
  }

  async function connect() {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return false
    }

    try {
      const newAdress = await requestConnect()
      if (newAdress !== connectedEthAddress.value) {
        await walletAddressChanged(newAdress)
      }
      if (newAdress) {
        if (!connectedEthAddress.value) {
          // isAwaitingConnect.value = true
          await browserClient.value.connect()
          await walletAddressChanged(browserClient.value.ethereumAddress)
        } else {
          //Ensure connection
          await browserClient.value.connect()
        }

        return connectedEthAddress.value
      }
    } finally {
      // isAwaitingConnect.value = false
    }
  }

  async function sign(method: string, dto: any) {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    await connect()
    try {
      // isAwaitingSign.value = true
      return await browserClient.value.sign(method, dto, SigningType.PERSONAL_SIGN)
    } finally {
      // isAwaitingSign.value = false
    }
  }

  async function getBalances(forceRefresh = false) {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    const tokenApi = new TokenApi(tokenContractUrl, browserClient.value)
    if (forceRefresh || (!balances.value && connectedEthAddress && connectedEthAddress.value)) {
      const ethAddress = connectedEthAddress.value
      if (ethAddress) {
        try {
          const response = await fetchBalances(ethAddress)

          balances.value = response
          // // Get balances from both sources
          // const userBalancesArray = (response.userBalances?.Data || []).map((balance) => ({
          //   ...balance,
          //   // Convert string quantity to BigNumber
          //   quantity: new BigNumber(balance.quantity)
          // }))

          // const giveawayBalancesArray = (response.giveawayWalletBalances?.Data || []).map(
          //   (balance) => ({
          //     ...balance,
          //     // Convert string quantity to BigNumber
          //     quantity: new BigNumber(balance.quantity)
          //   })
          // )
          // const availableBalances = (response.availableBalances || []).map((balance) => ({
          //   ...balance,
          //   // Convert string quantity to BigNumber
          //   quantity: new BigNumber(balance.quantity)
          // }))

          // // Combine both arrays of balances
          // balances.value = {
          //   availableBalances,
          //   giveawayWalletBalances: giveawayBalancesArray,
          //   userBalances: userBalancesArray,
          //   requiredEscrow: response.requiredEscrow,
          //   escrowAllowances: response.escrowAllowances,
          // balances.value = [...availableBalances]

          console.log('loaded balances', balances.value)
        } catch (err) {
          console.error('Error fetching balances:', err)
          error.value = err as Error
        }
      }
    }
  }

  // async function refreshGiveawayTokenBalances(tokenClassKey: TokenClassKeyProperties) {
  //   if (!connectedUserGCAddress.value || !giveawaySettings.value.giveawayTokenType) {
  //     return null
  //   }

  //   try {
  //     const response = await getGiveawayTokensAvailable(
  //       tokenClassKey,
  //       connectedUserGCAddress.value,
  //       giveawaySettings.value.giveawayTokenType
  //     )

  //     // Only update if the values are actually different
  //     if (!giveawayTokenBalances.value ||
  //         JSON.stringify(response) !== JSON.stringify(giveawayTokenBalances.value)) {
  //       giveawayTokenBalances.value = response
  //     }

  //     return response
  //   } catch (err) {
  //     console.error('Error fetching wallet allowances:', err)
  //     error.value = err as Error
  //     return null
  //   }
  // }

  function getUniqueTokenClassesFromBalances() {
    if (balances.value) {
      balances.value.availableBalances.forEach((balance) => {
        addUniqueToken({
          additionalKey: balance.additionalKey,
          collection: balance.collection,
          category: balance.category,
          type: balance.type
        })
      })
    }
    return getUniqueTokensArray()
  }

  watch(
    uniqueTokenClasses, // Track changes to uniqueTokenClasses map
    async (newTokenClassesMap) => {
      if (!newTokenClassesMap || newTokenClassesMap.size === 0) {
        metadata.value = []
        return
      }

      try {
        // Create a client for token metadata fetching - this doesn't require authentication for viewing
        const client = browserClient?.value || new BrowserConnectClient()
        const tokenApi = new TokenApi(tokenContractUrl, client)

        const tokenClasses = getUniqueTokensArray()

        const foo = ((await tokenApi.FetchTokenClasses({ tokenClasses })) as any).Data
        metadata.value = foo
      } catch (error) {
        console.error('Error fetching token classes:', error)
        metadata.value = []
      }
    },
    { deep: true, immediate: true } // Runs initially & watches deeply for changes
  )

  async function fetchClaimableWins() {
    if (!browserClient) {
      openNoWeb3WalletDialog()
      return
    }
    if (!connectedUserGCAddress.value) return

    try {
      isFetchingClaimableWins.value = true
      claimableWins.value = await getClaimableWins(connectedUserGCAddress.value)
      return claimableWins.value
    } catch (err) {
      error.value = err as Error
      console.error('Error fetching claimable wins:', err)
    } finally {
      isFetchingClaimableWins.value = false
    }
  }

  // watch(giveawaySettings, async () => {
  //   if (!giveawaySettings.value.giveawayToken) return
  //   await refreshGiveawayTokenBalances(giveawaySettings.value.giveawayToken)
  // })

  watch(connectedUserGCAddress, async () => {
    if (!connectedUserGCAddress.value) return
    const jobs = await getCreatedTokens(connectedUserGCAddress.value)
    createdTokens.value = jobs.completedJobs
    console.log('created tokens', createdTokens.value)
    // Fetch claimable wins when the GC address changes
    fetchClaimableWins()
    fetchGiveaways()
  })

  // Add watcher to fetch giveaways on startup
  watch(
    () => true,
    async () => {
      const giveaways = await fetchGiveaways()
      if (giveaways) {
        // Add each giveaway token to the map
        giveaways.forEach((giveaway) => {
          addUniqueToken(giveaway.giveawayToken)
        })
        console.log('giveaways', giveaways)
      }
    },
    { immediate: true }
  )

  // Add watcher to update uniqueTokenClasses when balances change
  watch(
    balances,
    () => {
      if (balances.value) {
        getUniqueTokenClassesFromBalances()
      }
    },
    { deep: true }
  )

  async function walletAddressChanged(newAddress?: string) {
    connectedEthAddress.value = newAddress
    if (connectedEthAddress.value && connectedEthAddress.value != '') {
      await fetchProfile()
      // if (giveawaySettings.value?.giveawayToken) {
      //   await refreshGiveawayTokenBalances(giveawaySettings.value.giveawayToken)
      // }
    }
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

  function setTelegramUserLinked(hasTelegramLinked: boolean) {
    if (!profile.value) return
    profile.value.hasTelegramLinked = hasTelegramLinked
  }

  refreshConnectedAddress()

  return {
    // State
    profile,
    isConnected: !!connectedEthAddress,
    error,
    connectedEthAddress,
    connectedUserGCAddress,
    // isAwaitingConnect,
    // isAwaitingSign,
    balances,
    isFetchingProfile,
    metadata,
    createdTokens,
    showLoginModal,
    claimableWins,
    isFetchingClaimableWins,
    giveaways,
    isFetchingGiveaways,
    // Actions
    fetchProfile,
    connect,
    sign,
    getBalances,
    fetchGiveaways,
    setShowLoginModal,
    fetchClaimableWins,
    setTelegramUserLinked,
    logout
  }
})
