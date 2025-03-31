<template>
  <v-container class="won-giveaways-container pa-0" fluid>
    <h1 class="px-10 pt-10 pb-6">My claimed items</h1>

    <v-card flat class="mx-10">
      <v-card-text class="pa-0">
        <!-- Tabs for filtering -->
        <v-tabs v-model="tab" bg-color="#121212" color="white">
          <v-tab value="all">All</v-tab>
          <v-tab value="claimed">Claimed</v-tab>
          <v-tab value="burn_required">Burn required</v-tab>
        </v-tabs>

        <giveaway-table
          :headers="tableHeaders"
          :items="filteredWins"
          :loading="loading"
          empty-message="No items found for this filter."
        >
          <template #name="{ item }">
            <div class="d-flex align-center">
              <v-avatar class="mr-2" size="40">
                <v-img :src="getTokenImage(item.giveaway.giveawayToken)" alt="Item" />
              </v-avatar>
              <span>{{ getGiveawayDisplayName(item) }}</span>
            </div>
          </template>
          <template #status="{ item }">
            <v-chip v-if="item.claimed" color="success" size="small" class="text-uppercase">Claimed</v-chip>
            <v-chip v-else-if="item.giveaway.burnTokenQuantity" color="warning" size="small" class="text-uppercase">Token
              burn required</v-chip>
            <v-chip v-else color="success" size="small" class="text-uppercase">Won</v-chip>
          </template>
          <template #actions="{ item }">
            <div class="text-right">
              <v-btn v-if="item.giveaway.burnTokenQuantity && !item.claimed" color="primary" variant="flat" size="small"
                @click="handleBurn(item)">
                Burn
              </v-btn>
            </div>
          </template>
        </giveaway-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import { getClaimableWins, claimWin } from '@/services/BackendApi';
import { BrowserConnectClient, type BurnTokensRequest } from '@gala-chain/connect';
import GiveawayTable from '@/components/GiveawayTable.vue';
import BigNumber from 'bignumber.js';
import type { ClaimableWinDto } from '@/utils/types';
import { tokenToReadable } from '@/utils/GalaHelper';
import type { TokenClassKeyProperties } from '@gala-chain/api';

const { showToast } = useToast();
const profileStore = useProfileStore();
const { connectedUserGCAddress, metadata } = storeToRefs(profileStore);

const tab = ref('all');
const wins = ref<ClaimableWinDto[]>([]);
const loading = ref(true);

// Create a metadata map for token lookup
const metadataMap = computed(() => {
  const map = new Map();
  if (metadata.value) {
    metadata.value.forEach(meta => {
      const key = tokenToReadable(meta);
      map.set(key, meta);
    });
  }
  return map;
});

// Get token image from metadata
const getTokenImage = (token: TokenClassKeyProperties | undefined) => {
  if (!token) return 'https://placehold.co/40x40';
  
  const tokenClass = metadataMap.value.get(tokenToReadable(token));
  if (tokenClass && tokenClass.image) {
    return tokenClass.image;
  }
  return 'https://placehold.co/40x40';
};

// Table headers
const tableHeaders = [
  { key: 'name', title: 'NAME' },
  { key: 'status', title: 'STATUS' },
  { key: 'amountWon', title: 'QUANTITY' },
  { key: 'timeWon', title: 'TIME WON', formatter: (item: ClaimableWinDto) => item.timeWon ? formatDate(item.timeWon) : '-' },
  { key: 'claimedDate', title: 'CLAIMED DATE', formatter: (item: ClaimableWinDto) => item.timeClaimed ? formatDate(item.timeClaimed) : '-' },
  { key: 'claimFee', title: 'CLAIM FEE', formatter: (item: ClaimableWinDto) => {
    if (item.giveaway.burnTokenQuantity) return `${item.giveaway.burnTokenQuantity} $TOKEN`;
    return '-';
  }},
  { key: 'actions', title: '', align: 'text-right' }
];

// Format date function
const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Filter wins based on selected tab
const filteredWins = computed(() => {
  if (tab.value === 'all') {
    return wins.value;
  } else if (tab.value === 'claimed') {
    return wins.value.filter(win => win.claimed === true);
  } else if (tab.value === 'burn_required') {
    return wins.value.filter(win => 
      win.giveaway.burnTokenQuantity && 
      new BigNumber(win.giveaway.burnTokenQuantity).gt(0) && 
      !win.claimed
    );
  }
  return wins.value;
});

// Fetch claimable wins
const fetchClaimableWins = async () => {
  if (!connectedUserGCAddress.value) {
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const response = await getClaimableWins(connectedUserGCAddress.value);
    console.log('Claimable wins:', response);
    wins.value = response;

  } catch (error) {
    console.error('Error fetching claimable wins:', error);
    showToast(`Failed to fetch won items: ${(error as Error).message}`, true);
  } finally {
    loading.value = false;
  }
};

// Handle burn token action
const handleBurn = async (win: ClaimableWinDto) => {
  try {
    const connectClient = new BrowserConnectClient();
    await connectClient.connect();

    // Ensure burnToken has all required properties
    const tokenKey = {
      collection: win.giveaway.burnToken?.collection || '',
      category: win.giveaway.burnToken?.category || '',
      type: win.giveaway.burnToken?.type || '',
      additionalKey: win.giveaway.burnToken?.additionalKey || '',
      instance: '0'
    };

    const burnTokenRequest: BurnTokensRequest = {
      uniqueKey: `burn-token-${win._id}-${Date.now()}`,
      tokenInstances: [{
        quantity: win.giveaway.burnTokenQuantity || '0',
        tokenInstanceKey: tokenKey
      } as any]
    };

    const signedDto = await connectClient.sign("BurnTokens", burnTokenRequest);
    await claimWin({ ...signedDto, claimId: win._id });

    showToast('Giveaway won! Your item has been claimed successfully.', false);
    
    // Reload balances after successful claim
    await profileStore.getBalances(true);
    
    // Refresh the list after successful burn
    fetchClaimableWins();
  } catch (error) {
    console.error('Error burning tokens:', error);
    showToast(`Failed to burn tokens: ${(error as any).message || JSON.stringify(error)}`, true);
  }
};

// Add a helper function to display a more descriptive name for the giveaway
const getGiveawayDisplayName = (win: ClaimableWinDto) => {
  // If giveaway has a name, use it
  if (win.giveaway.name) {
    return win.giveaway.name;
  }
  
  // Otherwise fallback to the token information
  const token = win.giveaway.giveawayToken;
  if (!token) return 'Unknown Giveaway';
  
  return `${token.collection} ${token.category} ${win.giveaway.giveawayType}`;
};

onMounted(() => {
  fetchClaimableWins();
});

watch(connectedUserGCAddress, () => {
  fetchClaimableWins();
});
</script>

<style scoped>
.won-giveaways-container {
  min-height: 80vh;
}
</style>