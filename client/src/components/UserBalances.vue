<template>
  <v-container>
    <h1 class="text-center">Your Balances</h1>
    <v-row class="justify-center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-divider></v-divider>
          <v-list v-if="data && data.length">
            <v-list-item v-for="(item, index) in data" :key="index" class="my-4">
              <v-list-item-title class="text-h6">
                Token: <strong>{{ tokenToReadable(item) }}</strong>
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-row>
                  <v-col cols="6"> <strong>Owned:</strong> {{ (item as any).quantity }} </v-col>
                </v-row>
              </v-list-item-subtitle>
              <v-divider style="margin-top: 10px;"></v-divider>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" color="primary" dark> No tokens yet! </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script lang="ts" setup>
import type { PropType } from 'vue';
import { type TokenClassKeyProperties } from "@gala-chain/api";
import type { TokenBalance } from '@gala-chain/connect';
import { tokenToReadable } from '@/utils/GalaHelper';

const props = defineProps<{
  data?: TokenBalance[],
}>();

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
