// import { getProfile } from '@/services/BackendApi'
// import type { Profile } from '@/utils/types'
// import { BrowserConnectClient } from '@gala-chain/connect'
// import { onMounted, ref, shallowRef, watch } from 'vue'

// export function useProfile() {
//   const profile = ref<Profile | null>(null)
//   const isConnected = ref(false)
//   const connectedAddress = ref('')
//   const error = ref<Error | null>(null)
//   const browserClient = shallowRef<BrowserConnectClient>(new BrowserConnectClient())

//   async function fetchProfile() {
//     try {
//       await browserClient.value.connect()
//       isConnected.value = true

//       profile.value = await getProfile(browserClient.value.galaChainAddress)
//     } catch (err) {
//       error.value = err as Error
//       isConnected.value = false
//     }
//   }

//   async function connect(){
//     connectedAddress.value = await browserClient.value.connect()
//   }

  
//   browserClient.value?.on('accountChanged', async () => {
//     profile.value = await getProfile(browserClient.value.galaChainAddress)
//   })

//   onMounted(async () => {
//     await fetchProfile();
//   })

//   return {
//     profile,
//     connectedAddress,
//     isConnected: !!connectedAddress.value,
//     error,
//     browserClient
//   }
// }
