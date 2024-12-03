<template>
  <v-container v-if="!loading">
    <div v-if="createdTokens && createdTokens.length">
      <h1 class="text-center">Your Created Tokens</h1>
      <v-row class="justify-center">
        <v-col cols="12" md="8">
          <v-card class="pa-4">
            <v-list dense>
              <v-list-item v-for="(item, index) in createdTokens" :key="index" class="token-list-item"
                :title=item.tokenDetails.name :class="{ 'selected-token': selectedToken?.id === item.id }"
                @click="handleTokenClick(item)" :prepend-avatar=item.tokenDetails.image clickable />

            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>


    <div v-if="pendingTokens && pendingTokens.length">
      <h1 class="text-center">Your Tokens Currently Pending Node Vote</h1>
      <v-row class="justify-center">
        <v-col cols="12" md="8">
          <v-card class="pa-4">
            <v-list dense>
              <v-list-item v-for="(item, index) in pendingTokens" :key="index" class="token-list-item"
                :title=item.tokenDetails.name :class="{ 'selected-token': selectedToken?.id === item.id }"
                :prepend-avatar=item.tokenDetails.image />
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-else-if="(!pendingTokens || !pendingTokens.length) && (!createdTokens || !createdTokens.length)"
      type="info" color="primary" dark>
      You haven't created any tokens on this wallet. Create one at:
      <a :href="galaConnectURL" target="_blank" style="color: #ffffff; text-decoration: underline;">Gala
        Connect</a>
    </v-alert>
  </v-container>
  <v-progress-circular v-else indeterminate></v-progress-circular>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import { getCreatedTokens, type Transaction } from '@/services/GalaSwapApi';
import { ref, watch, type Ref } from 'vue';
const selectedToken: Ref<Transaction | null> = ref(null);
const galaConnectURL = import.meta.env.VITE_GALA_CONNECT_URL



const loading = ref(false);
const props = defineProps<{
  gcAddress: string
}>()
const emit = defineEmits<{
  (e: 'clickedToken', token: Transaction): void
}>()

const createdTokens: Ref<Transaction[]> = ref([])
const pendingTokens: Ref<Transaction[]> = ref([])
const { showToast } = useToast()

async function load() {
  if (!props.gcAddress) return;
  try {

    loading.value = true;
    const jobs = await getCreatedTokens(props.gcAddress);
    createdTokens.value = jobs.completedJobs
    pendingTokens.value = jobs.pendingJobs
    loading.value = false;
  } catch (e) {
    showToast((e as any).message || JSON.stringify(e), true);
    console.error(e)
  } finally {
    loading.value = false;
  }
}

function handleTokenClick(token: Transaction) {
  selectedToken.value = token;
  emit('clickedToken', token)
}

watch(() => props.gcAddress, () => {
  load()
})

load();
</script>

<style scoped>
.token-list-item {
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 0;
  transition: background-color 0.3s;
}


.v-list-item-avatar img {
  border-radius: 8px;
}

.selected-token {
  border: 2px solid #09f211;
  /* Green border */
}
</style>