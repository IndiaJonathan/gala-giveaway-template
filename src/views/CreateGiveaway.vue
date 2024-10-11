<template>
  <v-container>
    <v-form ref="form">
      <v-row>
        <!-- Collection Input -->
        <v-col cols="12" md="6">
          <v-text-field
            placeholder="Token"
            v-model="tokenClass.collection"
            label="Collection"
            :rules="[rules.required]"
            required
          ></v-text-field>
        </v-col>

        <!-- Category Input -->
        <v-col cols="12" md="6">
          <v-text-field
            placeholder="Unit"
            v-model="tokenClass.category"
            label="Category"
            :rules="[rules.required]"
            required
          ></v-text-field>
        </v-col>

        <!-- Type Input -->
        <v-col cols="12" md="6">
          <v-text-field
            placeholder="<your token's symbol>"
            v-model="tokenClass.type"
            label="Type"
            :rules="[rules.required]"
            required
          ></v-text-field>
        </v-col>

        <!-- Additional Key Input -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="tokenClass.additionalKey"
            label="Additional Key"
            :rules="[rules.required]"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Quantity"
            :rules="[rules.greaterThanZero]"
            required
            v-model="quantity"
            type="number"
          ></v-text-field>
        </v-col>

        <!-- Submit Button -->
        <v-col cols="12">
          <v-btn @click="grantAllowance" color="primary">Grant Allowance</v-btn>
        </v-col>
      </v-row>
    </v-form>

    <v-snackbar
      v-model="toast.visible"
      :timeout="toast.timeout"
      :color="toast.isError ? 'error' : 'success'"
      top
    >
      {{ toast.message }}
      <template>
        <v-btn color="white" @click="toast.visible = false"> Close </v-btn>
      </template>
    </v-snackbar>
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
import { GetAdminWallet, startGiveaway } from '@/services/BackendApi'
import { createHeadlessWallet, getPublicKey } from '@/services/GalaSwapApi'
import { getGalaChainAddress } from '@/utils/GalaHelper'
import {
  AllowanceType,
  createValidDTO,
  FetchTokenClassesDto,
  GrantAllowanceDto,
  RegisterUserDto,
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
  required: (value: any) => !!value || 'Required.',
  greaterThanZero: (value: number) => value > 0 || 'Must be greater than 0.'
}

async function grantAllowance() {
  const isValid = await form.value.validate()
  if (!isValid.valid) return
  const tokenClient = new TokenApi(tokenContractUrl, browserClient)
  const connectionResult = await browserClient.connect()
  const publicKeyClient = new PublicKeyApi(publicContractUrl, browserClient)
  const result = await getPublicKey(connectionResult)
  if (!result) {
    //Need public key
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
    const adminWallet = await GetAdminWallet()
    if (!adminWallet?.gc_address) {
      showToast(`Unable to get admin wallet`, true)
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
      quantities: [{ quantity: new BigNumber(1), user: adminWallet?.gc_address }],
      allowanceType: AllowanceType.Mint,
      uses: BigNumber(quantity.value)
    })

    console.log(`Found class: ${classes}`)
    if (classes.Data && classes.Data && classes.Data[0]) {
      const allowanceGrant = await tokenClient.GrantAllowance(allowanceDto)
      if (allowanceGrant.Status === 1) {
        //Success!
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

// Initialize tokenClass with default values
const tokenClass = reactive<TokenClassKeyBody>({
  collection: 'MyCollection',
  category: 'Art',
  type: 'UniqueArtToken',
  additionalKey: 'Rare'
})

const quantity: Ref<number | undefined> = ref()
</script>
