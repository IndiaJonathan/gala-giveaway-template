<template>
  <v-container>
    <v-form>
      <TokenInput
        ref="tokenInputRef"
        v-model:tokenClass="tokenClass"
        v-model:quantity="quantity"
        :showQuantity="true"
      />
      <v-btn @click="grantAllowance" color="primary">Grant Allowance</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import TokenInput from '@/components/TokenInput.vue'
import { useToast } from '@/composables/useToast'
import { createHeadlessWallet, getPublicKey } from '@/services/GalaSwapApi'
import {
  AllowanceType,
  createValidDTO,
  FetchTokenClassesDto,
  GrantAllowanceDto,
  TokenClassKey,
  TokenInstanceQueryKey
} from '@gala-chain/api'
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import BigNumber from 'bignumber.js'
import { reactive, ref, type Ref } from 'vue'
import { getProfile } from '../services/BackendApi'

const browserClient = new BrowserConnectClient()
const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const publicContractUrl = import.meta.env.VITE_PUBLIC_KEY_CONTRACT_URL
const { showToast } = useToast()
const tokenInputRef = ref()

// Initialize tokenClass with default values
const tokenClass = reactive<any>({
  collection: 'MyCollection',
  category: 'Art',
  type: 'UniqueArtToken',
  additionalKey: 'Rare'
})

const quantity: Ref<number | undefined> = ref()

async function grantAllowance() {
  // Validate the form inside TokenInput
  const isValid = await tokenInputRef.value.validate()
  if (!isValid) return

  const tokenClient = new TokenApi(tokenContractUrl, browserClient)
  const connectionResult = await browserClient.connect()
  const result = await getPublicKey(connectionResult)
  if (!result) {
    // Need public key
    const publicKey = await browserClient.getPublicKey()
    const signUp = await createHeadlessWallet(publicKey.publicKey)
    console.log(signUp)
  }

  const tokenClassDto = await createValidDTO<TokenClassKey>(TokenClassKey, {
    ...tokenClass
  })
  const dto = await createValidDTO<FetchTokenClassesDto>(FetchTokenClassesDto, {
    tokenClasses: [tokenClassDto]
  })

  try {
    const classes = await tokenClient.FetchTokenClasses(dto)
    const profile = await getProfile(browserClient.galachainEthAlias)
    if (!profile.galaChainAddress) {
      showToast(`Unable to get giveaway wallet`, true)
      return
    }
    if (!quantity.value) {
      showToast(`Quantity not defined`, true)
      return
    }

    const tokenInstanceQuery = await createValidDTO<TokenInstanceQueryKey>(TokenInstanceQueryKey, {
      ...tokenClassDto,
      instance: BigNumber(0)
    })

    const allowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
      tokenInstance: tokenInstanceQuery,
      quantities: [
        { quantity: new BigNumber(quantity.value), user: profile.giveawayWalletAddress }
      ],
      allowanceType: AllowanceType.Mint,
      uses: BigNumber('Infinity')
    })

    console.log(`Found class: ${classes}`)
    if (classes.Data && classes.Data[0]) {
      const allowanceGrant = await tokenClient.GrantAllowance(allowanceDto)
      if (allowanceGrant.Status === 1) {
        // Success!
        showToast('Allowance Granted!')
      } else {
        showToast('Unable to grant allowance.', true)
      }
    } else {
      showToast(classes.Message || (classes as any).message || 'Unable to find token class', true)
    }
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'message' in e) {
      showToast((e as { message: string }).message, true)
    }
  }
}
</script>
