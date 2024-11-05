<template>
  <v-container>
    <h1 class="text-center mb-6">Your Claimable Wins</h1>
    <v-row class="justify-center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-list v-if="data && data.length">
            <v-list-item v-for="(item, index) in data" :key="index" @click="checkClaimBurnable(item)" class=" my-4">
              <v-list-item-title class="text-h6">
                Won Token: <strong>{{ formatTokenName(item.giveawayToken) }}</strong>
              </v-list-item-title>
              <v-list-item-subtitle>
                <strong>Amount Won:</strong> {{ item.amountWon }}
              </v-list-item-subtitle>

              <v-list-item-subtitle v-if="item.burnToken">
                <strong>Burn Requirement:</strong> {{ item.burnTokenQuantity || 'No quantity specified' }} {{
                  formatTokenName(item.burnToken) }}
              </v-list-item-subtitle>


              <v-divider v-if="index < data.length - 1" class="my-2"></v-divider>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" color="primary" dark>
            No claimable wins yet!
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import type { ClaimableWinDto } from '@/utils/types';
import { BrowserConnectClient, TokenBalance, type BurnTokensRequest } from '@gala-chain/connect';
import BigNumber from 'bignumber.js';
import { useToast } from '@/composables/useToast';
import { claimWin } from '@/services/BackendApi';
const browserClient = new BrowserConnectClient()
const emit = defineEmits<{
  (e: 'reload'): void
}>()
const { showToast } = useToast()

// Define props
const props = defineProps<{
  data?: ClaimableWinDto[],
  balances: TokenBalance[],
}>();

// Format token name function
function formatTokenName(item: any): string {
  return `${item.category}|${item.additionalKey}|${item.collection}|${item.type}`;
}

// Claim burnable token function
async function checkClaimBurnable(win: ClaimableWinDto): Promise<void> {
  if (win.claimed) {
    // Handle case when win is already claimed
    showToast(`You've already claimed this`, true)
  } else {
    // Handle claim logic
    const relevantBalances = props.balances.filter((balance) => balance.additionalKey === win.burnToken.additionalKey && balance.category === win.burnToken.category && balance.collection === win.burnToken.collection && balance.type === win.burnToken.type)
    const totalQuantity = relevantBalances.reduce((accumulator, balance) => accumulator.plus(balance.quantity), new BigNumber(0));
    //Todo, a more thorough check here. This is convenience though, and is not a security issue

    const balance = totalQuantity.minus(new BigNumber(win.burnTokenQuantity));
    if (balance.gte(0)) {
      //Should be good
      await claimBurnable(win)

    } else {
      showToast(`You need: ${balance.multipliedBy(-1)} more of ${formatTokenName(win.burnToken)} to claim`, true)
    }
    console.log('Claiming burnable token');

  }
}

async function claimBurnable(win: ClaimableWinDto): Promise<void> {
  const connectClient = new BrowserConnectClient();
  await connectClient.connect()

  const burnTokenRequest: BurnTokensRequest = {
    tokenInstances: [{ quantity: win.burnTokenQuantity.toString() as any, tokenInstanceKey: { ...win.burnToken, instance: '0' as any } }]
  }

  const signedDto = await connectClient.sign("BurnTokens", burnTokenRequest)
  try {

    await claimWin({ ...signedDto, claimId: win._id })
    showToast('Win claimed!')
  } catch (e) {
    console.error(e);
    showToast(`Unable to claim giveway. ${(e as any).message}`, true)

  } finally {
    emit('reload')
  }

}


</script>

<style scoped>
.v-card-title {
  font-size: 1.5em;
  font-weight: bold;
}

.v-list-item-title {
  font-weight: bold;
}
</style>
