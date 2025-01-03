<template>
  <v-container>
    <h1 class="text-center">Your Balances</h1>
    <v-row class="justify-center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-divider></v-divider>
          <v-list v-if="data && data.length">
            <v-list-item v-for="(item, index) in data" :key="index" class="my-4"
              v-bind="clickable ? { onClick: () => handleClick(item, index) } : {}" @item-clicked=""
              :class="{ 'selected-token': checkEquivalance(item, tokenClass) }">

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
import { TokenBalance } from '@gala-chain/connect';
import { tokenToReadable } from '@/utils/GalaHelper';
import type { PropType } from 'vue';
import type { TokenClassKeyProperties } from '@gala-chain/api';

const props = defineProps({
  data: { type: Object as PropType<TokenBalance[]> },
  clickable: {
    type: Boolean, default: false, required: false
  },
  tokenClass: {
    type: Object as PropType<TokenClassKeyProperties>,
    required: false
  },
});

const emit = defineEmits<{
  (e: 'item-clicked', item: TokenBalance): void
}>()

const handleClick = (item: TokenBalance, index: number) => {
  emit('item-clicked', item);
};

function checkEquivalance(item1: TokenBalance, item2?: TokenClassKeyProperties) {
  return item2 && item1.additionalKey === item2.additionalKey && item1.category === item2.category && item1.collection === item2.collection && item1.type === item2.type
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

.selected-token {
  border: 2px solid #09f211;
}
</style>
