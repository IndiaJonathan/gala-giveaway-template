<template>
  <v-container v-if="!loading">
    <h1 class="text-center">Your Created Tokens</h1>
    <v-row class="justify-center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-list v-if="createdTokens && createdTokens.length" dense>
            <v-list-item v-for="(item, index) in createdTokens" :key="index" class="token-list-item"
              :class="{ 'selected-token': selectedToken?.id === item.id }" @click="handleTokenClick(item)" clickable>
              <v-img :src="item.tokenDetails.image" alt="Token Image" />
              <v-list-item-title class="text-h6">
                <strong>{{ item.tokenDetails.name }}</strong>
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" color="primary" dark>
            You haven't created any tokens on this wallet. Create one at:
            <a :href="galaConnectURL" target="_blank" style="color: #ffffff; text-decoration: underline;">Gala
              Connect</a>
          </v-alert> </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-progress-circular v-else indeterminate></v-progress-circular>
</template>

<script setup lang="ts">
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

async function load() {
  if (!props.gcAddress) return;
  loading.value = true;
  createdTokens.value = (await getCreatedTokens(props.gcAddress)).jobs
  loading.value = false;
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