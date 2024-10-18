<template>
  <v-container>
    <v-progress-circular v-if="isLoading" indeterminate size="64"></v-progress-circular>
    <v-form v-else="isLoading">
      <TokenInput
        ref="tokenInputRef"
        v-model:tokenClass="tokenClassReadOnly"
        :showQuantity="false"
        readOnly
      />
      <v-btn @click="grantAllowance" color="primary">Grant Allowance</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GetAdminQuantityAvailable, GetAdminWallet } from '@/services/BackendApi'
import { GalaChainApi } from '@/services/GalaChainApi'
import {
  createValidDTO,
  FetchAllowancesDto,
  type TokenClassKey,
  type TokenClassKeyBody
} from '@gala-chain/api'
import { ref, type PropType } from 'vue'
import TokenInput from './TokenInput.vue'

const props = defineProps({
  tokenClassKey: {
    type: Object as PropType<TokenClassKeyBody>,
    required: true
  }
})

const isLoading = ref(true)
const tokenClassReadOnly = { ...props.tokenClassKey }
const tokenService = GalaChainApi.getInstance()

const { showToast } = useToast()

async function grantAllowance() {
  const adminWallet = await GetAdminWallet()
  if (!adminWallet?.gc_address) {
    showToast(`Unable to get admin wallet`, true)
    return
  }
  await tokenService.init()
  if (!props.tokenClassKey) {
    showToast('Please select a token at step 1!')
  } else {
    const grant = await tokenService.grantAllowance(props.tokenClassKey, 1, adminWallet.gc_address)
    if ((grant as any).Status === 1) {
      // Success!
      showToast('Allowance Granted!')
    } else {
      showToast('Unable to grant allowance.', true)
    }
  }
}

async function loadBalances() {
  try {
    const adminWallet = await GetAdminWallet()
    await tokenService.init()

    if (!adminWallet || !adminWallet.gc_address) {
      showToast('Unable to get admin wallet info', true)
      return
    }

    const response = await GetAdminQuantityAvailable(props.tokenClassKey)
  } catch (e) {
    console.warn(e)
  } finally {
    isLoading.value = false
  }
}

loadBalances()
</script>
