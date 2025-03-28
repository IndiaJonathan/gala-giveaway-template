<template>
  <div class="created-giveaways-page">
    <!-- Main container with gradient background -->
    <v-container class="created-giveaways-container pa-0 mt-16" fluid>
      <div class="d-flex justify-space-between align-center px-10 pt-10 pb-6">
        <h1 class="text-white">My created items</h1>
        <v-btn color="primary" to="/create-giveaway" rounded="pill" class="create-btn">Create Giveaway</v-btn>
      </div>

      <!-- Tabs and filter section -->
      <div class="mx-10">
        <!-- Tabs for filtering -->
        <v-tabs v-model="tab" bg-color="transparent" color="white" class="giveaway-tabs">
          <v-tab value="active" class="text-white text-subtitle-1 font-weight-bold px-6">Active</v-tab>
          <v-tab value="past" class="text-subtitle-1 text-grey px-6">Past</v-tab>
        </v-tabs>

        <!-- Filter chips -->
        <div class="d-flex pa-4 filter-bg rounded-t-0">
          <v-btn
            :variant="selectedFilter === 'all' ? 'tonal' : 'text'"
            :class="selectedFilter === 'all' ? 'filter-active' : 'filter-inactive'" 
            class="mr-2"
            size="small"
            @click="selectedFilter = 'all'"
          >
            All
          </v-btn>
          <v-btn
            :variant="selectedFilter === 'tokens' ? 'tonal' : 'text'"
            :class="selectedFilter === 'tokens' ? 'filter-active' : 'filter-inactive'"
            size="small"
            @click="selectedFilter = 'tokens'"
          >
            Tokens
          </v-btn>
        </div>

        <!-- Giveaways table -->
        <giveaway-table
          :headers="tableHeaders"
          :items="filteredGiveaways"
          :loading="loading"
          empty-message="No created giveaways found for this filter."
          class="giveaway-table rounded-b-lg"
        >
          <template #name="{ item }">
            <div class="d-flex align-center">
              <v-avatar class="mr-3" size="40" rounded>
                <v-img :src="item.imageUrl || 'https://placehold.co/40x40'" :alt="item.name" />
              </v-avatar>
              <span class="text-white">{{ item.name }}</span>
            </div>
          </template>
          <template #status="{ item }">
            <v-chip 
              :color="getStatusColor(item.status)" 
              size="small" 
              class="text-uppercase font-weight-medium"
              density="comfortable"
            >
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
                <v-text-field
                  placeholder="Email address"
                  variant="outlined"
                  hide-details
                  class="email-input mr-2"
                  bg-color="rgba(255,255,255,0.05)"
                ></v-text-field>
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
}

const { showToast } = useToast();
const profileStore = useProfileStore();
const { connectedUserGCAddress } = storeToRefs(profileStore);

const tab = ref('active');
const selectedFilter = ref('all');
const giveaways = ref<CreatedGiveaway[]>([]);
const loading = ref(true);

// Table headers
const tableHeaders = [
  { key: 'name', title: 'NAME' },
  { key: 'status', title: 'STATUS' },
  { key: 'claimed', title: 'CLAIMED', formatter: (item: CreatedGiveaway) => `${item.claimed || 0} / ${item.totalQuantity || item.maxWinners}` },
  { key: 'startDateTime', title: 'START DATE', formatter: formatDate },
  { key: 'endDateTime', title: 'END DATE', formatter: formatDate }
];

// Format date function
function formatDate(dateString: string) {
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

// Filter giveaways based on selected tab and filter
const filteredGiveaways = computed(() => {
  // First filter by tab (active or past)
  const now = new Date();
  let filtered = giveaways.value;
  
  if (tab.value === 'active') {
    filtered = filtered.filter(g => new Date(g.endDateTime) >= now);
  } else if (tab.value === 'past') {
    filtered = filtered.filter(g => new Date(g.endDateTime) < now);
  }
  
  // Then filter by type (all or tokens)
  if (selectedFilter.value === 'tokens') {
    filtered = filtered.filter(g => g.giveawayTokenType === 'Balance' || g.giveawayTokenType === 'Token');
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

h1 {
  font-size: 2.5rem;
  font-weight: 600;
}

.create-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  padding: 0 20px;
}

.giveaway-tabs {
  border-bottom: none;
}

.giveaway-tabs .v-tab {
  text-transform: none;
  letter-spacing: 0;
  min-width: 80px;
}

.filter-bg {
  background-color: #1E1E1E;
}

.filter-active {
  background-color: #333333 !important;
  color: white;
}

.filter-inactive {
  color: #BBBBBB;
}

.giveaway-table {
  background-color: #121212;
  border: 1px solid rgba(255, 255, 255, 0.05);
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