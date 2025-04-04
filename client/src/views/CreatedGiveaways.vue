<template>
  <div class="created-giveaways-page">
    <!-- Main container with gradient background -->
    <v-container class="created-giveaways-container pa-0" fluid>
      <div class="hero-container" style="padding-top: 40px;"
        :class="{ 'mobile-hero-container': $vuetify.display.smAndDown, 'desktop-hero-container': !$vuetify.display.smAndDown }">
        <div class="hero-content px-10" :class="{ 'desktop-hero-content': !$vuetify.display.smAndDown }">
          <div :class="{ 'd-flex justify-space-between align-center': !$vuetify.display.smAndDown, 'd-flex flex-column': $vuetify.display.smAndDown }" style="width: 100%; max-width: 100%">
            <h1 style="margin: 0">My created items</h1>
            <v-btn :class="{ 'mt-4': $vuetify.display.smAndDown }" to="/create-giveaway" class="create-giveaway-btn">Create Giveaway</v-btn>
          </div>
        </div>
      </div>

      <!-- Tabs and filter section -->
      <div class="mx-10">
        <!-- Tabs for filtering -->
        <v-tabs v-model="tab" bg-color="transparent" color="white" class="giveaway-tabs">
          <v-tab value="active" class="text-white text-subtitle-1 font-weight-bold px-6">Active</v-tab>
          <v-tab value="past" class="text-subtitle-1 text-grey px-6">Past</v-tab>
        </v-tabs>

        <!-- Giveaways table -->
        <giveaway-table :headers="tableHeaders" :items="filteredGiveaways" :loading="loading"
          empty-message="No created giveaways found for this filter." class="giveaway-table rounded-lg">
          <template #name="{ item }">
            <div class="d-flex align-center">
              <v-avatar class="mr-2" size="40">
                <v-img :src="getTokenImage(item.giveawayToken)" :alt="item.name" />
              </v-avatar>
              <span>{{ getGiveawayDisplayName(item) }}</span>
            </div>
          </template>
          <template #status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small" class="text-uppercase font-weight-medium"
              density="comfortable">
              {{ item.status }}
            </v-chip>
          </template>
        </giveaway-table>
      </div>
    </v-container>

    <!-- Footer section -->
    <v-container fluid class="footer-container mt-16 px-10 py-12">
      <v-row>
        <v-col cols="12" md="3">
          <div class="d-flex flex-column">
            <div class="mb-8">
              <!-- <img src="@/assets/gala-giveaway-logo.svg" alt="GALA GIVEAWAY" class="gala-logo mb-4" onerror="this.src='https://placehold.co/180x50?text=GALA+GIVEAWAY'" /> -->
            </div>
            <div class="mb-8">
              <h3 class="text-white mb-4">Get the latest news</h3>
              <div class="d-flex">
                <v-text-field placeholder="Email address" variant="outlined" hide-details class="email-input mr-2"
                  bg-color="rgba(255,255,255,0.05)"></v-text-field>
                <v-btn class="submit-btn">Submit</v-btn>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Resources section -->
        <v-col cols="12" md="3">
          <h3 class="text-white mb-4">Resources</h3>
          <div class="footer-links">
            <a href="#" class="d-block mb-2">About</a>
            <a href="#" class="d-block mb-2">News</a>
            <a href="#" class="d-block mb-2">Contact us</a>
          </div>
        </v-col>

        <!-- Social media section -->
        <v-col cols="12" md="3">
          <h3 class="text-white mb-4">Social media</h3>
          <div class="footer-links">
            <a href="#" class="d-block mb-2">Discord</a>
            <a href="#" class="d-block mb-2">Twitter</a>
            <a href="#" class="d-block mb-2">Medium</a>
            <a href="#" class="d-block mb-2">Instagram</a>
          </div>
        </v-col>

        <!-- Ecosystem section -->
        <v-col cols="12" md="3">
          <h3 class="text-white mb-4">Ecosystem</h3>
          <div class="footer-links">
            <a href="#" class="d-block mb-2">GalaChain</a>
            <a href="#" class="d-block mb-2">Gala Film</a>
            <a href="#" class="d-block mb-2">Gala Music</a>
            <a href="#" class="d-block mb-2">Gala Games</a>
            <a href="#" class="d-block mb-2">GalaSwap</a>
          </div>
        </v-col>
      </v-row>

      <!-- Copyright section -->
      <v-row class="mt-12">
        <v-col cols="12" md="6">
          <p class="text-grey text-caption">©2022 Gala Fortunes. All rights reserved.</p>
        </v-col>
        <v-col cols="12" md="6" class="text-md-right">
          <a href="#" class="text-grey text-caption mr-4">Terms & Conditions</a>
          <a href="#" class="text-grey text-caption">Privacy Policy</a>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import { getCreatedGiveaways } from '@/services/BackendApi';
import GiveawayTable from '@/components/GiveawayTable.vue';
import { tokenToReadable } from '@/utils/GalaHelper';
import type { TokenClassKeyProperties } from '@gala-chain/api';

interface GiveawayToken {
  collection: string;
  type: string;
  category: string;
  additionalKey: string;
}

interface Winner {
  gcAddress: string;
  winAmount: string;
  completed: boolean;
  _id: string;
  error?: string;
}

interface CreatedGiveaway {
  _id: string;
  giveawayType: string;
  endDateTime: string;
  startDateTime?: string; // Added for compatibility
  telegramAuthRequired: boolean;
  giveawayToken: GiveawayToken;
  tokenQuantity: string;
  maxWinners: number;
  giveawayStatus: string;
  creator: string;
  requireBurnTokenToClaim: boolean;
  giveawayTokenType: string;
  winners: Winner[];
  usersSignedUp: string[];
  __v: number;
  winnerCount: number;
  isWinner: boolean;
  name?: string; // Will be derived from token info
  claimed?: number; // Will be calculated from winners
  totalQuantity?: number; // Will be derived from maxWinners
  claimsLeft?: number; // Number of remaining claims for FCFS giveaways
}

const { showToast } = useToast();
const profileStore = useProfileStore();
const { connectedUserGCAddress, metadata } = storeToRefs(profileStore);

const tab = ref('active');
const giveaways = ref<CreatedGiveaway[]>([]);
const loading = ref(true);

// Create a metadata map for token image lookup
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
  { key: 'claimed', title: 'CLAIMED', formatter: (item: CreatedGiveaway) => `${item.claimed || 0} / ${item.totalQuantity || item.maxWinners}` },
  { key: 'startDateTime', title: 'START DATE', formatter: (item: CreatedGiveaway) => formatDate(item.startDateTime) },
  { key: 'endDateTime', title: 'END DATE', formatter: (item: CreatedGiveaway) => formatDate(item.endDateTime) }
];

// Format date function
function formatDate(dateString: string | undefined) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Map API status to display status
const mapStatusToDisplay = (status: string): string => {
  switch (status) {
    case 'created':
      return 'SCHEDULED';
    case 'active':
      return 'IN PROGRESS';
    case 'completed':
      return 'FULLY CLAIMED';
    case 'cancelled':
      return 'WITHDRAWN';
    default:
      return status.toUpperCase();
  }
};

// Get color for status chip
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'IN PROGRESS':
      return 'success';
    case 'SCHEDULED':
      return 'info';
    case 'FULLY CLAIMED':
      return 'primary';
    case 'WITHDRAWN':
      return 'error';
    default:
      return 'grey';
  }
};

// Process giveaways data to match the expected format for display
const processGiveawaysData = (data: CreatedGiveaway[]) => {
  return data.map(giveaway => {
    // Use the custom name if available, otherwise generate from token info
    const name = giveaway.name || `${giveaway.giveawayToken.collection} ${giveaway.tokenQuantity} ${giveaway.giveawayTokenType}`;

    // Calculate claimed amount (completed winners)
    const claimed = giveaway.winners?.filter(winner => winner.completed).length || 0;

    // Map API status to display status
    const status = mapStatusToDisplay(giveaway.giveawayStatus);

    // Add derived fields to the giveaway object
    return {
      ...giveaway,
      name,
      claimed,
      totalQuantity: giveaway.maxWinners,
      status
    };
  });
};

// Add a helper function to display a more descriptive name for the giveaway
const getGiveawayDisplayName = (giveaway: CreatedGiveaway) => {
  // If giveaway has a name, use it
  if (giveaway.name) {
    return giveaway.name;
  }

  // Otherwise fallback to the token information
  const token = giveaway.giveawayToken;
  if (!token) return 'Unknown Giveaway';

  return `${token.collection} ${token.category} ${giveaway.giveawayType}`;
};

// Filter giveaways based on selected tab
const filteredGiveaways = computed(() => {
  // Filter by tab (active or past)
  const now = new Date();
  let filtered = giveaways.value;

  if (tab.value === 'active') {
    filtered = filtered.filter(g => {
      // Consider a giveaway as "past" if it's FCFS and has no claims left
      if (g.giveawayType === 'FirstComeFirstServe' && (g.claimsLeft === 0 || g.claimed === g.totalQuantity)) {
        return false; // Not active if all claims are used
      }
      // Otherwise use the normal date check
      return new Date(g.endDateTime) >= now;
    });
  } else if (tab.value === 'past') {
    filtered = filtered.filter(g => {
      // Include in "past" if it's FCFS and has no claims left
      if (g.giveawayType === 'FirstComeFirstServe' && (g.claimsLeft === 0 || g.claimed === g.totalQuantity)) {
        return true; // Considered past if all claims are used
      }
      // Otherwise use the normal date check
      return new Date(g.endDateTime) < now;
    });
  }

  return filtered;
});

// Fetch created giveaways
const fetchCreatedGiveaways = async () => {
  if (!connectedUserGCAddress.value) {
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const response = await getCreatedGiveaways(connectedUserGCAddress.value);
    console.log('Created giveaways:', response);

    // Process the API response to match the expected format
    giveaways.value = processGiveawaysData(response);
  } catch (error) {
    console.error('Error fetching created giveaways:', error);
    showToast(`Failed to fetch created items: ${(error as Error).message}`, true);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCreatedGiveaways();
});

watch(connectedUserGCAddress, () => {
  fetchCreatedGiveaways();
});
</script>

<style scoped>
.created-giveaways-page {
  background: linear-gradient(135deg, #121212 0%, #121212 60%, #3f1d36 100%);
  min-height: 100vh;
}

.created-giveaways-container {
  min-height: 80vh;
}

/* Mobile hero styling */
.mobile-hero-container {
  position: relative;
  width: 100%;
  height: 215px;
  z-index: 1;
  margin-top: 0;
  background: radial-gradient(60% 70% at 92% 95%, rgba(18, 18, 18, 0.65) 0%, rgba(18, 18, 18, 0.2) 100%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 1) 98%),
    linear-gradient(245.92deg, rgba(18, 18, 18, 0) 25%, rgba(18, 18, 18, 0.6) 87.84%),
    linear-gradient(155deg, #FF5722 0%, #FF8A00 30%, #FF7043 40%, #7E3FD1 70%, #B83FCF 100%);
}

/* Desktop hero styling */
.desktop-hero-container {
  position: relative;
  width: 100%;
  height: 215px;
  z-index: 1;
  background: radial-gradient(60% 70% at 92% 95%, rgba(18, 18, 18, 0.65) 0%, rgba(18, 18, 18, 0.2) 100%),
    linear-gradient(180deg, rgba(18, 18, 18, 0.15) 0%, rgba(18, 18, 18, 1) 98%),
    linear-gradient(245.92deg, rgba(18, 18, 18, 0) 25%, rgba(18, 18, 18, 0.6) 87.84%),
    linear-gradient(155deg, #FF5722 0%, #FF8A00 30%, #FF7043 40%, #7E3FD1 70%, #B83FCF 100%);
}

.hero-content {
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.desktop-hero-content {
  padding-top: 40px;
  width: 100%;
}

.hero-subtitle {
  font-family: 'Figtree', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 145%;
  color: #9E9E9E;
  margin: 0;
}

h1 {
  font-size: 2.5rem;
  font-weight: 600;
}

.create-giveaway-btn {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 36px;
  min-width: 160px;
  height: 48px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(9.99368px);
  border-radius: 100px;
  color: white;
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.5px;
  text-transform: none;
  transition: background 0.2s ease;
}

.create-giveaway-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.giveaway-tabs {
  border-bottom: none;
}

.giveaway-tabs .v-tab {
  text-transform: none;
  letter-spacing: 0;
  min-width: 80px;
}

.giveaway-table {
  background-color: #121212;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0 0 8px 8px;
}

/* Footer styling */
.footer-container {
  background-color: #121212;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.gala-logo {
  height: 50px;
}

.footer-links a {
  color: #BBBBBB;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: white;
}

.email-input {
  border-radius: 4px;
}

.submit-btn {
  background-color: #333333;
  color: white;
}
</style>