<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h5 font-weight-bold">
            Your Balances
          </v-card-title>
          <v-card-text>
            <v-list v-if="balances && balances.userBalances && balances.userBalances.Data.filter(token => Number(token.quantity) > 0).length" class="token-list scrollable-list">
              <TokenListItem
                v-for="(token, index) in balances.userBalances.Data.filter(token => Number(token.quantity) > 0)"
                :key="index"
                :token-name="getTokenSymbol(token)"
                :sub-text="`Balance: ${token.quantity}`"
                :token-image="getImage(token)"
                :is-selected="false"
                :clickable="false"
              />
            </v-list>
            <v-alert v-else type="info" color="primary" variant="tonal">
              No tokens in your wallet
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="text-h5 font-weight-bold">
            Giveaway Wallet Balances
          </v-card-title>
          <v-card-text>
            <v-list v-if="balances && balances.giveawayWalletBalances && balances.giveawayWalletBalances.Data.filter(token => Number(token.quantity) > 0).length" class="token-list scrollable-list">
              <TokenListItem
                v-for="(token, index) in balances.giveawayWalletBalances.Data.filter(token => Number(token.quantity) > 0)"
                :key="index"
                :token-name="getTokenSymbol(token)"
                :sub-text="`Balance: ${token.quantity}`"
                :token-image="getImage(token)"
                :is-selected="false"
                :clickable="false"
              />
            </v-list>
            <v-alert v-else type="info" color="primary" variant="tonal">
              No tokens in giveaway wallet
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import TokenListItem from '@/components/TokenListItem.vue';
import { getTokenSymbol } from '@/utils/GalaHelper';
import type { TokenClassKeyProperties } from '@gala-chain/api';

const profileStore = useProfileStore();
const { balances, metadata } = storeToRefs(profileStore);

const getImage = (token: TokenClassKeyProperties) => {
  if (!metadata.value) return '';
  
  const tokenClass = metadata.value.find(meta => 
    meta.collection === token.collection && 
    meta.category === token.category && 
    meta.type === token.type);
  
  return tokenClass ? tokenClass.image || '' : '';
};
</script>

<style scoped>
.token-list {
  padding: 0;
}

/* Reusable scrollable list styling */
.scrollable-list {
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  /* Firefox scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
}
</style>
